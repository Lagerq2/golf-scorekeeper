import React, { useState, useRef } from 'react';
import { Course, GolfRound, PlayerHoleScore, PlayerRoundScore, TeeColor } from '../../types';
import { HoleNavigator } from './HoleNavigator';
import { HoleInfoCard } from './HoleInfoCard';
import { ScoreCounterCard } from './ScoreCounterCard';
import { ScorecardTableModal } from './ScorecardTableModal';
import { FinishRoundModal } from './FinishRoundModal';
import { Table, CheckCircle2, User, Trophy, Play, Plus, Flag, ShieldCheck, Trash2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { calculatePlayerSummary, formatToPar, getHoleHandicapStrokes } from '../../utils/golfStats';
import { triggerHaptic } from '../../utils/haptics';

interface ActiveRoundViewProps {
  round: GolfRound;
  course: Course;
  onUpdateRound: (updatedRound: GolfRound) => Promise<void>;
  onCompleteRound: (weather: string, notes: string) => Promise<void>;
  onStartNewRoundPrompt: () => void;
  onDiscardRound?: () => Promise<void>;
}

export const ActiveRoundView: React.FC<ActiveRoundViewProps> = ({
  round,
  course,
  onUpdateRound,
  onCompleteRound,
  onStartNewRoundPrompt,
  onDiscardRound
}) => {
  const [currentHoleNumber, setCurrentHoleNumber] = useState<number>(round.startingHole || 1);
  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(0);
  const [isScorecardModalOpen, setIsScorecardModalOpen] = useState<boolean>(false);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState<boolean>(false);
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState<boolean>(false);
  const [isDiscarding, setIsDiscarding] = useState<boolean>(false);

  // Touch swipe handling
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const maxHoles = Math.min(course.holes.length, round.holesPlayed);

  const currentHole = course.holes.find(h => h.holeNumber === currentHoleNumber) || {
    holeNumber: currentHoleNumber,
    par: 4,
    handicapIndex: currentHoleNumber,
    tees: [{ tee: 'WHITE', meters: 320 }],
    meters: { white: 320 }
  };

  const activePlayer = round.players[activePlayerIndex] || round.players[0];

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;

    const diffX = touchStartXRef.current - e.changedTouches[0].clientX;
    const diffY = touchStartYRef.current - e.changedTouches[0].clientY;

    // Only trigger if horizontal swipe is dominant and above 55px
    if (Math.abs(diffX) > 55 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
      if (diffX > 0 && currentHoleNumber < maxHoles) {
        // Swiped Left -> Next Hole
        triggerHaptic('light');
        setCurrentHoleNumber(prev => prev + 1);
      } else if (diffX < 0 && currentHoleNumber > 1) {
        // Swiped Right -> Previous Hole
        triggerHaptic('light');
        setCurrentHoleNumber(prev => prev - 1);
      }
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  const handleUpdateScore = async (holeNum: number, updates: Partial<PlayerHoleScore>) => {
    const updatedPlayers = [...round.players];
    const playerToUpdate = { ...updatedPlayers[activePlayerIndex] };
    const currentScores = { ...playerToUpdate.holeScores };
    
    const existing = currentScores[holeNum] || {
      holeNumber: holeNum,
      strokes: 0,
      putts: 2,
      fairwayHit: currentHole.par >= 4 ? 'hit' : 'na',
      greenInRegulation: false,
      penalties: 0,
      bunkerShots: 0,
      sandSave: false
    };

    currentScores[holeNum] = {
      ...existing,
      ...updates
    };

    playerToUpdate.holeScores = currentScores;
    updatedPlayers[activePlayerIndex] = playerToUpdate;

    const updatedRound: GolfRound = {
      ...round,
      players: updatedPlayers,
      updatedAt: new Date().toISOString()
    };

    await onUpdateRound(updatedRound);
  };

  // Quick action: Fill par for all players on the current hole
  const handleParForAll = async () => {
    triggerHaptic('success');
    const updatedPlayers = round.players.map(p => {
      const currentScores = { ...p.holeScores };
      currentScores[currentHoleNumber] = {
        holeNumber: currentHoleNumber,
        strokes: currentHole.par,
        putts: 2,
        fairwayHit: currentHole.par >= 4 ? 'hit' : 'na',
        greenInRegulation: true,
        penalties: 0,
        bunkerShots: 0,
        sandSave: false
      };
      return {
        ...p,
        holeScores: currentScores
      };
    });

    await onUpdateRound({
      ...round,
      players: updatedPlayers,
      updatedAt: new Date().toISOString()
    });
  };

  const activeSummary = calculatePlayerSummary(activePlayer, course, round.holesPlayed);

  return (
    <div
      className="max-w-4xl mx-auto space-y-4 pb-24 md:pb-12"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      
      {/* Top Banner with Quick Actions */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-[#CCD7BE] flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#E9EDD9] text-[#2D3A27] border border-[#CCD7BE]">
              Live Round
            </span>
            <span className="text-xs text-[#7E8F77] font-mono">
              Format: <strong className="text-[#1D2619] uppercase">{round.format}</strong>
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold font-serif text-[#1D2619] mt-1">{round.courseName}</h1>
          <p className="text-xs text-[#6C7E64]">{course.location || round.courseLocation} • {round.holesPlayed} Holes</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Discard Round Option */}
          {onDiscardRound && (
            isDiscardConfirmOpen ? (
              <div className="flex items-center gap-1.5 bg-[#FDF0ED] p-1 rounded-xl border border-[#E5B5AA]">
                <span className="text-[11px] font-bold text-[#9E4747] px-1">Discard round?</span>
                <button
                  id="btn-confirm-discard-round"
                  disabled={isDiscarding}
                  onClick={async () => {
                    try {
                      setIsDiscarding(true);
                      await onDiscardRound();
                    } finally {
                      setIsDiscarding(false);
                      setIsDiscardConfirmOpen(false);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#9E4747] hover:bg-[#833838] text-white font-bold text-xs shadow-xs transition-colors"
                >
                  {isDiscarding ? 'Discarding...' : 'Yes, Discard'}
                </button>
                <button
                  disabled={isDiscarding}
                  onClick={() => setIsDiscardConfirmOpen(false)}
                  className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 text-[#2D3A27] font-semibold text-xs border border-[#CCD7BE] transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                id="btn-discard-active-round"
                onClick={() => setIsDiscardConfirmOpen(true)}
                className="p-2 text-[#7E8F77] hover:text-[#9E4747] hover:bg-[#FDF0ED] rounded-xl transition-colors border border-transparent hover:border-[#E5B5AA]"
                title="Discard / Remove In-Progress Round"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )
          )}

          {/* View Full Scorecard Button */}
          <button
            id="btn-open-scorecard-table"
            onClick={() => {
              triggerHaptic('light');
              setIsScorecardModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-[#E9EDD9] hover:bg-[#DCE4D0] active:scale-95 text-[#2D3A27] text-xs font-bold flex items-center gap-1.5 transition-all border border-[#CCD7BE] touch-manipulation"
          >
            <Table className="w-4 h-4 text-[#2D3A27]" />
            <span className="hidden sm:inline">Scorecard Grid</span>
            <span className="sm:hidden">Card</span>
          </button>

          {/* Finish & Save Round Button */}
          <button
            id="btn-open-finish-round"
            onClick={() => {
              triggerHaptic('medium');
              setIsFinishModalOpen(true);
            }}
            className="px-3.5 sm:px-4 py-2 rounded-xl bg-[#2D3A27] hover:bg-[#1D2619] active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all touch-manipulation"
          >
            <CheckCircle2 className="w-4 h-4 text-[#8EA67B]" />
            <span>Finish</span>
          </button>
        </div>
      </div>

      {/* Multi-Player Selection Tabs (if playing with 2+ golfers) */}
      {round.players.length > 1 && (
        <div className="bg-white rounded-2xl p-2.5 sm:p-3 shadow-xs border border-[#CCD7BE]">
          <div className="flex items-center justify-between px-1 mb-1.5">
            <span className="text-[11px] font-bold text-[#7E8F77] uppercase tracking-wider">
              Golfers in Group ({round.players.length})
            </span>
            <button
              id="btn-par-for-all-players"
              onClick={handleParForAll}
              className="text-[11px] font-bold text-[#2D3A27] hover:text-[#1D2619] underline active:scale-95 transition-transform"
            >
              Set Par ({currentHole.par}) For All
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {round.players.map((p, idx) => {
              const summary = calculatePlayerSummary(p, course, round.holesPlayed);
              const isSelected = idx === activePlayerIndex;
              const hScore = p.holeScores[currentHoleNumber];

              return (
                <button
                  key={p.playerId}
                  id={`btn-select-player-${idx}`}
                  onClick={() => {
                    triggerHaptic('light');
                    setActivePlayerIndex(idx);
                  }}
                  className={`min-h-[44px] p-2.5 rounded-xl text-left transition-all flex items-center justify-between border active:scale-95 touch-manipulation ${
                    isSelected
                      ? 'bg-[#2D3A27] text-[#F7F9F2] border-[#2D3A27] shadow-xs ring-2 ring-[#8EA67B]'
                      : 'bg-[#F7F9F2] hover:bg-[#E9EDD9] text-[#2D3A27] border-[#CCD7BE]'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                      style={{ backgroundColor: p.teeColor === 'black' ? '#1D2619' : p.teeColor === 'blue' ? '#3B5360' : p.teeColor === 'red' ? '#9E4747' : '#5A6F4E' }}
                    >
                      {p.playerName.charAt(0)}
                    </div>
                    <div className="truncate">
                      <span className="text-xs font-bold block truncate">{p.playerName}</span>
                      <span className={`text-[10px] font-mono ${isSelected ? 'text-[#CCD7BE]' : 'text-[#6C7E64]'}`}>
                        {summary.grossTotal > 0 ? `${summary.grossTotal} (${formatToPar(summary.toParTotal)})` : 'Even'}
                      </span>
                    </div>
                  </div>

                  {/* Score on current hole indicator */}
                  <div className="shrink-0 text-right">
                    <span className="text-[10px] block opacity-70">H{currentHoleNumber}</span>
                    <span className="text-xs font-bold">
                      {hScore && hScore.strokes > 0 ? hScore.strokes : '-'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Hole Navigator 1-18 */}
      <HoleNavigator
        currentHoleNumber={currentHoleNumber}
        onSelectHole={setCurrentHoleNumber}
        course={course}
        round={round}
        activePlayerIndex={activePlayerIndex}
      />

      {/* Swipe Hint Pill for Mobile */}
      <div className="sm:hidden flex items-center justify-center gap-1.5 text-[11px] text-[#7E8F77] py-0.5">
        <span>👈 Swipe card to switch holes 👉</span>
      </div>

      {/* Hole Info Card */}
      <HoleInfoCard
        hole={currentHole}
        activeTee={activePlayer.teeColor || 'white'}
        handicapStrokes={getHoleHandicapStrokes(activePlayer.handicap, currentHole.handicapIndex, round.holesPlayed)}
      />

      {/* Main Score Counter Card */}
      <ScoreCounterCard
        hole={currentHole}
        playerScore={activePlayer}
        onUpdateScore={handleUpdateScore}
        onPrevHole={() => setCurrentHoleNumber(prev => Math.max(1, prev - 1))}
        onNextHole={() => setCurrentHoleNumber(prev => Math.min(maxHoles, prev + 1))}
        isFirstHole={currentHoleNumber === 1}
        isLastHole={currentHoleNumber === maxHoles}
        holesPlayed={round.holesPlayed}
      />

      {/* Live Round Statistics Bar */}
      <div className="bg-[#2D3A27] text-[#F7F9F2] rounded-2xl p-4 sm:p-5 shadow-sm border border-[#3E4F37] flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] text-[#CCD7BE] font-bold uppercase tracking-wider block">Current Round Progress</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-bold text-[#E6CC7A] font-mono">
              {activeSummary.grossTotal} <span className="text-sm font-normal text-[#CCD7BE]">({formatToPar(activeSummary.toParTotal)})</span>
            </span>
            <span className="text-xs text-[#CCD7BE]">• {activeSummary.holesCompleted}/{round.holesPlayed} Holes Scored</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-center text-xs">
          <div>
            <span className="text-[10px] text-[#CCD7BE] block uppercase">Putts</span>
            <span className="text-sm font-bold text-white">{activeSummary.totalPutts}</span>
          </div>
          <div>
            <span className="text-[10px] text-[#CCD7BE] block uppercase">FIR</span>
            <span className="text-sm font-bold text-[#CCD7BE]">{activeSummary.fairwayPct}%</span>
          </div>
          <div>
            <span className="text-[10px] text-[#CCD7BE] block uppercase">GIR</span>
            <span className="text-sm font-bold text-[#CCD7BE]">{activeSummary.girPct}%</span>
          </div>
          <div>
            <span className="text-[10px] text-[#CCD7BE] block uppercase">Birdies</span>
            <span className="text-sm font-bold text-[#E6CC7A]">{activeSummary.birdies}</span>
          </div>
        </div>
      </div>

      {/* Full Scorecard Modal */}
      <ScorecardTableModal
        isOpen={isScorecardModalOpen}
        onClose={() => setIsScorecardModalOpen(false)}
        course={course}
        round={round}
        onSelectHole={(hole) => setCurrentHoleNumber(hole)}
      />

      {/* Finish & Save Round Modal */}
      <FinishRoundModal
        isOpen={isFinishModalOpen}
        onClose={() => setIsFinishModalOpen(false)}
        course={course}
        round={round}
        onSaveToDatabase={async (weather, notes) => {
          await onCompleteRound(weather, notes);
        }}
      />

    </div>
  );
};
