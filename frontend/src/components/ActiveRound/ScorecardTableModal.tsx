import React from 'react';
import { X, Trophy, Printer } from 'lucide-react';
import { Course, GolfRound, HoleInfo } from '../../types';
import { calculatePlayerSummary, formatToPar, getScoreStyle, getScoreType } from '../../utils/golfStats';

interface ScorecardTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  round: GolfRound;
  onSelectHole?: (holeNumber: number) => void;
}

export const ScorecardTableModal: React.FC<ScorecardTableModalProps> = ({
  isOpen,
  onClose,
  course,
  round,
  onSelectHole
}) => {
  if (!isOpen) return null;

  const holesPlayed = round.holesPlayed;
  const is18Holes = holesPlayed === 18;

  const frontHoles = course.holes.filter(h => h.holeNumber <= 9);
  const backHoles = is18Holes ? course.holes.filter(h => h.holeNumber > 9 && h.holeNumber <= 18) : [];

  const frontPar = frontHoles.reduce((s, h) => s + h.par, 0);
  const backPar = backHoles.reduce((s, h) => s + h.par, 0);
  const totalPar = frontPar + backPar;

  const playerSummaries = round.players.map(p => calculatePlayerSummary(p, course, holesPlayed));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-6xl w-full p-4 sm:p-6 shadow-2xl border border-[#CCD7BE] animate-in fade-in my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E9EDD9]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#E9EDD9] text-[#2D3A27] border border-[#CCD7BE]">
                Official Scorecard
              </span>
              <span className="text-xs text-[#7E8F77] font-mono">
                {round.date ? new Date(round.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : ''}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-serif text-[#1D2619] mt-1">{round.courseName}</h2>
            <p className="text-xs text-[#6C7E64]">{round.courseLocation || course.location} • Par {totalPar} • {holesPlayed} Holes</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-2 rounded-lg bg-[#E9EDD9] hover:bg-[#DCE4D0] text-[#2D3A27] text-xs font-semibold flex items-center gap-1.5 transition-colors hidden sm:flex border border-[#CCD7BE]"
              title="Print Scorecard"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[#E9EDD9] text-[#7E8F77] hover:text-[#2D3A27]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scorecard Table View */}
        <div className="mt-5 overflow-x-auto border border-[#CCD7BE] rounded-xl shadow-xs">
          <table className="w-full text-center border-collapse text-xs">
            <thead>
              {/* Hole Header Row */}
              <tr className="bg-[#2D3A27] text-white font-bold text-[11px]">
                <th className="p-2.5 text-left pl-3 sticky left-0 bg-[#2D3A27] z-10 min-w-[130px]">Hole</th>
                {frontHoles.map(h => (
                  <th key={h.holeNumber} className="p-2 w-8 border-l border-[#3E4F37]">{h.holeNumber}</th>
                ))}
                <th className="p-2 w-10 bg-[#1D2619] text-[#E6CC7A] font-extrabold border-l border-[#3E4F37]">OUT</th>
                {backHoles.map(h => (
                  <th key={h.holeNumber} className="p-2 w-8 border-l border-[#3E4F37]">{h.holeNumber}</th>
                ))}
                {is18Holes && (
                  <th className="p-2 w-10 bg-[#1D2619] text-[#E6CC7A] font-extrabold border-l border-[#3E4F37]">IN</th>
                )}
                <th className="p-2 w-12 bg-[#1A2315] text-[#CCD7BE] font-bold border-l border-[#3E4F37]">TOT</th>
                <th className="p-2 w-10 bg-[#1D2619] text-[#CCD7BE] border-l border-[#3E4F37]">NET</th>
                <th className="p-2 w-10 bg-[#1D2619] text-[#CCD7BE] border-l border-[#3E4F37]">+/-</th>
              </tr>

              {/* Par Row */}
              <tr className="bg-[#E9EDD9] text-[#2D3A27] font-bold border-b border-[#CCD7BE]">
                <td className="p-2 text-left pl-3 sticky left-0 bg-[#E9EDD9] z-10 font-bold">Par</td>
                {frontHoles.map(h => (
                  <td key={h.holeNumber} className="p-2 border-l border-[#CCD7BE]">{h.par}</td>
                ))}
                <td className="p-2 bg-[#DCE4D0] font-extrabold border-l border-[#CCD7BE]">{frontPar}</td>
                {backHoles.map(h => (
                  <td key={h.holeNumber} className="p-2 border-l border-[#CCD7BE]">{h.par}</td>
                ))}
                {is18Holes && (
                  <td className="p-2 bg-[#DCE4D0] font-extrabold border-l border-[#CCD7BE]">{backPar}</td>
                )}
                <td className="p-2 bg-[#8EA67B]/30 text-[#1D2619] font-bold border-l border-[#CCD7BE]">{totalPar}</td>
                <td className="p-2 bg-[#E9EDD9] border-l border-[#CCD7BE]">-</td>
                <td className="p-2 bg-[#E9EDD9] border-l border-[#CCD7BE]">E</td>
              </tr>

              {/* Handicap Index Row */}
              <tr className="bg-[#F7F9F2] text-[#7E8F77] text-[10px] border-b border-[#CCD7BE]">
                <td className="p-1.5 text-left pl-3 sticky left-0 bg-[#F7F9F2] z-10 font-semibold">Handicap Index</td>
                {frontHoles.map(h => (
                  <td key={h.holeNumber} className="p-1.5 border-l border-[#CCD7BE]">{h.handicapIndex}</td>
                ))}
                <td className="p-1.5 bg-[#E9EDD9] border-l border-[#CCD7BE]">-</td>
                {backHoles.map(h => (
                  <td key={h.holeNumber} className="p-1.5 border-l border-[#CCD7BE]">{h.handicapIndex}</td>
                ))}
                {is18Holes && (
                  <td className="p-1.5 bg-[#E9EDD9] border-l border-[#CCD7BE]">-</td>
                )}
                <td className="p-1.5 bg-[#E9EDD9] border-l border-[#CCD7BE]">-</td>
                <td className="p-1.5 bg-[#E9EDD9] border-l border-[#CCD7BE]">-</td>
                <td className="p-1.5 bg-[#E9EDD9] border-l border-[#CCD7BE]">-</td>
              </tr>
            </thead>

            {/* Players Rows */}
            <tbody className="divide-y divide-[#CCD7BE]">
              {round.players.map((p, pIdx) => {
                const summary = playerSummaries[pIdx];

                return (
                  <tr key={p.playerId} className="hover:bg-[#F7F9F2]/80 transition-colors">
                    {/* Player Info Sticky Col */}
                    <td className="p-2.5 text-left pl-3 sticky left-0 bg-white shadow-xs z-10 font-bold text-[#1D2619] border-r border-[#CCD7BE]">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: p.teeColor === 'black' ? '#1D2619' : p.teeColor === 'blue' ? '#3B5360' : p.teeColor === 'red' ? '#9E4747' : '#5A6F4E' }}
                        />
                        <div>
                          <div className="text-xs font-bold leading-tight">{p.playerName}</div>
                          <div className="text-[10px] text-[#7E8F77] font-normal">Hcp: {p.handicap}</div>
                        </div>
                      </div>
                    </td>

                    {/* Front 9 Hole Scores */}
                    {frontHoles.map(h => {
                      const hScore = p.holeScores[h.holeNumber];
                      const strokes = hScore?.strokes || 0;
                      const scoreType = strokes > 0 ? getScoreType(strokes, h.par) : 'unplayed';
                      const style = getScoreStyle(scoreType);

                      return (
                        <td
                          key={h.holeNumber}
                          onClick={() => {
                            if (onSelectHole) {
                              onSelectHole(h.holeNumber);
                              onClose();
                            }
                          }}
                          className="p-1.5 border-l border-[#CCD7BE] cursor-pointer hover:bg-[#E9EDD9]"
                        >
                          {strokes > 0 ? (
                            <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-bold ${style.bg} ${style.shape}`}>
                              {strokes}
                            </span>
                          ) : (
                            <span className="text-[#CCD7BE]">-</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Front 9 OUT Sum */}
                    <td className="p-2 bg-[#F7F9F2] font-bold text-[#1D2619] border-l border-[#CCD7BE]">
                      {summary.frontNineGross > 0 ? summary.frontNineGross : '-'}
                    </td>

                    {/* Back 9 Hole Scores */}
                    {backHoles.map(h => {
                      const hScore = p.holeScores[h.holeNumber];
                      const strokes = hScore?.strokes || 0;
                      const scoreType = strokes > 0 ? getScoreType(strokes, h.par) : 'unplayed';
                      const style = getScoreStyle(scoreType);

                      return (
                        <td
                          key={h.holeNumber}
                          onClick={() => {
                            if (onSelectHole) {
                              onSelectHole(h.holeNumber);
                              onClose();
                            }
                          }}
                          className="p-1.5 border-l border-[#CCD7BE] cursor-pointer hover:bg-[#E9EDD9]"
                        >
                          {strokes > 0 ? (
                            <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-bold ${style.bg} ${style.shape}`}>
                              {strokes}
                            </span>
                          ) : (
                            <span className="text-[#CCD7BE]">-</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Back 9 IN Sum */}
                    {is18Holes && (
                      <td className="p-2 bg-[#F7F9F2] font-bold text-[#1D2619] border-l border-[#CCD7BE]">
                        {summary.backNineGross > 0 ? summary.backNineGross : '-'}
                      </td>
                    )}

                    {/* Total Gross */}
                    <td className="p-2 bg-[#E9EDD9] font-bold text-[#1D2619] text-sm border-l border-[#CCD7BE]">
                      {summary.grossTotal > 0 ? summary.grossTotal : '-'}
                    </td>

                    {/* Total Net */}
                    <td className="p-2 bg-[#F7F9F2] font-bold text-[#2D3A27] border-l border-[#CCD7BE]">
                      {summary.netTotal > 0 ? summary.netTotal : '-'}
                    </td>

                    {/* To Par */}
                    <td className="p-2 bg-[#F7F9F2] font-bold border-l border-[#CCD7BE]">
                      {summary.grossTotal > 0 ? (
                        <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold ${
                          summary.toParTotal === 0
                            ? 'bg-[#E9EDD9] text-[#2D3A27]'
                            : summary.toParTotal < 0
                            ? 'bg-[#FDF0ED] text-[#9E4747]'
                            : 'bg-[#E9EDD9] text-[#2D3A27]'
                        }`}>
                          {formatToPar(summary.toParTotal)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend & Stats Quick Row */}
        <div className="mt-4 p-3 bg-[#F7F9F2] rounded-xl border border-[#CCD7BE] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3 text-[#6C7E64]">
            <span className="font-semibold text-[#1D2619]">Legend:</span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 rounded-full bg-[#C2A649] text-[#1D2619] font-bold inline-flex items-center justify-center text-[10px]">E</span> Eagle/Better
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 rounded-full bg-[#9E4747] text-white font-bold inline-flex items-center justify-center text-[10px]">B</span> Birdie
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 rounded-md bg-[#5A6F4E] text-white font-bold inline-flex items-center justify-center text-[10px]">P</span> Par
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 rounded-none bg-[#3B5360] text-white inline-flex items-center justify-center text-[10px]">B</span> Bogey
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 rounded-none ring-1 ring-[#5C4532] bg-[#5C4532] text-white inline-flex items-center justify-center text-[10px]">D</span> Double+
            </span>
          </div>

          <div className="text-[#7E8F77] italic text-[11px]">
            * Click on any hole score cell above to jump to that hole.
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#2D3A27] hover:bg-[#1D2619] text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
