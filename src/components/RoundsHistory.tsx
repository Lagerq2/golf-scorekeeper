import React, { useState } from 'react';
import { Database, Search, Calendar, MapPin, Trophy, Play, Trash2, Eye, FileSpreadsheet, Plus, Filter } from 'lucide-react';
import { Course, GolfRound } from '../types';
import { calculatePlayerSummary, formatToPar, getScoreStyle, getScoreType } from '../utils/golfStats';
import { ScorecardTableModal } from './ActiveRound/ScorecardTableModal';

interface RoundsHistoryProps {
  rounds: GolfRound[];
  courses: Course[];
  onResumeRound: (round: GolfRound) => void;
  onDeleteRound: (id: string) => Promise<void>;
  onNewRound: () => void;
  onOpenDbModal: () => void;
}

export const RoundsHistory: React.FC<RoundsHistoryProps> = ({
  rounds,
  courses,
  onResumeRound,
  onDeleteRound,
  onNewRound,
  onOpenDbModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress'>('all');
  const [selectedRoundForScorecard, setSelectedRoundForScorecard] = useState<GolfRound | null>(null);
  const [deletingRoundId, setDeletingRoundId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredRounds = rounds.filter(r => {
    const matchesSearch = r.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.players.some(p => p.playerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.courseLocation && r.courseLocation.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' ? true : r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedCourseForModal = selectedRoundForScorecard
    ? courses.find(c => c.id === selectedRoundForScorecard.courseId) || courses[0]
    : courses[0];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-xs border border-[#CCD7BE] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#E9EDD9] text-[#2D3A27] border border-[#CCD7BE]">
              <Database className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#2D3A27] bg-[#E9EDD9] px-2.5 py-0.5 rounded-full border border-[#CCD7BE]">
              Persistent Database Records
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-[#1D2619] mt-2">Scorecard Vault & History</h1>
          <p className="text-xs sm:text-sm text-[#6C7E64] mt-0.5">
            Browse, review, and export all historical golf scorecards saved on the database.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-history-db-tools"
            onClick={onOpenDbModal}
            className="px-3.5 py-2.5 rounded-xl border border-[#CCD7BE] hover:bg-[#E9EDD9] text-[#2D3A27] text-xs font-bold flex items-center gap-2 transition-colors shadow-2xs"
          >
            <Database className="w-4 h-4 text-[#8EA67B]" />
            <span>Database Tools</span>
          </button>

          <button
            id="btn-history-new-round"
            onClick={onNewRound}
            className="px-4 py-2.5 rounded-xl bg-[#2D3A27] hover:bg-[#1D2619] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Scorecard</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-[#CCD7BE] flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#7E8F77] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by course, golfer, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[#F7F9F2] border border-[#CCD7BE] text-[#1D2619] focus:outline-hidden focus:ring-2 focus:ring-[#8EA67B]"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 p-1 bg-[#F7F9F2] rounded-xl border border-[#CCD7BE] text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              statusFilter === 'all' ? 'bg-[#2D3A27] text-white shadow-xs' : 'text-[#6C7E64] hover:text-[#2D3A27]'
            }`}
          >
            All ({rounds.length})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              statusFilter === 'completed' ? 'bg-[#2D3A27] text-white shadow-xs' : 'text-[#6C7E64] hover:text-[#2D3A27]'
            }`}
          >
            Completed ({rounds.filter(r => r.status === 'completed').length})
          </button>
          <button
            onClick={() => setStatusFilter('in_progress')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              statusFilter === 'in_progress' ? 'bg-[#2D3A27] text-white shadow-xs' : 'text-[#6C7E64] hover:text-[#2D3A27]'
            }`}
          >
            In Progress ({rounds.filter(r => r.status === 'in_progress').length})
          </button>
        </div>
      </div>

      {/* Rounds List */}
      {filteredRounds.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-[#CCD7BE]">
          <div className="w-16 h-16 rounded-full bg-[#E9EDD9] text-[#2D3A27] flex items-center justify-center mx-auto mb-4 border border-[#CCD7BE]">
            <Trophy className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold font-serif text-[#1D2619]">No Rounds Found</h3>
          <p className="text-xs text-[#6C7E64] max-w-sm mx-auto mt-1 mb-5">
            {searchQuery
              ? 'No rounds matched your search filters. Try adjusting your query.'
              : 'There are no scorecards recorded in the database yet. Tee off your first round!'}
          </p>
          <button
            onClick={onNewRound}
            className="px-5 py-2.5 rounded-xl bg-[#2D3A27] hover:bg-[#1D2619] text-white text-xs font-bold inline-flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Start First Round</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRounds.map((round) => {
            const courseObj = courses.find(c => c.id === round.courseId) || {
              id: round.courseId,
              name: round.courseName,
              location: round.courseLocation,
              holesCount: round.holesPlayed,
              holes: [],
              parTotal: 72,
              createdAt: ''
            };

            const isCompleted = round.status === 'completed';
            const leadPlayer = round.players[0];
            const leadSummary = leadPlayer ? calculatePlayerSummary(leadPlayer, courseObj, round.holesPlayed) : null;

            return (
              <div
                key={round.id}
                id={`round-card-${round.id}`}
                className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-[#CCD7BE] hover:border-[#8EA67B] transition-all space-y-4"
              >
                {/* Round Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[#E9EDD9]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        isCompleted
                          ? 'bg-[#E9EDD9] text-[#2D3A27] border border-[#CCD7BE]'
                          : 'bg-[#FBF6E2] text-[#1D2619] border border-[#E6CC7A]'
                      }`}>
                        {isCompleted ? 'Completed Round' : 'In Progress'}
                      </span>
                      <span className="text-xs text-[#7E8F77] font-mono flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(round.date || round.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold font-serif text-[#1D2619] mt-1">{round.courseName}</h3>
                    <p className="text-xs text-[#6C7E64] flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-[#7E8F77]" />
                      <span>{round.courseLocation || 'Championship Course'} • {round.holesPlayed} Holes • {round.format.toUpperCase()}</span>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {/* Resume if in progress */}
                    {!isCompleted && (
                      <button
                        id={`btn-resume-round-${round.id}`}
                        onClick={() => onResumeRound(round)}
                        className="px-3.5 py-2 rounded-xl bg-[#C2A649] hover:bg-[#A88E3B] text-[#1D2619] font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Resume</span>
                      </button>
                    )}

                    {/* View Full Scorecard */}
                    <button
                      id={`btn-view-scorecard-${round.id}`}
                      onClick={() => setSelectedRoundForScorecard(round)}
                      className="px-3.5 py-2 rounded-xl bg-[#E9EDD9] hover:bg-[#DCE4D0] text-[#2D3A27] font-bold text-xs flex items-center gap-1.5 transition-colors border border-[#CCD7BE]"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#2D3A27]" />
                      <span>View Scorecard</span>
                    </button>

                    {/* Delete Round with Inline Confirmation */}
                    {deletingRoundId === round.id ? (
                      <div className="flex items-center gap-1.5 bg-[#FDF0ED] p-1 rounded-xl border border-[#E5B5AA]">
                        <span className="text-[11px] font-bold text-[#9E4747] px-1.5">Remove?</span>
                        <button
                          id={`btn-confirm-delete-round-${round.id}`}
                          disabled={isDeleting}
                          onClick={async () => {
                            try {
                              setIsDeleting(true);
                              await onDeleteRound(round.id);
                              setDeletingRoundId(null);
                            } finally {
                              setIsDeleting(false);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#9E4747] hover:bg-[#833838] text-white font-bold text-xs shadow-xs transition-colors"
                        >
                          {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                        </button>
                        <button
                          id={`btn-cancel-delete-round-${round.id}`}
                          disabled={isDeleting}
                          onClick={() => setDeletingRoundId(null)}
                          className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 text-[#2D3A27] font-semibold text-xs border border-[#CCD7BE] transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        id={`btn-delete-round-${round.id}`}
                        onClick={() => setDeletingRoundId(round.id)}
                        className="p-2 text-[#7E8F77] hover:text-[#9E4747] hover:bg-[#FDF0ED] rounded-xl transition-colors"
                        title="Delete Round"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Golfer Scores Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {round.players.map((player) => {
                    const summary = calculatePlayerSummary(player, courseObj, round.holesPlayed);

                    return (
                      <div
                        key={player.playerId}
                        className="p-3.5 rounded-2xl bg-[#F7F9F2] border border-[#CCD7BE] flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                              style={{ backgroundColor: player.teeColor === 'black' ? '#1D2619' : player.teeColor === 'blue' ? '#3B5360' : player.teeColor === 'red' ? '#9E4747' : '#5A6F4E' }}
                            >
                              {player.playerName.charAt(0)}
                            </div>
                            <span className="text-xs font-bold text-[#1D2619] truncate max-w-[100px]">{player.playerName}</span>
                          </div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                            summary.toParTotal === 0
                              ? 'bg-[#E9EDD9] text-[#2D3A27]'
                              : summary.toParTotal < 0
                              ? 'bg-[#FDF0ED] text-[#9E4747]'
                              : 'bg-[#E9EDD9] text-[#2D3A27]'
                          }`}>
                            {formatToPar(summary.toParTotal)}
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between pt-1 border-t border-[#E9EDD9] text-xs">
                          <div>
                            <span className="text-[10px] text-[#7E8F77] block font-medium">Gross Score</span>
                            <span className="text-xl font-bold text-[#1D2619] font-mono">{summary.grossTotal}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-[#7E8F77] block font-medium">Net (Hcp {player.handicap})</span>
                            <span className="text-sm font-bold text-[#6C7E64] font-mono">{summary.netTotal}</span>
                          </div>
                        </div>

                        {/* Quick Stats Pills */}
                        <div className="mt-2 pt-2 border-t border-[#E9EDD9] flex items-center justify-between text-[10px] text-[#6C7E64] font-medium">
                          <span>{summary.totalPutts} Putts</span>
                          <span>•</span>
                          <span>{summary.fairwayPct}% FIR</span>
                          <span>•</span>
                          <span>{summary.girPct}% GIR</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Weather & Round Notes if present */}
                {(round.weather || round.notes) && (
                  <div className="pt-2 border-t border-[#E9EDD9] flex flex-wrap items-center gap-4 text-xs text-[#6C7E64] italic">
                    {round.weather && <span>⛅ {round.weather}</span>}
                    {round.notes && <span>📝 "{round.notes}"</span>}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Historical Scorecard Modal */}
      {selectedRoundForScorecard && (
        <ScorecardTableModal
          isOpen={true}
          onClose={() => setSelectedRoundForScorecard(null)}
          course={selectedCourseForModal}
          round={selectedRoundForScorecard}
        />
      )}

    </div>
  );
};
