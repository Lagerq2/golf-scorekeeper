import React from 'react';
import { Flag, Play, Database, MapPin, Users, BarChart3, Plus, RefreshCw, CheckCircle2 } from 'lucide-react';
import { DatabaseStatus } from '../services/api';

interface NavbarProps {
  activeTab: 'active_round' | 'history' | 'courses' | 'players' | 'analytics';
  setActiveTab: (tab: 'active_round' | 'history' | 'courses' | 'players' | 'analytics') => void;
  hasActiveRound: boolean;
  onNewRound: () => void;
  onOpenDbModal: () => void;
  dbStatus: DatabaseStatus | null;
  isSyncing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  hasActiveRound,
  onNewRound,
  onOpenDbModal,
  dbStatus,
  isSyncing
}) => {
  return (
    <header className="bg-[#2D3A27] text-[#F7F9F2] border-b border-[#3D4E35] sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#8EA67B] flex items-center justify-center shadow-xs text-[#1D2619] shrink-0">
              <Flag className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-black tracking-tight text-base sm:text-lg text-white leading-none">GolfScore</span>
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-[#3D4E35] text-[#DCE4D0] px-1.5 sm:px-2 py-0.5 rounded-full border border-[#4E6144]">
                  Synced
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#CCD7BE] hidden sm:block font-serif italic mt-0.5">Course Scorekeeper & Database Vault</p>
            </div>
          </div>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              id="nav-tab-active-round"
              onClick={() => setActiveTab('active_round')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'active_round'
                  ? 'bg-[#8EA67B] text-[#1D2619] shadow-xs'
                  : 'text-[#DCE4D0] hover:bg-[#3D4E35] hover:text-white'
              }`}
            >
              <Play className="w-4 h-4" />
              <span>Current Round</span>
              {hasActiveRound && (
                <span className="w-2 h-2 rounded-full bg-[#E6CC7A] animate-pulse" />
              )}
            </button>

            <button
              id="nav-tab-history"
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'bg-[#8EA67B] text-[#1D2619] shadow-xs'
                  : 'text-[#DCE4D0] hover:bg-[#3D4E35] hover:text-white'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Scorecards Vault</span>
              {dbStatus && dbStatus.totalRounds > 0 && (
                <span className="text-xs px-1.5 py-0.2 rounded-full bg-[#1D2619] border border-[#3D4E35] text-[#DCE4D0]">
                  {dbStatus.totalRounds}
                </span>
              )}
            </button>

            <button
              id="nav-tab-courses"
              onClick={() => setActiveTab('courses')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'courses'
                  ? 'bg-[#8EA67B] text-[#1D2619] shadow-xs'
                  : 'text-[#DCE4D0] hover:bg-[#3D4E35] hover:text-white'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Courses</span>
            </button>

            <button
              id="nav-tab-players"
              onClick={() => setActiveTab('players')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'players'
                  ? 'bg-[#8EA67B] text-[#1D2619] shadow-xs'
                  : 'text-[#DCE4D0] hover:bg-[#3D4E35] hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Golfers</span>
            </button>

            <button
              id="nav-tab-analytics"
              onClick={() => setActiveTab('analytics')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'analytics'
                  ? 'bg-[#8EA67B] text-[#1D2619] shadow-xs'
                  : 'text-[#DCE4D0] hover:bg-[#3D4E35] hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Stats</span>
            </button>
          </nav>

          {/* Right Action Items */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* DB Health Indicator Pill */}
            <button
              id="btn-db-status-badge"
              onClick={onOpenDbModal}
              title="Click to manage Database, Backups, and Exports"
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl bg-[#232D1E] hover:bg-[#1D2619] active:scale-95 border border-[#3D4E35] text-[#DCE4D0] transition-all touch-manipulation"
            >
              {isSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 text-[#E6CC7A] animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#8EA67B]" />
              )}
              <span className="font-mono text-[11px] sm:text-xs">
                {dbStatus ? `${dbStatus.totalRounds} Saved` : 'DB Live'}
              </span>
            </button>

            {/* Start New Round Button */}
            <button
              id="btn-nav-new-round"
              onClick={onNewRound}
              className="bg-[#C2A649] hover:bg-[#B3963B] active:scale-95 text-[#1D2619] font-bold text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-all touch-manipulation"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden xs:inline">New Round</span>
              <span className="xs:hidden">New</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
