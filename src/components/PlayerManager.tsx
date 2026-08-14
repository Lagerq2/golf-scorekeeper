import React, { useState } from 'react';
import { Player, TeeColor, GolfRound, Course } from '../types';
import { Users, Plus, Trash2, Edit2, Check, X, Trophy, BarChart2, Shield } from 'lucide-react';
import { calculatePlayerSummary, formatToPar } from '../utils/golfStats';

interface PlayerManagerProps {
  players: Player[];
  rounds: GolfRound[];
  courses: Course[];
  onCreatePlayer: (player: Partial<Player>) => Promise<void>;
  onUpdatePlayer: (id: string, updates: Partial<Player>) => Promise<void>;
  onDeletePlayer: (id: string) => Promise<void>;
}

export const PlayerManager: React.FC<PlayerManagerProps> = ({
  players,
  rounds,
  courses,
  onCreatePlayer,
  onUpdatePlayer,
  onDeletePlayer
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [deletingPlayerId, setDeletingPlayerId] = useState<string | null>(null);
  const [isDeletingPlayer, setIsDeletingPlayer] = useState(false);

  // New/Edit Player Form State
  const [name, setName] = useState('');
  const [handicapIndex, setHandicapIndex] = useState<number>(14.0);
  const [defaultTee, setDefaultTee] = useState<TeeColor>('white');
  const [avatarBg, setAvatarBg] = useState<string>('#059669');
  const [loading, setLoading] = useState(false);

  const palette = [
    { color: '#2D3A27', name: 'Deep Forest' },
    { color: '#5A6F4E', name: 'Sage Green' },
    { color: '#8EA67B', name: 'Moss Green' },
    { color: '#3B5360', name: 'Slate Blue' },
    { color: '#C2A649', name: 'Sand Gold' },
    { color: '#9E4747', name: 'Muted Crimson' },
    { color: '#1D2619', name: 'Dark Onyx' }
  ];

  const handleOpenCreate = () => {
    setName('');
    setHandicapIndex(14.0);
    setDefaultTee('white');
    setAvatarBg(palette[Math.floor(Math.random() * palette.length)].color);
    setEditingPlayerId(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (player: Player) => {
    setName(player.name);
    setHandicapIndex(player.handicapIndex);
    setDefaultTee(player.defaultTee);
    setAvatarBg(player.avatarBg || '#2D3A27');
    setEditingPlayerId(player.id);
    setIsCreateModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      if (editingPlayerId) {
        await onUpdatePlayer(editingPlayerId, {
          name: name.trim(),
          handicapIndex: Number(handicapIndex),
          defaultTee,
          avatarBg
        });
      } else {
        await onCreatePlayer({
          name: name.trim(),
          handicapIndex: Number(handicapIndex),
          defaultTee,
          avatarBg
        });
      }
      setIsCreateModalOpen(false);
    } catch (err: any) {
      alert(`Error saving player: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-xs border border-[#CCD7BE] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#E9EDD9] text-[#2D3A27] border border-[#CCD7BE]">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#2D3A27] bg-[#E9EDD9] px-2.5 py-0.5 rounded-full border border-[#CCD7BE]">
              Golfer Roster ({players.length})
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-[#1D2619] mt-2">Players & Handicaps</h1>
          <p className="text-xs sm:text-sm text-[#6C7E64] mt-0.5">
            Manage player profiles, official handicap indexes, and scoring track records.
          </p>
        </div>

        <button
          id="btn-open-create-player-modal"
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-[#2D3A27] hover:bg-[#1D2619] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Golfer</span>
        </button>
      </div>

      {/* Players Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {players.map((player) => {
          // Calculate player lifetime stats across all rounds
          const playerRounds = rounds.filter(r => r.players?.some(p => p.playerId === player.id));
          const completedRounds = playerRounds.filter(r => r.status === 'completed');

          let bestGross = Infinity;
          let bestToPar = Infinity;
          let totalGross = 0;
          let totalPutts = 0;
          let totalHoles = 0;

          completedRounds.forEach(r => {
            const pScore = r.players.find(p => p.playerId === player.id);
            const course = courses.find(c => c.id === r.courseId) || courses[0];
            if (pScore && course) {
              const summary = calculatePlayerSummary(pScore, course, r.holesPlayed);
              if (summary.grossTotal > 0) {
                totalGross += summary.grossTotal;
                totalPutts += summary.totalPutts;
                totalHoles += summary.holesCompleted;
                if (summary.grossTotal < bestGross) bestGross = summary.grossTotal;
                if (summary.toParTotal < bestToPar) bestToPar = summary.toParTotal;
              }
            }
          });

          const scoringAvg = completedRounds.length > 0 ? (totalGross / completedRounds.length).toFixed(1) : '-';
          const puttingAvg = totalHoles > 0 ? (totalPutts / totalHoles).toFixed(1) : '-';

          return (
            <div
              key={player.id}
              className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-[#CCD7BE] hover:border-[#8EA67B] transition-all flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-xs"
                    style={{ backgroundColor: player.avatarBg || '#2D3A27' }}
                  >
                    {player.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-serif text-[#1D2619] leading-tight">{player.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#E9EDD9] text-[#2D3A27] border border-[#CCD7BE]">
                        HCP: {player.handicapIndex}
                      </span>
                      <span className="text-xs uppercase font-semibold text-[#6C7E64] bg-[#F7F9F2] px-2 py-0.5 rounded-md border border-[#CCD7BE]">
                        {player.defaultTee} Tee
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(player)}
                    className="p-2 text-[#7E8F77] hover:text-[#2D3A27] hover:bg-[#E9EDD9] rounded-xl transition-colors"
                    title="Edit Player"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {deletingPlayerId === player.id ? (
                    <div className="flex items-center gap-1.5 bg-[#FDF0ED] p-1 rounded-xl border border-[#E5B5AA]">
                      <span className="text-[11px] font-bold text-[#9E4747] px-1">Delete?</span>
                      <button
                        disabled={isDeletingPlayer}
                        onClick={async () => {
                          try {
                            setIsDeletingPlayer(true);
                            await onDeletePlayer(player.id);
                            setDeletingPlayerId(null);
                          } finally {
                            setIsDeletingPlayer(false);
                          }
                        }}
                        className="px-2 py-1 rounded-lg bg-[#9E4747] hover:bg-[#833838] text-white font-bold text-xs shadow-xs transition-colors"
                      >
                        {isDeletingPlayer ? '...' : 'Yes'}
                      </button>
                      <button
                        disabled={isDeletingPlayer}
                        onClick={() => setDeletingPlayerId(null)}
                        className="px-1.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-[#2D3A27] font-semibold text-xs border border-[#CCD7BE] transition-colors"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingPlayerId(player.id)}
                      className="p-2 text-[#7E8F77] hover:text-[#9E4747] hover:bg-[#FDF0ED] rounded-xl transition-colors"
                      title="Delete Player"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-4 gap-2 pt-3 border-t border-[#E9EDD9] text-center text-xs">
                <div className="p-2 bg-[#F7F9F2] rounded-xl border border-[#CCD7BE]">
                  <span className="text-[10px] text-[#7E8F77] font-medium block">Rounds</span>
                  <span className="font-bold text-[#1D2619] font-mono">{completedRounds.length}</span>
                </div>
                <div className="p-2 bg-[#F7F9F2] rounded-xl border border-[#CCD7BE]">
                  <span className="text-[10px] text-[#7E8F77] font-medium block">Best 18</span>
                  <span className="font-bold text-[#2D3A27] font-mono">
                    {bestGross !== Infinity ? `${bestGross} (${formatToPar(bestToPar)})` : '-'}
                  </span>
                </div>
                <div className="p-2 bg-[#F7F9F2] rounded-xl border border-[#CCD7BE]">
                  <span className="text-[10px] text-[#7E8F77] font-medium block">Score Avg</span>
                  <span className="font-bold text-[#1D2619] font-mono">{scoringAvg}</span>
                </div>
                <div className="p-2 bg-[#F7F9F2] rounded-xl border border-[#CCD7BE]">
                  <span className="text-[10px] text-[#7E8F77] font-medium block">Putts/Hole</span>
                  <span className="font-bold text-[#1D2619] font-mono">{puttingAvg}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Player Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#CCD7BE] animate-in fade-in my-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-[#E9EDD9]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#2D3A27] flex items-center justify-center text-white shadow-xs">
                  <Users className="w-5 h-5 text-[#8EA67B]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-serif text-[#1D2619]">
                    {editingPlayerId ? 'Edit Golfer Profile' : 'Add New Golfer'}
                  </h3>
                  <p className="text-xs text-[#6C7E64]">Player name, handicap index, and tee preferences</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-[#7E8F77] hover:text-[#2D3A27] rounded-lg hover:bg-[#E9EDD9]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-[#6C7E64] uppercase tracking-wider block mb-1">
                  Player Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Brooks Koepka"
                  className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-[#CCD7BE] bg-[#FDFEFA] focus:outline-hidden focus:ring-2 focus:ring-[#8EA67B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#6C7E64] uppercase tracking-wider block mb-1">
                    Handicap Index
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="54"
                    value={handicapIndex}
                    onChange={(e) => setHandicapIndex(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-[#CCD7BE] bg-[#FDFEFA] focus:outline-hidden focus:ring-2 focus:ring-[#8EA67B] font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#6C7E64] uppercase tracking-wider block mb-1">
                    Default Tee
                  </label>
                  <select
                    value={defaultTee}
                    onChange={(e) => setDefaultTee(e.target.value as TeeColor)}
                    className="w-full text-xs font-bold py-2 px-2.5 bg-[#FDFEFA] rounded-xl border border-[#CCD7BE] focus:outline-hidden focus:ring-2 focus:ring-[#8EA67B] uppercase"
                  >
                    <option value="black">Black Tees</option>
                    <option value="blue">Blue Tees</option>
                    <option value="white">White Tees</option>
                    <option value="red">Red Tees</option>
                  </select>
                </div>
              </div>

              {/* Avatar Color Picker */}
              <div>
                <label className="text-xs font-bold text-[#6C7E64] uppercase tracking-wider block mb-1.5">
                  Badge Color
                </label>
                <div className="flex items-center gap-2">
                  {palette.map((p) => (
                    <button
                      key={p.color}
                      type="button"
                      onClick={() => setAvatarBg(p.color)}
                      className={`w-7 h-7 rounded-full transition-all flex items-center justify-center ${
                        avatarBg === p.color ? 'ring-2 ring-[#2D3A27] ring-offset-2 scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: p.color }}
                    >
                      {avatarBg === p.color && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="pt-4 border-t border-[#E9EDD9] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#CCD7BE] text-[#6C7E64] hover:bg-[#E9EDD9] text-xs font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-5 py-2.5 rounded-xl bg-[#2D3A27] hover:bg-[#1D2619] text-white text-xs font-bold shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{loading ? 'Saving...' : 'Save Golfer'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
