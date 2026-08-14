import { Course, GolfRound, HoleInfo, HoleScoreStats, Player, PlayerHoleScore, PlayerRoundScore, PlayerRoundSummary, TeeColor } from '../types';

export function getScoreType(strokes: number, par: number): HoleScoreStats['scoreType'] {
  if (strokes === 0) return 'unplayed';
  if (strokes === 1) return 'hole_in_one';
  const diff = strokes - par;
  if (diff <= -3) return 'albatross';
  if (diff === -2) return 'eagle';
  if (diff === -1) return 'birdie';
  if (diff === 0) return 'par';
  if (diff === 1) return 'bogey';
  if (diff === 2) return 'double_bogey';
  return 'triple_plus';
}

export function getScoreLabel(scoreType: HoleScoreStats['scoreType'], strokes: number, par: number): string {
  switch (scoreType) {
    case 'hole_in_one': return 'Hole in One! 🏆';
    case 'albatross': return 'Albatross (-3) 🦅🦅';
    case 'eagle': return 'Eagle (-2) 🦅';
    case 'birdie': return 'Birdie (-1) 🎯';
    case 'par': return 'Par (E) ⛳';
    case 'bogey': return 'Bogey (+1)';
    case 'double_bogey': return 'Double Bogey (+2)';
    case 'triple_plus': return `+${strokes - par} (${strokes})`;
    default: return 'Not Played';
  }
}

export function getScoreStyle(scoreType: HoleScoreStats['scoreType']) {
  switch (scoreType) {
    case 'hole_in_one':
      return {
        bg: 'bg-[#C2A649] text-white font-bold',
        border: 'border-[#C2A649]',
        badge: 'bg-[#FBF6E2] text-[#8C6F1E] border-[#E6CC7A]',
        text: 'text-[#8C6F1E]',
        shape: 'rounded-full ring-4 ring-[#E6CC7A] ring-offset-1'
      };
    case 'albatross':
    case 'eagle':
      return {
        bg: 'bg-[#C2A649] text-[#1D2619] font-black',
        border: 'border-[#B89535]',
        badge: 'bg-[#FBF6E2] text-[#8C6F1E] border-[#E6CC7A]',
        text: 'text-[#8C6F1E]',
        shape: 'rounded-full ring-2 ring-[#C2A649]'
      };
    case 'birdie':
      return {
        bg: 'bg-[#9E4747] text-white font-bold',
        border: 'border-[#8A3B3B]',
        badge: 'bg-[#FDF2F2] text-[#9E4747] border-[#F2C4C4]',
        text: 'text-[#9E4747]',
        shape: 'rounded-full'
      };
    case 'par':
      return {
        bg: 'bg-[#2D3A27] text-white font-semibold',
        border: 'border-[#263221]',
        badge: 'bg-[#E9EDD9] text-[#2D3A27] border-[#CCD7BE]',
        text: 'text-[#2D3A27]',
        shape: 'rounded-lg'
      };
    case 'bogey':
      return {
        bg: 'bg-[#4F6D7A] text-white font-medium',
        border: 'border-[#3D5763]',
        badge: 'bg-[#EDF4F7] text-[#34515E] border-[#CADCE3]',
        text: 'text-[#34515E]',
        shape: 'rounded-none'
      };
    case 'double_bogey':
      return {
        bg: 'bg-[#5C5248] text-white font-medium',
        border: 'border-[#463D34]',
        badge: 'bg-[#F3EFEA] text-[#5C5248] border-[#D9CFC4]',
        text: 'text-[#5C5248]',
        shape: 'rounded-none ring-2 ring-[#B8ACA0]'
      };
    case 'triple_plus':
      return {
        bg: 'bg-[#3E3730] text-white font-medium',
        border: 'border-[#2C2621]',
        badge: 'bg-[#EAE4DC] text-[#3E3730] border-[#C8BEB2]',
        text: 'text-[#3E3730]',
        shape: 'rounded-none ring-2 ring-[#8C7E70]'
      };
    default:
      return {
        bg: 'bg-[#E9EDD9] text-[#7E8F77]',
        border: 'border-[#CCD7BE]',
        badge: 'bg-[#F7F9F2] text-[#7E8F77] border-[#D7DFC9]',
        text: 'text-[#7E8F77]',
        shape: 'rounded-lg'
      };
  }
}

/**
 * Calculates strokes given on a specific hole based on course handicap and hole handicap index.
 */
export function getHoleHandicapStrokes(playerHandicap: number, holeHandicapIndex: number, holesPlayed: 9 | 18 = 18): number {
  if (!playerHandicap || playerHandicap === 0) return 0;
  const courseHandicap = Math.round(holesPlayed === 9 ? playerHandicap / 2 : playerHandicap);
  
  if (courseHandicap <= 0) return 0;

  let strokes = 0;
  // Base strokes (e.g. handicap 20 gives 1 stroke on every hole 1-18, and 1 extra stroke on holes index 1 and 2)
  const base = Math.floor(courseHandicap / (holesPlayed === 9 ? 9 : 18));
  strokes += base;

  const remainder = courseHandicap % (holesPlayed === 9 ? 9 : 18);
  if (holeHandicapIndex <= remainder) {
    strokes += 1;
  }

  return strokes;
}

/**
 * Calculates Stableford points for a hole score
 */
export function calculateStablefordPoints(strokes: number, par: number, handicapStrokes: number): number {
  if (strokes <= 0) return 0;
  const netScore = strokes - handicapStrokes;
  const netDiff = netScore - par;

  if (netDiff <= -4) return 6;
  if (netDiff === -3) return 5; // Net Albatross
  if (netDiff === -2) return 4; // Net Eagle
  if (netDiff === -1) return 3; // Net Birdie
  if (netDiff === 0) return 2;  // Net Par
  if (netDiff === 1) return 1;  // Net Bogey
  return 0;                     // Double bogey or worse
}

/**
 * Computes full round summary metrics for a player
 */
export function calculatePlayerSummary(
  playerScore: PlayerRoundScore,
  course: Course,
  holesPlayed: 9 | 18 = 18
): PlayerRoundSummary {
  let grossTotal = 0;
  let netTotal = 0;
  let toParTotal = 0;
  let frontNineGross = 0;
  let backNineGross = 0;
  let frontNineNet = 0;
  let backNineNet = 0;
  let totalPutts = 0;
  let fairwaysHit = 0;
  let fairwaysTotal = 0;
  let greensInRegulation = 0;
  let greensTotal = 0;
  let penalties = 0;
  let stablefordPoints = 0;

  let eagles = 0;
  let birdies = 0;
  let pars = 0;
  let bogeys = 0;
  let doubleBogeys = 0;
  let triplePlus = 0;
  let holesCompleted = 0;

  const maxHoles = Math.min(course.holes.length, holesPlayed);

  for (let i = 1; i <= maxHoles; i++) {
    const hole = course.holes.find(h => h.holeNumber === i) || {
      holeNumber: i,
      par: 4,
      handicapIndex: i,
      yards: { red: 300, white: 350, blue: 380, black: 400 }
    };

    const holeScore = playerScore.holeScores[i];
    if (holeScore && holeScore.strokes > 0) {
      holesCompleted++;
      const strokes = holeScore.strokes;
      const handicapStrokes = getHoleHandicapStrokes(playerScore.handicap, hole.handicapIndex, holesPlayed);
      const net = strokes - handicapStrokes;
      const diff = strokes - hole.par;

      grossTotal += strokes;
      netTotal += net;
      toParTotal += diff;

      if (i <= 9) {
        frontNineGross += strokes;
        frontNineNet += net;
      } else {
        backNineGross += strokes;
        backNineNet += net;
      }

      totalPutts += (holeScore.putts || 0);
      penalties += (holeScore.penalties || 0);

      // Fairways (only par 4 and 5)
      if (hole.par >= 4) {
        if (holeScore.fairwayHit !== 'na') {
          fairwaysTotal++;
          if (holeScore.fairwayHit === 'hit') {
            fairwaysHit++;
          }
        }
      }

      // GIR
      greensTotal++;
      if (holeScore.greenInRegulation) {
        greensInRegulation++;
      }

      // Stableford
      stablefordPoints += calculateStablefordPoints(strokes, hole.par, handicapStrokes);

      // Score type counters
      const st = getScoreType(strokes, hole.par);
      if (st === 'hole_in_one' || st === 'albatross' || st === 'eagle') {
        eagles++;
      } else if (st === 'birdie') {
        birdies++;
      } else if (st === 'par') {
        pars++;
      } else if (st === 'bogey') {
        bogeys++;
      } else if (st === 'double_bogey') {
        doubleBogeys++;
      } else if (st === 'triple_plus') {
        triplePlus++;
      }
    }
  }

  return {
    playerId: playerScore.playerId,
    playerName: playerScore.playerName,
    grossTotal,
    netTotal,
    toParTotal,
    frontNineGross,
    backNineGross,
    frontNineNet,
    backNineNet,
    totalPutts,
    puttsPerHole: holesCompleted > 0 ? Number((totalPutts / holesCompleted).toFixed(1)) : 0,
    fairwaysHit,
    fairwaysTotal,
    fairwayPct: fairwaysTotal > 0 ? Math.round((fairwaysHit / fairwaysTotal) * 100) : 0,
    greensInRegulation,
    greensTotal,
    girPct: greensTotal > 0 ? Math.round((greensInRegulation / greensTotal) * 100) : 0,
    penalties,
    stablefordPoints,
    eagles,
    birdies,
    pars,
    bogeys,
    doubleBogeys,
    triplePlus,
    holesCompleted
  };
}

export function formatToPar(diff: number): string {
  if (diff === 0) return 'E';
  if (diff > 0) return `+${diff}`;
  return `${diff}`;
}

export function getTeeBadge(tee: TeeColor) {
  switch (tee) {
    case 'black': return { label: 'Black Tees', bg: 'bg-neutral-900 text-white border-neutral-700' };
    case 'blue': return { label: 'Blue Tees', bg: 'bg-blue-700 text-white border-blue-600' };
    case 'white': return { label: 'White Tees', bg: 'bg-neutral-100 text-neutral-800 border-neutral-300' };
    case 'red': return { label: 'Red Tees', bg: 'bg-rose-600 text-white border-rose-500' };
  }
}
