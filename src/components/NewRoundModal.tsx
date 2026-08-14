import React, { useState } from 'react';
import { X, Play, Plus, Users, MapPin, Flag, ChevronRight, Check, Sparkles } from 'lucide-react';
import { Course, GameFormat, GolfRound, Player, PlayerRoundScore, TeeColor } from '../types';

interface NewRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  players: Player[];
  onStartRound: (roundData: Partial<GolfRound>) => Promise<void>;
  onOpenCreateCourse: () => void;
  onOpenCreatePlayer: () => void;
}

export const NewRoundModal: React.FC<NewRoundModalProps> = ({
  isOpen,
  onClose,
  courses,
  players,
  onStartRound,
  onOpenCreateCourse,
  onOpenCreatePlayer
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const [holesPlayed, setHolesPlayed] = useState<9 | 18>(18);
  const [startingHole, setStartingHole] = useState<number>(1);
  const [format, setFormat] = useState<GameFormat>('stroke');
  
  // Selected players with their assigned tees
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([
    players[0]?.id || 'player-1'
  ]);
  const [playerTees, setPlayerTees] = useState<Record<string, TeeColor>>({
    [players[0]?.id || 'player-1']: players[0]?.defaultTee || 'white'
  });
  const [playerHandicaps, setPlayerHandicaps] = useState<Record<string, number>>({
    [players[0]?.id || 'player-1']: players[0]?.handicapIndex ?? 18
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const selectedCourse = courses.find(c => c.id === selectedCourseId) || courses[0];

  const handleTogglePlayer = (player: Player) => {
    setErrorMessage(null);
    if (selectedPlayerIds.includes(player.id)) {
      if (selectedPlayerIds.length > 1) {
        setSelectedPlayerIds(prev => prev.filter(id => id !== player.id));
      } else {
        setErrorMessage('At least one player must be in the group');
      }
    } else {
      if (selectedPlayerIds.length < 4) {
        setSelectedPlayerIds(prev => [...prev, player.id]);
        setPlayerTees(prev => ({ ...prev, [player.id]: player.defaultTee || 'white' }));
        setPlayerHandicaps(prev => ({ ...prev, [player.id]: player.handicapIndex || 18 }));
      } else {
        setErrorMessage('Maximum 4 golfers per group');
      }
    }
  };

  const handleStart = async () => {
    setErrorMessage(null);
    if (!selectedCourse) {
      setErrorMessage('Please select a golf course');
      return;
    }
    if (selectedPlayerIds.length === 0) {
      setErrorMessage('Please select at least one golfer');
      return;
    }

    try {
      setLoading(true);

      const roundPlayers: PlayerRoundScore[] = selectedPlayerIds.map(pId => {
        const pObj = players.find(p => p.id === pId) || {
          id: pId,
          name: 'Golfer',
          handicapIndex: 18,
          defaultTee: 'white',
          avatarBg: '#059669',
          createdAt: ''
        };

        const initialHoleScores: Record<number, any> = {};
        const maxHoles = Math.min(selectedCourse.holes.length, holesPlayed);

        for (let i = 1; i <= maxHoles; i++) {
          initialHoleScores[i] = {
            holeNumber: i,
            strokes: 0,
            putts: 2,
            fairwayHit: selectedCourse.holes[i - 1]?.par >= 4 ? 'hit' : 'na',
            greenInRegulation: false,
            penalties: 0,
            sandSave: false
          };
        }

        return {
          playerId: pId,
          playerName: pObj.name,
          handicap: playerHandicaps[pId] !== undefined ? playerHandicaps[pId] : pObj.handicapIndex,
          teeColor: playerTees[pId] || pObj.defaultTee || 'white',
          holeScores: initialHoleScores
        };
      });

      await onStartRound({
        date: new Date().toISOString(),
        courseId: selectedCourse.id,
        courseName: selectedCourse.name,
        courseLocation: selectedCourse.location,
        holesPlayed,
        startingHole,
        format,
        status: 'in_progress',
        players: roundPlayers
      });

      onClose();
    } catch (e: any) {
      setErrorMessage(`Error starting round: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-[#CCD7BE] animate-in fade-in my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E9EDD9]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#2D3A27] flex items-center justify-center text-white shadow-xs">
              <Flag className="w-6 h-6 fill-[#8EA67B]" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif text-[#1D2619]">Start New Golf Round</h2>
              <p className="text-xs text-[#6C7E64]">Configure course, group golfers, and format</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#7E8F77] hover:text-[#2D3A27] rounded-lg hover:bg-[#E9EDD9]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          
          {/* Step 1: Select Golf Course */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#6C7E64] uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#8EA67B]" />
                <span>1. Select Golf Course</span>
              </label>
              <button
                type="button"
                onClick={onOpenCreateCourse}
                className="text-xs text-[#2D3A27] hover:text-[#1D2619] font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Custom Course</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-1 border border-[#CCD7BE] rounded-2xl bg-[#FDFEFA]">
              {courses.map((course) => {
                const isSelected = course.id === selectedCourseId;
                return (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => setSelectedCourseId(course.id)}
                    className={`p-3 rounded-xl text-left transition-all border flex items-start justify-between ${
                      isSelected
                        ? 'bg-[#E9EDD9] border-[#8EA67B] ring-2 ring-[#8EA67B]/20 shadow-xs'
                        : 'bg-white hover:bg-[#F7F9F2] border-[#D7DFC9]'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-[#1D2619] leading-tight">{course.name}</h4>
                      <p className="text-[11px] text-[#6C7E64] mt-0.5">{course.location || 'Championship'}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-[#7E8F77] font-medium">
                        <span>Par {course.parTotal}</span>
                        <span>•</span>
                        <span>{course.holesCount} Holes</span>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-[#2D3A27] text-white flex items-center justify-center text-xs shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Round Options (Holes, Starting Hole, Format) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Holes Count */}
            <div>
              <label className="text-xs font-bold text-[#6C7E64] uppercase tracking-wider block mb-1.5">
                Holes to Play
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#E9EDD9] rounded-xl border border-[#CCD7BE]">
                <button
                  type="button"
                  onClick={() => setHolesPlayed(18)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    holesPlayed === 18 ? 'bg-white text-[#2D3A27] shadow-xs' : 'text-[#6C7E64]'
                  }`}
                >
                  18 Holes
                </button>
                <button
                  type="button"
                  onClick={() => setHolesPlayed(9)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    holesPlayed === 9 ? 'bg-white text-[#2D3A27] shadow-xs' : 'text-[#6C7E64]'
                  }`}
                >
                  9 Holes
                </button>
              </div>
            </div>

            {/* Starting Hole */}
            <div>
              <label className="text-xs font-bold text-[#6C7E64] uppercase tracking-wider block mb-1.5">
                Start Hole
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#E9EDD9] rounded-xl border border-[#CCD7BE]">
                <button
                  type="button"
                  onClick={() => setStartingHole(1)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    startingHole === 1 ? 'bg-white text-[#2D3A27] shadow-xs' : 'text-[#6C7E64]'
                  }`}
                >
                  Hole 1
                </button>
                <button
                  type="button"
                  onClick={() => setStartingHole(10)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    startingHole === 10 ? 'bg-white text-[#2D3A27] shadow-xs' : 'text-[#6C7E64]'
                  }`}
                >
                  Hole 10 (Back)
                </button>
              </div>
            </div>

            {/* Game Format */}
            <div>
              <label className="text-xs font-bold text-[#6C7E64] uppercase tracking-wider block mb-1.5">
                Scoring Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as GameFormat)}
                className="w-full text-xs font-semibold py-2 px-2.5 bg-[#FDFEFA] rounded-xl border border-[#CCD7BE] focus:outline-hidden focus:ring-2 focus:ring-[#8EA67B]"
              >
                <option value="stroke">Stroke Play (Gross/Net)</option>
                <option value="stableford">Stableford Points</option>
                <option value="match">Match Play</option>
              </select>
            </div>
          </div>

          {/* Step 3: Select Players & Assign Tees */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#6C7E64] uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#8EA67B]" />
                <span>2. Select Golfers in Group (1-4 Players)</span>
              </label>
              <button
                type="button"
                onClick={onOpenCreatePlayer}
                className="text-xs text-[#2D3A27] hover:text-[#1D2619] font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Golfer</span>
              </button>
            </div>

            <div className="space-y-2">
              {players.map((player) => {
                const isSelected = selectedPlayerIds.includes(player.id);
                const currentTee = playerTees[player.id] || player.defaultTee || 'white';
                const currentHcp = playerHandicaps[player.id] !== undefined ? playerHandicaps[player.id] : player.handicapIndex;

                return (
                  <div
                    key={player.id}
                    className={`p-3 rounded-2xl border transition-all flex flex-wrap items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-white border-[#8EA67B] ring-1 ring-[#8EA67B]/30 shadow-xs'
                        : 'bg-[#F7F9F2]/80 border-[#CCD7BE] opacity-70 hover:opacity-100'
                    }`}
                  >
                    {/* Toggle Player Checkbox */}
                    <button
                      type="button"
                      onClick={() => handleTogglePlayer(player)}
                      className="flex items-center gap-2.5 text-left flex-1"
                    >
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-[#2D3A27] border-[#2D3A27] text-white' : 'border-[#CCD7BE] bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: player.avatarBg || '#2D3A27' }}
                      >
                        {player.name.charAt(0)}
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-[#1D2619]">{player.name}</h4>
                        <span className="text-[10px] text-[#6C7E64] font-medium">Index: {player.handicapIndex}</span>
                      </div>
                    </button>

                    {/* Tee & Handicap Adjustments (when selected) */}
                    {isSelected && (
                      <div className="flex items-center gap-2 text-xs">
                        {/* Tee Box Selector */}
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-[#7E8F77] font-medium uppercase">Tee:</span>
                          <select
                            value={currentTee}
                            onChange={(e) => setPlayerTees(prev => ({ ...prev, [player.id]: e.target.value as TeeColor }))}
                            className="text-xs font-semibold py-1 px-2 rounded-lg bg-[#E9EDD9] border border-[#CCD7BE] text-[#2D3A27] uppercase"
                          >
                            <option value="black">Black</option>
                            <option value="blue">Blue</option>
                            <option value="white">White</option>
                            <option value="red">Red</option>
                          </select>
                        </div>

                        {/* Round Handicap */}
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-[#7E8F77] font-medium uppercase">Hcp:</span>
                          <input
                            type="number"
                            min="0"
                            max="54"
                            step="0.1"
                            value={currentHcp}
                            onChange={(e) => setPlayerHandicaps(prev => ({ ...prev, [player.id]: parseFloat(e.target.value) || 0 }))}
                            className="w-14 text-xs font-semibold py-1 px-1.5 text-center rounded-lg bg-[#E9EDD9] border border-[#CCD7BE] font-mono text-[#2D3A27]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Error Message Banner */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold animate-in fade-in flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-500 hover:text-red-800 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[#E9EDD9] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[#CCD7BE] text-[#6C7E64] hover:bg-[#E9EDD9] text-xs font-semibold transition-colors"
          >
            Cancel
          </button>

          <button
            id="btn-start-round-submit"
            type="button"
            onClick={handleStart}
            disabled={loading}
            className="flex-1 px-6 py-2.5 rounded-xl bg-[#2D3A27] hover:bg-[#1D2619] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
          >
            <Play className="w-4 h-4 fill-current text-[#8EA67B]" />
            <span>{loading ? 'Initializing Scorecard...' : 'Tee Off & Start Round'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
