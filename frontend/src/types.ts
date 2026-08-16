export interface HoleInfo {
  holeNumber: number; // 1 to 18
  par: number; // 3, 4, 5, or 6
  handicapIndex: number; // 1 to 18
  tees: TeeDistance[];
  meters?: Partial<Record<TeeColor, number>>;
  notes?: string;
}

export interface TeeDistance {
  tee: string;
  meters: number;
}

export interface Course {
  id: string;
  name: string;
  location: string;
  city?: string;
  country?: string;
  holesCount: 9 | 18;
  holes: HoleInfo[];
  availableTees?: string[];
  parTotal: number;
  rating?: number;
  slope?: number;
  createdAt: string;
  isCustom?: boolean;
}

export type TeeColor = 'red' | 'yellow' | 'white' | 'blue' | 'black';

export interface Player {
  id: string;
  name: string;
  handicapIndex: number;
  defaultTee: TeeColor;
  avatarBg: string;
  createdAt: string;
}

export type FairwayHit = 'hit' | 'left' | 'right' | 'na';

export interface PlayerHoleScore {
  holeNumber: number;
  strokes: number; // 0 means unplayed, >= 1 is score
  putts: number;
  fairwayHit: FairwayHit;
  greenInRegulation: boolean;
  penalties: number;
  sandSave?: boolean;
}

export interface PlayerRoundScore {
  playerId: string;
  playerName: string;
  handicap: number;
  teeColor: TeeColor;
  holeScores: Record<number, PlayerHoleScore>;
}

export type GameFormat = 'stroke' | 'stableford' | 'match';

export interface GolfRound {
  id: string;
  date: string; // ISO date string
  courseId: string;
  courseName: string;
  courseLocation: string;
  holesPlayed: 9 | 18;
  startingHole: number;
  format: GameFormat;
  status: 'in_progress' | 'completed';
  weather?: string;
  notes?: string;
  players: PlayerRoundScore[];
  createdAt: string;
  updatedAt: string;
}

export interface HoleScoreStats {
  gross: number;
  net: number;
  toPar: number;
  scoreType: 'albatross' | 'eagle' | 'birdie' | 'par' | 'bogey' | 'double_bogey' | 'triple_plus' | 'hole_in_one' | 'unplayed';
}

export interface PlayerRoundSummary {
  playerId: string;
  playerName: string;
  grossTotal: number;
  netTotal: number;
  toParTotal: number;
  frontNineGross: number;
  backNineGross: number;
  frontNineNet: number;
  backNineNet: number;
  totalPutts: number;
  puttsPerHole: number;
  fairwaysHit: number;
  fairwaysTotal: number;
  fairwayPct: number;
  greensInRegulation: number;
  greensTotal: number;
  girPct: number;
  penalties: number;
  stablefordPoints?: number;
  eagles: number;
  birdies: number;
  pars: number;
  bogeys: number;
  doubleBogeys: number;
  triplePlus: number;
  holesCompleted: number;
}
