import { Course, HoleInfo, TeeColor, TeeDistance } from '../types';

export const TEE_OPTIONS: ReadonlyArray<{ value: TeeColor; label: string }> = [
  { value: 'white', label: 'White' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'blue', label: 'Blue' },
  { value: 'red', label: 'Red' },
  { value: 'black', label: 'Black' }
];

const YARDS_TO_METERS = 0.9144;

type LegacyHole = Omit<HoleInfo, 'tees'> & {
  yards?: Partial<Record<TeeColor, number>>;
  tees?: Array<TeeDistance | { tee: string; yards: number }>;
};

export function teeLabel(tee: string): string {
  return tee ? tee.charAt(0).toUpperCase() + tee.slice(1).toLowerCase() : '';
}

export function normalizeHoleDistances(hole: HoleInfo): HoleInfo {
  const legacy = hole as LegacyHole;
  const values = new Map<string, number>();

  (legacy.tees || []).forEach(item => {
    const meters = 'meters' in item ? Number(item.meters) : Math.round(Number(item.yards) * YARDS_TO_METERS);
    if (item.tee && meters > 0) values.set(item.tee.toLowerCase(), meters);
  });
  Object.entries(hole.meters || {}).forEach(([tee, meters]) => {
    if (!values.has(tee.toLowerCase()) && Number(meters) > 0) values.set(tee.toLowerCase(), Number(meters));
  });
  Object.entries(legacy.yards || {}).forEach(([tee, yards]) => {
    if (!values.has(tee.toLowerCase()) && Number(yards) > 0) {
      values.set(tee.toLowerCase(), Math.round(Number(yards) * YARDS_TO_METERS));
    }
  });

  const tees: TeeDistance[] = Array.from(values, ([tee, meters]) => ({ tee: tee.toUpperCase(), meters }));
  const meters = Object.fromEntries(values) as Partial<Record<TeeColor, number>>;
  const { yards: _legacyYards, ...metricHole } = legacy;
  return { ...metricHole, tees, meters };
}

export function normalizeCourseDistances(course: Course): Course {
  return { ...course, holes: (course.holes || []).map(normalizeHoleDistances) };
}

export function getHoleDistanceMeters(hole: HoleInfo, tee: string): number | undefined {
  const key = tee.toLowerCase();
  const explicit = (hole.tees || []).find(item => item.tee.toLowerCase() === key)?.meters;
  return explicit || hole.meters?.[key as TeeColor];
}

export function setHoleDistanceMeters(hole: HoleInfo, tee: string, distanceMeters: number): HoleInfo {
  const key = tee.toLowerCase() as TeeColor;
  const normalized = normalizeHoleDistances(hole);
  const tees = normalized.tees.filter(item => item.tee.toLowerCase() !== key);
  if (distanceMeters > 0) tees.push({ tee: key.toUpperCase(), meters: distanceMeters });
  return normalizeHoleDistances({ ...normalized, tees, meters: { ...normalized.meters, [key]: distanceMeters } });
}

export function getAvailableTees(course: Course): string[] {
  const found = new Set<string>();
  course.holes.forEach(hole => {
    normalizeHoleDistances(hole).tees.forEach(item => found.add(item.tee.toLowerCase()));
  });
  const order = TEE_OPTIONS.map(option => option.value);
  return Array.from(found).sort((a, b) => {
    const ai = order.indexOf(a as TeeColor);
    const bi = order.indexOf(b as TeeColor);
    return (ai < 0 ? order.length : ai) - (bi < 0 ? order.length : bi) || a.localeCompare(b);
  });
}
