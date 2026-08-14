import React, { useState } from 'react';
import { Trophy, CheckCircle, X, CloudSun, FileText, Database, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Course, GolfRound } from '../../types';
import { calculatePlayerSummary, formatToPar } from '../../utils/golfStats';

interface FinishRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  round: GolfRound;
  onSaveToDatabase: (weather: string, notes: string) => Promise<void>;
}

export const FinishRoundModal: React.FC<FinishRoundModalProps> = ({
  isOpen,
  onClose,
  course,
  round,
  onSaveToDatabase
}) => {
  const [weather, setWeather] = useState(round.weather || 'Sunny, Light Breeze');
  const [notes, setNotes] = useState(round.notes || '');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const playerSummaries = round.players.map(p => calculatePlayerSummary(p, course, round.holesPlayed));
  const leadPlayer = playerSummaries[0];

  const handleCommit = async () => {
    try {
      setSaving(true);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 }
      });
      await onSaveToDatabase(weather, notes);
      onClose();
    } catch {
      alert('Error saving round to database');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-[#CCD7BE] animate-in fade-in my-6">
        
        {/* Modal Top Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#E9EDD9]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FBF6E2] border border-[#E6CC7A] flex items-center justify-center text-[#C2A649] shadow-xs">
              <Trophy className="w-6 h-6 fill-current" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2D3A27] bg-[#E9EDD9] px-2 py-0.5 rounded-full border border-[#CCD7BE]">
                Round Completion Audit
              </span>
              <h2 className="text-xl font-bold font-serif text-[#1D2619] mt-1">Finish & Save Scorecard</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#7E8F77] hover:text-[#2D3A27] rounded-lg hover:bg-[#E9EDD9]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Course & Date Info */}
        <div className="mt-4 p-3.5 bg-[#F7F9F2] rounded-2xl border border-[#CCD7BE]">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-[#1D2619]">{round.courseName}</h4>
              <p className="text-xs text-[#6C7E64]">{round.courseLocation || course.location} • {round.holesPlayed} Holes</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-semibold text-[#1D2619] block">
                {new Date(round.date || Date.now()).toLocaleDateString()}
              </span>
              <span className="text-[10px] text-[#7E8F77] uppercase font-medium">{round.format} Play</span>
            </div>
          </div>
        </div>

        {/* Player Summaries Leaderboard */}
        <div className="mt-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#7E8F77]">Player Score Summaries</h4>

          {playerSummaries.map((summary) => (
            <div
              key={summary.playerId}
              className="p-4 rounded-2xl border border-[#CCD7BE] bg-white hover:border-[#8EA67B] transition-colors shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#2D3A27] text-white flex items-center justify-center font-bold text-xs">
                    {summary.playerName.charAt(0)}
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[#1D2619] block">{summary.playerName}</span>
                    <span className="text-[11px] text-[#6C7E64]">
                      Completed: <strong>{summary.holesCompleted}/{round.holesPlayed} holes</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs text-[#7E8F77] block font-medium">Gross</span>
                    <span className="text-2xl font-bold text-[#1D2619] font-mono leading-none">
                      {summary.grossTotal}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[#7E8F77] block font-medium">To Par</span>
                    <span className={`text-sm font-bold px-2 py-0.5 rounded-lg inline-block ${
                      summary.toParTotal === 0
                        ? 'bg-[#E9EDD9] text-[#2D3A27]'
                        : summary.toParTotal < 0
                        ? 'bg-[#FDF0ED] text-[#9E4747]'
                        : 'bg-[#E9EDD9] text-[#2D3A27]'
                    }`}>
                      {formatToPar(summary.toParTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats badges */}
              <div className="mt-3 pt-3 border-t border-[#E9EDD9] grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-1.5 rounded-lg bg-[#F7F9F2]">
                  <span className="text-[10px] text-[#7E8F77] block">Putts</span>
                  <span className="font-bold text-[#1D2619]">{summary.totalPutts} ({summary.puttsPerHole}/h)</span>
                </div>
                <div className="p-1.5 rounded-lg bg-[#F7F9F2]">
                  <span className="text-[10px] text-[#7E8F77] block">FIR %</span>
                  <span className="font-bold text-[#2D3A27]">{summary.fairwayPct}%</span>
                </div>
                <div className="p-1.5 rounded-lg bg-[#F7F9F2]">
                  <span className="text-[10px] text-[#7E8F77] block">GIR %</span>
                  <span className="font-bold text-[#2D3A27]">{summary.girPct}%</span>
                </div>
                <div className="p-1.5 rounded-lg bg-[#F7F9F2]">
                  <span className="text-[10px] text-[#7E8F77] block">Birdies+</span>
                  <span className="font-bold text-[#9E4747]">{summary.birdies + summary.eagles}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Weather & Round Notes Inputs */}
        <div className="mt-5 space-y-3">
          <div>
            <label className="block text-xs font-bold text-[#6C7E64] mb-1 flex items-center gap-1.5">
              <CloudSun className="w-3.5 h-3.5 text-[#C2A649]" />
              <span>Weather Conditions</span>
            </label>
            <input
              type="text"
              value={weather}
              onChange={(e) => setWeather(e.target.value)}
              placeholder="e.g. Sunny, 72°F / 22°C, 10mph wind"
              className="w-full text-xs px-3 py-2 rounded-xl border border-[#CCD7BE] bg-[#FDFEFA] focus:outline-hidden focus:ring-2 focus:ring-[#8EA67B]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#6C7E64] mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#7E8F77]" />
              <span>Round Notes & Highlights</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Drove the green on hole 12, great putting on back 9..."
              className="w-full text-xs px-3 py-2 rounded-xl border border-[#CCD7BE] bg-[#FDFEFA] focus:outline-hidden focus:ring-2 focus:ring-[#8EA67B] resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 pt-4 border-t border-[#E9EDD9] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[#CCD7BE] text-[#6C7E64] hover:bg-[#E9EDD9] text-xs font-semibold transition-colors"
          >
            Keep Playing
          </button>

          <button
            id="btn-confirm-save-round"
            onClick={handleCommit}
            disabled={saving}
            className="flex-1 px-5 py-2.5 rounded-xl bg-[#2D3A27] hover:bg-[#1D2619] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
          >
            <Database className="w-4 h-4 text-[#8EA67B]" />
            <span>{saving ? 'Saving to Database...' : 'Save & Store in Database'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
