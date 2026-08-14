import React from 'react';
import { HoleInfo, TeeColor } from '../../types';
import { Flag, Info } from 'lucide-react';

interface HoleInfoCardProps {
  hole: HoleInfo;
  activeTee: TeeColor;
  handicapStrokes: number;
}

export const HoleInfoCard: React.FC<HoleInfoCardProps> = ({
  hole,
  activeTee,
  handicapStrokes
}) => {
  const teeColors: { key: TeeColor; name: string; dotBg: string }[] = [
    { key: 'black', name: 'Black', dotBg: 'bg-[#1D2619]' },
    { key: 'blue', name: 'Blue', dotBg: 'bg-[#3B5360]' },
    { key: 'white', name: 'White', dotBg: 'bg-[#CCD7BE]' },
    { key: 'red', name: 'Red', dotBg: 'bg-[#9E4747]' }
  ];

  return (
    <div className="bg-[#2D3A27] text-[#F7F9F2] rounded-2xl p-4 sm:p-5 shadow-xs border border-[#3E4F37]">
      <div className="flex items-center justify-between">
        
        {/* Hole Number & Par */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#1D2619] border border-[#485B3F] flex flex-col items-center justify-center shadow-inner shrink-0">
            <span className="text-[9px] font-bold text-[#CCD7BE] uppercase tracking-wider leading-none">Hole</span>
            <span className="text-xl font-bold font-serif text-white leading-none mt-0.5">{hole.holeNumber}</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-bold font-serif tracking-tight text-[#F7F9F2]">PAR {hole.par}</span>
              {handicapStrokes > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#E6CC7A]/20 text-[#E6CC7A] border border-[#E6CC7A]/40 font-semibold">
                  +{handicapStrokes} {handicapStrokes === 1 ? 'stroke' : 'strokes'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-[#CCD7BE]">
              <span>HCP #{hole.handicapIndex}</span>
              <span>•</span>
              <span className="capitalize">{activeTee} Tee</span>
            </div>
          </div>
        </div>

        {/* Distance */}
        <div className="text-right">
          <span className="text-[10px] uppercase tracking-wider text-[#CCD7BE] font-semibold block">Distance</span>
          <div className="flex items-baseline justify-end gap-1">
            <span className="text-2xl sm:text-3xl font-bold text-[#E6CC7A] font-mono">
              {hole.yards[activeTee] || hole.yards.white || 350}
            </span>
            <span className="text-xs text-[#CCD7BE] font-semibold">yds</span>
          </div>
        </div>

      </div>

      {/* All Tees Yardage strip */}
      <div className="mt-3 pt-2.5 border-t border-[#3E4F37] flex items-center justify-between text-xs">
        <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto">
          {teeColors.map((t) => {
            const isSelected = t.key === activeTee;
            return (
              <div
                key={t.key}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ${
                  isSelected ? 'bg-white/15 ring-1 ring-[#E6CC7A]/50 text-[#E6CC7A] font-bold' : 'text-[#CCD7BE]'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${t.dotBg}`} />
                <span className="text-[11px]">{t.name}:</span>
                <span className="font-mono text-xs font-semibold">{hole.yards[t.key] || '-'}</span>
              </div>
            );
          })}
        </div>

        {hole.notes && (
          <div className="hidden md:flex items-center gap-1 text-[11px] text-[#CCD7BE] italic truncate max-w-xs">
            <Info className="w-3 h-3 text-[#E6CC7A] shrink-0" />
            <span className="truncate">{hole.notes}</span>
          </div>
        )}
      </div>
    </div>
  );
};

