import React from 'react';
import { Minus, Plus, Check, ArrowLeft, ArrowRight, ShieldAlert, Sparkles, ChevronLeft, ChevronRight, CheckCircle2, RotateCcw, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { HoleInfo, PlayerHoleScore, PlayerRoundScore } from '../../types';
import { getHoleHandicapStrokes, getScoreLabel, getScoreStyle, getScoreType } from '../../utils/golfStats';
import { triggerHaptic } from '../../utils/haptics';

interface ScoreCounterCardProps {
  hole: HoleInfo;
  playerScore: PlayerRoundScore;
  onUpdateScore: (holeNumber: number, updates: Partial<PlayerHoleScore>) => void;
  onPrevHole: () => void;
  onNextHole: () => void;
  isFirstHole: boolean;
  isLastHole: boolean;
  holesPlayed: 9 | 18;
}

export const ScoreCounterCard: React.FC<ScoreCounterCardProps> = ({
  hole,
  playerScore,
  onUpdateScore,
  onPrevHole,
  onNextHole,
  isFirstHole,
  isLastHole,
  holesPlayed
}) => {
  const currentHoleScore = playerScore.holeScores[hole.holeNumber] || {
    holeNumber: hole.holeNumber,
    strokes: 0,
    putts: 2,
    fairwayHit: hole.par >= 4 ? 'hit' : 'na',
    greenInRegulation: false,
    penalties: 0,
    sandSave: false
  };

  const strokes = currentHoleScore.strokes;
  const putts = currentHoleScore.putts ?? 2;
  const fairwayHit = currentHoleScore.fairwayHit ?? (hole.par >= 4 ? 'hit' : 'na');
  const gir = currentHoleScore.greenInRegulation ?? (strokes > 0 && strokes <= hole.par);
  const penalties = currentHoleScore.penalties ?? 0;
  const sandSave = currentHoleScore.sandSave ?? false;

  const scoreType = strokes > 0 ? getScoreType(strokes, hole.par) : 'unplayed';
  const scoreStyle = getScoreStyle(scoreType);
  const scoreLabel = strokes > 0 ? getScoreLabel(scoreType, strokes, hole.par) : 'Score Hole';

  const triggerCelebration = (type: string) => {
    triggerHaptic('celebrate');
    if (type === 'hole_in_one' || type === 'albatross' || type === 'eagle' || type === 'birdie') {
      confetti({
        particleCount: type === 'hole_in_one' ? 100 : 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    }
  };

  const setStrokes = (newStrokes: number) => {
    triggerHaptic('medium');
    const clamped = Math.max(0, Math.min(15, newStrokes));
    const newType = clamped > 0 ? getScoreType(clamped, hole.par) : 'unplayed';
    
    if (newStrokes > strokes && (newType === 'birdie' || newType === 'eagle' || newType === 'hole_in_one')) {
      triggerCelebration(newType);
    }

    const autoGir = clamped > 0 ? clamped - putts <= hole.par - 2 : gir;

    onUpdateScore(hole.holeNumber, {
      strokes: clamped,
      greenInRegulation: autoGir
    });
  };

  const handleQuickPar = () => {
    triggerHaptic('success');
    onUpdateScore(hole.holeNumber, {
      strokes: hole.par,
      putts: 2,
      fairwayHit: hole.par >= 4 ? 'hit' : 'na',
      greenInRegulation: true,
      penalties: 0
    });
  };

  const handleClearScore = () => {
    triggerHaptic('light');
    onUpdateScore(hole.holeNumber, {
      strokes: 0,
      putts: 0,
      fairwayHit: hole.par >= 4 ? 'pending' : 'na',
      greenInRegulation: false,
      penalties: 0
    });
  };

  // Quick score options relative to par for 1-tap mobile entry
  const quickScoreButtons = [
    ...(hole.par >= 4 ? [{ label: 'Eagle', strokes: hole.par - 2, bg: 'bg-[#FBF6E2] text-[#1D2619] border-[#E6CC7A]' }] : []),
    { label: 'Birdie', strokes: hole.par - 1, bg: 'bg-[#FDF0ED] text-[#9E4747] border-[#E5B5AA]' },
    { label: 'Par', strokes: hole.par, bg: 'bg-[#E9EDD9] text-[#2D3A27] border-[#CCD7BE]' },
    { label: 'Bogey', strokes: hole.par + 1, bg: 'bg-[#F0F4F6] text-[#3B5360] border-[#CCD7BE]' },
    { label: 'Double', strokes: hole.par + 2, bg: 'bg-[#F8F4F0] text-[#5C4532] border-[#D5C2B4]' },
    { label: 'Triple', strokes: hole.par + 3, bg: 'bg-[#F7F9F2] text-[#1D2619] border-[#CCD7BE]' },
  ];

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xs border border-[#CCD7BE] space-y-4 sm:space-y-5">
      
      {/* Golfer Header & Action Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E9EDD9]">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs shrink-0"
            style={{ backgroundColor: playerScore.teeColor === 'black' ? '#1D2619' : playerScore.teeColor === 'blue' ? '#3B5360' : playerScore.teeColor === 'red' ? '#9E4747' : '#5A6F4E' }}
          >
            {playerScore.playerName.charAt(0)}
          </div>
          <div>
            <h3 className="text-sm font-bold font-serif text-[#1D2619] leading-tight">{playerScore.playerName}</h3>
            <span className="text-[11px] text-[#6C7E64]">
              Hcp: <strong>{playerScore.handicap}</strong> • <span className="uppercase">{playerScore.teeColor}</span> Tee
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {strokes > 0 && (
            <button
              id={`btn-clear-score-${hole.holeNumber}`}
              onClick={handleClearScore}
              className="min-h-[40px] text-xs px-2.5 py-1.5 rounded-xl bg-[#FDF0ED] hover:bg-[#FCE6E2] active:scale-95 text-[#9E4747] border border-[#E5B5AA] font-semibold flex items-center gap-1 transition-all"
              title="Remove/Clear score for this hole"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}

          <button
            id={`btn-quick-par-${hole.holeNumber}`}
            onClick={handleQuickPar}
            className="min-h-[40px] text-xs px-3 py-1.5 rounded-xl bg-[#E9EDD9] hover:bg-[#DCE4D0] active:scale-95 text-[#2D3A27] border border-[#CCD7BE] font-bold flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C2A649]" />
            <span>Par ({hole.par})</span>
          </button>
        </div>
      </div>

      {/* Main Score Counter with Touch Controls */}
      <div className="flex flex-col items-center justify-center">
        <div className="flex items-center justify-center gap-4 sm:gap-7 w-full max-w-xs">
          {/* Decrement Button - Big touch target */}
          <button
            id="btn-decrement-stroke"
            onClick={() => setStrokes(strokes > 0 ? strokes - 1 : hole.par)}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#E9EDD9] hover:bg-[#DCE4D0] active:scale-90 text-[#2D3A27] flex items-center justify-center shadow-xs border border-[#CCD7BE] transition-all touch-manipulation"
            aria-label="Decrease strokes"
          >
            <Minus className="w-7 h-7 stroke-[2.5]" />
          </button>

          {/* Score Display Card */}
          <div className="flex flex-col items-center">
            <div
              className={`w-24 h-24 sm:w-28 sm:h-28 flex flex-col items-center justify-center rounded-3xl border-2 transition-all ${
                strokes > 0
                  ? `${scoreStyle.bg} ${scoreStyle.border} shadow-sm scale-105`
                  : 'bg-[#F7F9F2] border-dashed border-[#CCD7BE] text-[#7E8F77]'
              }`}
            >
              <span className="text-4xl sm:text-5xl font-bold font-mono tracking-tight leading-none">
                {strokes > 0 ? strokes : '-'}
              </span>
              {strokes > 0 && (
                <span className="text-[11px] font-bold mt-1 uppercase tracking-wider opacity-90">
                  {strokes === hole.par ? 'E' : strokes > hole.par ? `+${strokes - hole.par}` : `${strokes - hole.par}`}
                </span>
              )}
            </div>
          </div>

          {/* Increment Button - Big touch target */}
          <button
            id="btn-increment-stroke"
            onClick={() => setStrokes(strokes === 0 ? hole.par : strokes + 1)}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#2D3A27] hover:bg-[#1D2619] active:scale-90 text-white flex items-center justify-center shadow-xs transition-all touch-manipulation"
            aria-label="Increase strokes"
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
        </div>

        {/* Dynamic Score Label Badge */}
        <div className="mt-2.5">
          <span
            className={`inline-flex items-center text-xs font-bold px-3 py-1 rounded-full border shadow-2xs ${
              strokes > 0 ? scoreStyle.badge : 'bg-[#E9EDD9] text-[#6C7E64] border-[#CCD7BE]'
            }`}
          >
            {scoreLabel}
          </span>
        </div>
      </div>

      {/* 1-Tap Mobile Quick Score Pad */}
      <div className="pt-2 border-t border-[#E9EDD9] space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-[#6C7E64] uppercase tracking-wider text-[11px] flex items-center gap-1">
            <Zap className="w-3 h-3 text-[#C2A649]" /> 1-Tap Score Pad
          </span>
          <span className="text-[11px] text-[#7E8F77]">Select stroke</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {quickScoreButtons.map((btn) => {
            const isSelected = strokes === btn.strokes;
            return (
              <button
                key={btn.label}
                id={`btn-quick-score-${btn.label.toLowerCase()}`}
                onClick={() => setStrokes(btn.strokes)}
                className={`min-h-[44px] py-2 px-1.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center transition-all active:scale-95 touch-manipulation ${
                  isSelected
                    ? 'bg-[#2D3A27] text-white ring-2 ring-[#8EA67B] shadow-xs'
                    : `${btn.bg} hover:brightness-95`
                }`}
              >
                <span className="font-mono text-sm leading-none">{btn.strokes}</span>
                <span className="text-[10px] font-medium opacity-80 leading-none mt-0.5">{btn.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Putts Quick Selector */}
      <div className="space-y-1.5 pt-2 border-t border-[#E9EDD9]">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-[#6C7E64] uppercase tracking-wider text-[11px]">Putts</span>
          <span className="font-bold text-[#1D2619] font-mono">{putts}</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {[0, 1, 2, 3, 4].map((pVal) => {
            const isSelected = putts === pVal;
            return (
              <button
                key={pVal}
                id={`btn-putts-${pVal}`}
                onClick={() => {
                  triggerHaptic('light');
                  onUpdateScore(hole.holeNumber, { putts: pVal });
                }}
                className={`min-h-[44px] py-2 rounded-xl text-xs font-bold transition-all active:scale-95 touch-manipulation ${
                  isSelected
                    ? 'bg-[#2D3A27] text-white ring-2 ring-[#8EA67B] shadow-xs'
                    : 'bg-[#F7F9F2] hover:bg-[#E9EDD9] text-[#2D3A27] border border-[#CCD7BE]'
                }`}
              >
                {pVal === 4 ? '4+' : pVal}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fairway Hit (FIR) for Par 4/5 */}
      {hole.par >= 4 && (
        <div className="space-y-1.5 pt-2 border-t border-[#E9EDD9]">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#6C7E64] uppercase tracking-wider text-[11px]">Fairway Hit</span>
            <span className="text-[11px] text-[#6C7E64] font-medium">
              {fairwayHit === 'hit' ? 'Hit Center' : fairwayHit === 'left' ? 'Missed Left' : fairwayHit === 'right' ? 'Missed Right' : 'Unrecorded'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              id="btn-fairway-left"
              onClick={() => {
                triggerHaptic('light');
                onUpdateScore(hole.holeNumber, { fairwayHit: 'left' });
              }}
              className={`min-h-[44px] py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 touch-manipulation ${
                fairwayHit === 'left'
                  ? 'bg-[#C2A649] text-[#1D2619] shadow-xs'
                  : 'bg-[#F7F9F2] hover:bg-[#E9EDD9] text-[#2D3A27] border border-[#CCD7BE]'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Left</span>
            </button>

            <button
              id="btn-fairway-hit"
              onClick={() => {
                triggerHaptic('success');
                onUpdateScore(hole.holeNumber, { fairwayHit: 'hit' });
              }}
              className={`min-h-[44px] py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 touch-manipulation ${
                fairwayHit === 'hit'
                  ? 'bg-[#2D3A27] text-white shadow-xs'
                  : 'bg-[#F7F9F2] hover:bg-[#E9EDD9] text-[#2D3A27] border border-[#CCD7BE]'
              }`}
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Center</span>
            </button>

            <button
              id="btn-fairway-right"
              onClick={() => {
                triggerHaptic('light');
                onUpdateScore(hole.holeNumber, { fairwayHit: 'right' });
              }}
              className={`min-h-[44px] py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 touch-manipulation ${
                fairwayHit === 'right'
                  ? 'bg-[#C2A649] text-[#1D2619] shadow-xs'
                  : 'bg-[#F7F9F2] hover:bg-[#E9EDD9] text-[#2D3A27] border border-[#CCD7BE]'
              }`}
            >
              <span>Right</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Toggles: GIR, Bunker, Penalties with 44px touch targets */}
      <div className="pt-2 border-t border-[#E9EDD9] grid grid-cols-3 gap-2 text-xs">
        {/* Green in Regulation */}
        <button
          id="btn-toggle-gir"
          onClick={() => {
            triggerHaptic('light');
            onUpdateScore(hole.holeNumber, { greenInRegulation: !gir });
          }}
          className={`min-h-[44px] py-2 px-1.5 rounded-xl flex items-center justify-center gap-1.5 border transition-all text-xs font-bold active:scale-95 touch-manipulation ${
            gir
              ? 'bg-[#E9EDD9] border-[#8EA67B] text-[#2D3A27]'
              : 'bg-[#F7F9F2] border-[#CCD7BE] text-[#6C7E64] hover:bg-[#E9EDD9]'
          }`}
        >
          {gir && <CheckCircle2 className="w-3.5 h-3.5 text-[#5A6F4E]" />}
          <span>{gir ? 'GIR: Yes' : 'GIR: No'}</span>
        </button>

        {/* Sand Save */}
        <button
          id="btn-toggle-sand"
          onClick={() => {
            triggerHaptic('light');
            onUpdateScore(hole.holeNumber, { sandSave: !sandSave });
          }}
          className={`min-h-[44px] py-2 px-1.5 rounded-xl flex items-center justify-center gap-1.5 border transition-all text-xs font-bold active:scale-95 touch-manipulation ${
            sandSave
              ? 'bg-[#FBF6E2] border-[#E6CC7A] text-[#1D2619]'
              : 'bg-[#F7F9F2] border-[#CCD7BE] text-[#6C7E64] hover:bg-[#E9EDD9]'
          }`}
        >
          <span>{sandSave ? '🏖️ Sand Save' : 'Sand: No'}</span>
        </button>

        {/* Penalties */}
        <button
          id="btn-cycle-penalties"
          onClick={() => {
            triggerHaptic('heavy');
            onUpdateScore(hole.holeNumber, { penalties: (penalties + 1) % 4 });
          }}
          className={`min-h-[44px] py-2 px-1.5 rounded-xl flex items-center justify-center gap-1.5 border transition-all text-xs font-bold active:scale-95 touch-manipulation ${
            penalties > 0
              ? 'bg-[#FDF0ED] border-[#E5B5AA] text-[#9E4747]'
              : 'bg-[#F7F9F2] border-[#CCD7BE] text-[#6C7E64] hover:bg-[#E9EDD9]'
          }`}
        >
          {penalties > 0 && <ShieldAlert className="w-3.5 h-3.5 text-[#9E4747]" />}
          <span>{penalties === 0 ? 'Penalties: 0' : `+${penalties} Pen`}</span>
        </button>
      </div>

      {/* Next/Prev Navigation with big 44px touch targets */}
      <div className="pt-3 border-t border-[#E9EDD9] flex items-center justify-between gap-3">
        <button
          id="btn-prev-hole"
          onClick={() => {
            triggerHaptic('light');
            onPrevHole();
          }}
          disabled={isFirstHole}
          className="min-h-[44px] flex-1 py-2.5 px-3 rounded-xl border border-[#CCD7BE] hover:bg-[#E9EDD9] active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-[#2D3A27] font-bold text-xs flex items-center justify-center gap-1 transition-all touch-manipulation"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Hole {hole.holeNumber > 1 ? hole.holeNumber - 1 : 1}</span>
        </button>

        <button
          id="btn-next-hole"
          onClick={() => {
            triggerHaptic('light');
            onNextHole();
          }}
          disabled={isLastHole}
          className="min-h-[44px] flex-1 py-2.5 px-3 rounded-xl bg-[#2D3A27] hover:bg-[#1D2619] active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-white font-bold text-xs flex items-center justify-center gap-1 transition-all shadow-xs touch-manipulation"
        >
          <span>Hole {hole.holeNumber < holesPlayed ? hole.holeNumber + 1 : holesPlayed}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};


