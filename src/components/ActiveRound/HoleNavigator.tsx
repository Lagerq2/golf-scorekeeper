import React, { useEffect, useRef } from 'react';
import { Course, GolfRound } from '../../types';
import { getScoreStyle, getScoreType } from '../../utils/golfStats';
import { triggerHaptic } from '../../utils/haptics';

interface HoleNavigatorProps {
  currentHoleNumber: number;
  onSelectHole: (holeNumber: number) => void;
  course: Course;
  round: GolfRound;
  activePlayerIndex: number;
}

export const HoleNavigator: React.FC<HoleNavigatorProps> = ({
  currentHoleNumber,
  onSelectHole,
  course,
  round,
  activePlayerIndex
}) => {
  const activePlayer = round.players[activePlayerIndex] || round.players[0];
  const maxHoles = Math.min(course.holes.length, round.holesPlayed);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeHoleBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeHoleBtnRef.current && scrollContainerRef.current) {
      activeHoleBtnRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [currentHoleNumber]);

  return (
    <div className="bg-white border-y sm:border sm:rounded-2xl border-[#CCD7BE] shadow-xs px-2 sm:px-3 py-3">
      <div className="flex items-center justify-between px-2 mb-2">
        <span className="text-xs font-bold text-[#6C7E64] uppercase tracking-wider">
          Holes ({round.holesPlayed} Holes)
        </span>
        <div className="flex items-center gap-2.5 text-[11px] text-[#7E8F77]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#9E4747]" /> Birdie
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-[#5A6F4E]" /> Par
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-none bg-[#3B5360]" /> Bogey+
          </span>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none touch-pan-x overscroll-contain px-1"
      >
        {Array.from({ length: maxHoles }, (_, i) => i + 1).map((holeNum) => {
          const hole = course.holes.find(h => h.holeNumber === holeNum) || {
            holeNumber: holeNum,
            par: 4,
            handicapIndex: holeNum,
            yards: { red: 300, white: 350, blue: 380, black: 400 }
          };

          const isSelected = holeNum === currentHoleNumber;
          const holeScore = activePlayer?.holeScores?.[holeNum];
          const hasScore = holeScore && holeScore.strokes > 0;
          const scoreType = hasScore ? getScoreType(holeScore.strokes, hole.par) : 'unplayed';
          const style = getScoreStyle(scoreType);

          return (
            <button
              key={holeNum}
              ref={isSelected ? activeHoleBtnRef : undefined}
              id={`btn-nav-hole-${holeNum}`}
              onClick={() => {
                triggerHaptic('light');
                onSelectHole(holeNum);
              }}
              className={`flex-shrink-0 flex flex-col items-center justify-between w-12 h-16 p-1.5 rounded-2xl transition-all active:scale-90 touch-manipulation ${
                isSelected
                  ? 'bg-[#2D3A27] text-white shadow-md ring-2 ring-[#8EA67B] scale-105'
                  : 'bg-[#F7F9F2] hover:bg-[#E9EDD9] text-[#2D3A27] border border-[#CCD7BE]'
              }`}
            >
              <span className={`text-xs font-bold leading-none ${isSelected ? 'text-[#E6CC7A]' : 'text-[#7E8F77]'}`}>
                {holeNum}
              </span>

              {hasScore ? (
                <div
                  className={`w-6 h-6 flex items-center justify-center text-xs font-bold ${style.bg} ${style.shape} shadow-2xs`}
                >
                  {holeScore.strokes}
                </div>
              ) : (
                <span className={`text-[10px] font-bold ${isSelected ? 'text-[#CCD7BE]' : 'text-[#7E8F77]'}`}>
                  P{hole.par}
                </span>
              )}

              <span className="text-[9px] font-mono opacity-75 leading-none">
                {hole.yards[activePlayer?.teeColor || 'white'] || 350}y
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

