import React from 'react';
import { Play, Database, MapPin, Users, BarChart3, Plus, RefreshCw } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface MobileBottomNavProps {
  activeTab: 'active_round' | 'history' | 'courses' | 'players' | 'analytics';
  setActiveTab: (tab: 'active_round' | 'history' | 'courses' | 'players' | 'analytics') => void;
  hasActiveRound: boolean;
  onNewRound: () => void;
  isSyncing: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  hasActiveRound,
  onNewRound,
  isSyncing
}) => {
  const handleTabChange = (tab: 'active_round' | 'history' | 'courses' | 'players' | 'analytics') => {
    triggerHaptic('light');
    setActiveTab(tab);
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#2D3A27] text-[#F7F9F2] border-t border-[#3D4E35] shadow-lg pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex items-center justify-around h-16 px-1">
        
        {/* Active Round Tab */}
        <button
          id="mobile-nav-active-round"
          onClick={() => handleTabChange('active_round')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 touch-manipulation relative ${
            activeTab === 'active_round' ? 'text-[#E6CC7A] font-bold' : 'text-[#CCD7BE] hover:text-white'
          }`}
        >
          <div className="relative">
            <Play className={`w-5 h-5 ${activeTab === 'active_round' ? 'fill-current' : ''}`} />
            {hasActiveRound && (
              <span className="absolute -top-0.5 -right-1 w-2.5 h-2.5 rounded-full bg-[#E6CC7A] ring-2 ring-[#2D3A27] animate-pulse" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Round</span>
        </button>

        {/* Vault (History) Tab */}
        <button
          id="mobile-nav-history"
          onClick={() => handleTabChange('history')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 touch-manipulation ${
            activeTab === 'history' ? 'text-[#E6CC7A] font-bold' : 'text-[#CCD7BE] hover:text-white'
          }`}
        >
          <Database className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-0.5">History</span>
        </button>

        {/* Quick New Round Floating Button in Center */}
        <button
          id="mobile-nav-new-round"
          onClick={() => {
            triggerHaptic('medium');
            onNewRound();
          }}
          className="mx-1 -mt-5 w-12 h-12 rounded-2xl bg-[#C2A649] active:bg-[#B3963B] text-[#1D2619] flex items-center justify-center shadow-lg border-2 border-[#2D3A27] active:scale-90 transition-transform touch-manipulation shrink-0"
          title="Start New Round"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>

        {/* Courses Tab */}
        <button
          id="mobile-nav-courses"
          onClick={() => handleTabChange('courses')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 touch-manipulation ${
            activeTab === 'courses' ? 'text-[#E6CC7A] font-bold' : 'text-[#CCD7BE] hover:text-white'
          }`}
        >
          <MapPin className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-0.5">Courses</span>
        </button>

        {/* Golfers Tab */}
        <button
          id="mobile-nav-players"
          onClick={() => handleTabChange('players')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 touch-manipulation ${
            activeTab === 'players' ? 'text-[#E6CC7A] font-bold' : 'text-[#CCD7BE] hover:text-white'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-0.5">Golfers</span>
        </button>

        {/* Stats Tab */}
        <button
          id="mobile-nav-analytics"
          onClick={() => handleTabChange('analytics')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 touch-manipulation ${
            activeTab === 'analytics' ? 'text-[#E6CC7A] font-bold' : 'text-[#CCD7BE] hover:text-white'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-0.5">My Game</span>
        </button>

      </div>
    </div>
  );
};
