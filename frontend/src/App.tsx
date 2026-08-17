import React, { useEffect, useState } from 'react';
import { api, DatabaseStatus } from './services/api';
import { Course, GolfRound, Player } from './types';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ActiveRoundView } from './components/ActiveRound/ActiveRoundView';
import { RoundsHistory } from './components/RoundsHistory';
import { CourseManager } from './components/CourseManager';
import { PlayerManager } from './components/PlayerManager';
import { AnalyticsView } from './components/AnalyticsView';
import { NewRoundModal } from './components/NewRoundModal';
import { DatabaseToolsModal } from './components/DatabaseToolsModal';
import { Play, Database, Plus, Trophy, Flag, Shield, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'active_round' | 'history' | 'courses' | 'players' | 'analytics'>('analytics');
  const [courses, setCourses] = useState<Course[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [rounds, setRounds] = useState<GolfRound[]>([]);
  const [activeRound, setActiveRound] = useState<GolfRound | null>(null);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isNewRoundModalOpen, setIsNewRoundModalOpen] = useState<boolean>(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  // Load initial state from backend database
  const loadData = async () => {
    try {
      setIsSyncing(true);
      const [fetchedCourses, fetchedPlayers, fetchedRounds, fetchedStatus] = await Promise.all([
        api.getCourses(),
        api.getPlayers(),
        api.getRounds(),
        api.getStatus()
      ]);

      setCourses(fetchedCourses);
      setPlayers(fetchedPlayers);
      setRounds(fetchedRounds);
      setDbStatus(fetchedStatus);

      // Check if there is an in-progress round to resume automatically
      const inProgress = fetchedRounds.find(r => r.status === 'in_progress');
      if (inProgress && !activeRound) {
        setActiveRound(inProgress);
        setActiveTab('active_round');
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsSyncing(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers for Round
  const handleStartRound = async (roundData: Partial<GolfRound>) => {
    try {
      setIsSyncing(true);
      const newRound = await api.createRound(roundData);
      setActiveRound(newRound);
      setRounds(prev => [newRound, ...prev]);
      setActiveTab('active_round');
      const updatedStatus = await api.getStatus();
      setDbStatus(updatedStatus);
    } catch (err: any) {
      alert(`Failed to start round: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateActiveRound = async (updatedRound: GolfRound) => {
    setActiveRound(updatedRound);
    try {
      setIsSyncing(true);
      await api.updateRound(updatedRound.id, updatedRound);
      setRounds(prev => prev.map(r => r.id === updatedRound.id ? updatedRound : r));
    } catch (err) {
      console.error('Error updating round in database:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCompleteRound = async (weather: string, notes: string) => {
    if (!activeRound) return;

    try {
      setIsSyncing(true);
      const updated: GolfRound = {
        ...activeRound,
        status: 'completed',
        weather: weather || activeRound.weather,
        notes: notes || activeRound.notes,
        updatedAt: new Date().toISOString()
      };

      await api.updateRound(activeRound.id, updated);
      setActiveRound(null);
      setRounds(prev => prev.map(r => r.id === activeRound.id ? updated : r));
      setActiveTab('history');
      const updatedStatus = await api.getStatus();
      setDbStatus(updatedStatus);
    } catch (err: any) {
      alert(`Error completing round: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResumeRound = (round: GolfRound) => {
    setActiveRound(round);
    setActiveTab('active_round');
  };

  const handleDeleteRound = async (id: string) => {
    try {
      setIsSyncing(true);
      await api.deleteRound(id);
      setRounds(prev => prev.filter(r => r.id !== id));
      if (activeRound?.id === id) {
        setActiveRound(null);
      }
      const updatedStatus = await api.getStatus();
      setDbStatus(updatedStatus);
    } catch (err: any) {
      console.error('Failed to delete round:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Course Handlers
  const handleCreateCourse = async (courseData: Partial<Course>) => {
    try {
      setIsSyncing(true);
      const created = await api.createCourse(courseData);
      setCourses(prev => [created, ...prev]);
      const updatedStatus = await api.getStatus();
      setDbStatus(updatedStatus);
    } catch (err: any) {
      console.error('Failed to create course:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    try {
      setIsSyncing(true);
      await api.deleteCourse(id);
      setCourses(prev => prev.filter(c => c.id !== id));
      const updatedStatus = await api.getStatus();
      setDbStatus(updatedStatus);
    } catch (err: any) {
      console.error('Failed to delete course:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateCourse = async (id: string, updates: Partial<Course>) => {
    try {
      setIsSyncing(true);
      const updated = await api.updateCourse(id, updates);
      setCourses(prev => prev.map(course => course.id === id ? updated : course));
    } catch (err: any) {
      console.error('Failed to update course:', err);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  // Player Handlers
  const handleCreatePlayer = async (playerData: Partial<Player>) => {
    try {
      setIsSyncing(true);
      const created = await api.createPlayer(playerData);
      setPlayers(prev => [...prev, created]);
      const updatedStatus = await api.getStatus();
      setDbStatus(updatedStatus);
    } catch (err: any) {
      console.error('Failed to create player:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdatePlayer = async (id: string, updates: Partial<Player>) => {
    try {
      setIsSyncing(true);
      const updated = await api.updatePlayer(id, updates);
      setPlayers(prev => prev.map(p => p.id === id ? updated : p));
    } catch (err: any) {
      console.error('Failed to update player:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeletePlayer = async (id: string) => {
    try {
      setIsSyncing(true);
      await api.deletePlayer(id);
      setPlayers(prev => prev.filter(p => p.id !== id));
      const updatedStatus = await api.getStatus();
      setDbStatus(updatedStatus);
    } catch (err: any) {
      console.error('Failed to delete player:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#2D3A27] text-[#F7F9F2] flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-[#8EA67B] flex items-center justify-center text-[#1D2619] shadow-xl animate-pulse mb-4">
          <Flag className="w-7 h-7 fill-current" />
        </div>
        <h2 className="text-xl font-bold font-serif">GolfScore Companion</h2>
        <p className="text-xs text-[#CCD7BE] mt-1 flex items-center gap-1.5 font-serif italic">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#E6CC7A]" />
          <span>Connecting to persistent score database...</span>
        </p>
      </div>
    );
  }

  const activeCourse = activeRound ? courses.find(c => c.id === activeRound.courseId) || courses[0] : null;

  return (
    <div className="min-h-screen bg-[#F7F9F2] text-[#2D3A27] flex flex-col font-sans antialiased selection:bg-[#8EA67B]/30 selection:text-[#2D3A27]">
      
      {/* Persistent App Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasActiveRound={!!activeRound}
        onNewRound={() => setIsNewRoundModalOpen(true)}
        onOpenDbModal={() => setIsDbModalOpen(true)}
        dbStatus={dbStatus}
        isSyncing={isSyncing}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 pb-24 md:pb-8">
        
        {/* Active Round Tab */}
        {activeTab === 'active_round' && (
          activeRound && activeCourse ? (
            <ActiveRoundView
              round={activeRound}
              course={activeCourse}
              onUpdateRound={handleUpdateActiveRound}
              onCompleteRound={handleCompleteRound}
              onStartNewRoundPrompt={() => setIsNewRoundModalOpen(true)}
              onDiscardRound={async () => {
                if (activeRound) {
                  await handleDeleteRound(activeRound.id);
                }
              }}
            />
          ) : (
            <div className="max-w-2xl mx-auto my-6 sm:my-8 bg-white rounded-3xl p-6 sm:p-10 shadow-xs border border-[#CCD7BE] text-center space-y-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-[#E9EDD9] text-[#2D3A27] border border-[#CCD7BE] flex items-center justify-center mx-auto shadow-xs">
                <Flag className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2] fill-[#8EA67B]/20" />
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#1D2619]">Ready for Your Round?</h2>
                <p className="text-sm text-[#6C7E64] max-w-md mx-auto mt-1">
                  Start a new scorecard with live hole-by-hole score counting, fairways in regulation, putts tracking, and instant database backup.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  id="btn-empty-start-new-round"
                  onClick={() => setIsNewRoundModalOpen(true)}
                  className="w-full sm:w-auto px-6 py-3.5 bg-[#2D3A27] hover:bg-[#1D2619] text-white font-bold text-sm rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2 touch-manipulation"
                >
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                  <span>Start New Round</span>
                </button>

                <button
                  id="btn-empty-view-database"
                  onClick={() => setActiveTab('history')}
                  className="w-full sm:w-auto px-5 py-3.5 bg-[#E9EDD9] hover:bg-[#DCE4D0] text-[#2D3A27] font-bold text-sm rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 border border-[#CCD7BE] touch-manipulation"
                >
                  <Database className="w-4 h-4 text-[#2D3A27]" />
                  <span>View Database ({rounds.length})</span>
                </button>
              </div>

              {/* Quick Resume from Past In-Progress Rounds */}
              {rounds.some(r => r.status === 'in_progress') && (
                <div className="pt-6 border-t border-[#E9EDD9] text-left">
                  <h4 className="text-xs font-bold text-[#7E8F77] uppercase tracking-wider mb-2">
                    Or Resume In-Progress Round
                  </h4>
                  <div className="space-y-2">
                    {rounds.filter(r => r.status === 'in_progress').map(ip => (
                      <div
                        key={ip.id}
                        className="p-3 bg-[#FBF6E2] border border-[#E6CC7A] rounded-xl flex items-center justify-between"
                      >
                        <div>
                          <span className="text-xs font-bold text-[#1D2619] block">{ip.courseName}</span>
                          <span className="text-[11px] text-[#6C7E64]">
                            {ip.players.map(p => p.playerName).join(', ')} • {new Date(ip.date).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          onClick={() => handleResumeRound(ip)}
                          className="px-3.5 py-2 bg-[#C2A649] hover:bg-[#B3963B] active:scale-95 text-[#1D2619] font-bold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1 touch-manipulation"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Resume</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        )}

        {/* Database & History Tab */}
        {activeTab === 'history' && (
          <RoundsHistory
            rounds={rounds}
            courses={courses}
            onResumeRound={handleResumeRound}
            onDeleteRound={handleDeleteRound}
            onNewRound={() => setIsNewRoundModalOpen(true)}
            onOpenDbModal={() => setIsDbModalOpen(true)}
          />
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <CourseManager
            courses={courses}
            onCreateCourse={handleCreateCourse}
            onUpdateCourse={handleUpdateCourse}
            onDeleteCourse={handleDeleteCourse}
            onStartRoundWithCourse={(cId) => {
              setIsNewRoundModalOpen(true);
            }}
          />
        )}

        {/* Players Tab */}
        {activeTab === 'players' && (
          <PlayerManager
            players={players}
            rounds={rounds}
            courses={courses}
            onCreatePlayer={handleCreatePlayer}
            onUpdatePlayer={handleUpdatePlayer}
            onDeletePlayer={handleDeletePlayer}
          />
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <AnalyticsView
            rounds={rounds}
            courses={courses}
            players={players}
          />
        )}

      </main>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasActiveRound={!!activeRound}
        onNewRound={() => setIsNewRoundModalOpen(true)}
        isSyncing={isSyncing}
      />

      {/* New Round Setup Modal */}
      <NewRoundModal
        isOpen={isNewRoundModalOpen}
        onClose={() => setIsNewRoundModalOpen(false)}
        courses={courses}
        players={players}
        onStartRound={handleStartRound}
        onOpenCreateCourse={() => {
          setIsNewRoundModalOpen(false);
          setActiveTab('courses');
        }}
        onOpenCreatePlayer={() => {
          setIsNewRoundModalOpen(false);
          setActiveTab('players');
        }}
      />

      {/* Database Tools Modal */}
      <DatabaseToolsModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        dbStatus={dbStatus}
        rounds={rounds}
        onRefreshData={loadData}
      />

    </div>
  );
}
