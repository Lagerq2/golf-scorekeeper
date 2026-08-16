import { Course, GolfRound, Player } from '../types';
import { normalizeCourseDistances } from '../utils/teeDistances';

const LOCAL_STORAGE_KEY_ROUNDS = 'golf_db_fallback_rounds';
const LOCAL_STORAGE_KEY_COURSES = 'golf_db_fallback_courses';
const LOCAL_STORAGE_KEY_PLAYERS = 'golf_db_fallback_players';

export interface DatabaseStatus {
  status: string;
  database: string;
  totalCourses: number;
  totalPlayers: number;
  totalRounds: number;
  completedRounds: number;
  inProgressRounds: number;
  lastUpdated: string;
  fileStorageBytes: number;
}

export const api = {
  // DB Status
  async getStatus(): Promise<DatabaseStatus> {
    try {
      const res = await fetch('/api/status');
      if (!res.ok) throw new Error('Status fetch failed');
      return await res.json();
    } catch {
      return {
        status: 'local_cached',
        database: 'Local Client Database (Offline Mode)',
        totalCourses: api.getLocalCourses().length,
        totalPlayers: api.getLocalPlayers().length,
        totalRounds: api.getLocalRounds().length,
        completedRounds: api.getLocalRounds().filter(r => r.status === 'completed').length,
        inProgressRounds: api.getLocalRounds().filter(r => r.status === 'in_progress').length,
        lastUpdated: new Date().toISOString(),
        fileStorageBytes: 0
      };
    }
  },

  // Courses
  async getCourses(): Promise<Course[]> {
    try {
      const res = await fetch('/api/courses');
      if (!res.ok) throw new Error('Failed to fetch courses');
      const data = (await res.json()).map(normalizeCourseDistances);
      localStorage.setItem(LOCAL_STORAGE_KEY_COURSES, JSON.stringify(data));
      return data;
    } catch {
      return api.getLocalCourses();
    }
  },

  async createCourse(course: Partial<Course>): Promise<Course> {
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(course)
      });
      if (!res.ok) throw new Error('Failed to create course');
      const created = normalizeCourseDistances(await res.json());
      const local = api.getLocalCourses();
      localStorage.setItem(LOCAL_STORAGE_KEY_COURSES, JSON.stringify([created, ...local]));
      return created;
    } catch (e: any) {
      const fallback: Course = {
        id: `course-${Date.now()}`,
        name: course.name || 'Custom Course',
        location: course.location || '',
        holesCount: course.holesCount || 18,
        parTotal: course.holes ? course.holes.reduce((s, h) => s + h.par, 0) : 72,
        holes: course.holes || [],
        createdAt: new Date().toISOString(),
        isCustom: true
      };
      const local = api.getLocalCourses();
      localStorage.setItem(LOCAL_STORAGE_KEY_COURSES, JSON.stringify([fallback, ...local]));
      return fallback;
    }
  },

  async updateCourse(id: string, updates: Partial<Course>): Promise<Course> {
    const res = await fetch(`/api/courses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update course');
    const updated = normalizeCourseDistances(await res.json());
    const local = api.getLocalCourses();
    localStorage.setItem(LOCAL_STORAGE_KEY_COURSES, JSON.stringify(local.map(course => course.id === id ? updated : course)));
    return updated;
  },

  async deleteCourse(id: string): Promise<void> {
    try {
      await fetch(`/api/courses/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('API deleteCourse fallback', e);
    }
    const local = api.getLocalCourses().filter(c => c.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY_COURSES, JSON.stringify(local));
  },

  // Players
  async getPlayers(): Promise<Player[]> {
    try {
      const res = await fetch('/api/players');
      if (!res.ok) throw new Error('Failed to fetch players');
      const data = await res.json();
      localStorage.setItem(LOCAL_STORAGE_KEY_PLAYERS, JSON.stringify(data));
      return data;
    } catch {
      return api.getLocalPlayers();
    }
  },

  async createPlayer(player: Partial<Player>): Promise<Player> {
    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(player)
      });
      if (!res.ok) throw new Error('Failed to create player');
      const created = await res.json();
      const local = api.getLocalPlayers();
      localStorage.setItem(LOCAL_STORAGE_KEY_PLAYERS, JSON.stringify([...local, created]));
      return created;
    } catch {
      const fallback: Player = {
        id: `player-${Date.now()}`,
        name: player.name || 'New Player',
        handicapIndex: player.handicapIndex !== undefined ? player.handicapIndex : 18.0,
        defaultTee: player.defaultTee || 'white',
        avatarBg: player.avatarBg || '#059669',
        createdAt: new Date().toISOString()
      };
      const local = api.getLocalPlayers();
      localStorage.setItem(LOCAL_STORAGE_KEY_PLAYERS, JSON.stringify([...local, fallback]));
      return fallback;
    }
  },

  async updatePlayer(id: string, updates: Partial<Player>): Promise<Player> {
    try {
      const res = await fetch(`/api/players/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed to update player');
      return await res.json();
    } catch {
      const local = api.getLocalPlayers();
      const idx = local.findIndex(p => p.id === id);
      if (idx !== -1) {
        local[idx] = { ...local[idx], ...updates };
        localStorage.setItem(LOCAL_STORAGE_KEY_PLAYERS, JSON.stringify(local));
        return local[idx];
      }
      throw new Error('Player not found');
    }
  },

  async deletePlayer(id: string): Promise<void> {
    try {
      await fetch(`/api/players/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('deletePlayer error', e);
    }
    const local = api.getLocalPlayers().filter(p => p.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY_PLAYERS, JSON.stringify(local));
  },

  // Rounds
  async getRounds(): Promise<GolfRound[]> {
    try {
      const res = await fetch('/api/rounds');
      if (!res.ok) throw new Error('Failed to fetch rounds');
      const data = await res.json();
      localStorage.setItem(LOCAL_STORAGE_KEY_ROUNDS, JSON.stringify(data));
      return data;
    } catch {
      return api.getLocalRounds();
    }
  },

  async getRoundById(id: string): Promise<GolfRound | null> {
    try {
      const res = await fetch(`/api/rounds/${id}`);
      if (!res.ok) throw new Error('Round not found');
      return await res.json();
    } catch {
      const local = api.getLocalRounds();
      return local.find(r => r.id === id) || null;
    }
  },

  async createRound(round: Partial<GolfRound>): Promise<GolfRound> {
    try {
      const res = await fetch('/api/rounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(round)
      });
      if (!res.ok) throw new Error('Failed to create round');
      const created = await res.json();
      const local = api.getLocalRounds();
      localStorage.setItem(LOCAL_STORAGE_KEY_ROUNDS, JSON.stringify([created, ...local]));
      return created;
    } catch {
      const fallback: GolfRound = {
        id: `round-${Date.now()}`,
        date: round.date || new Date().toISOString(),
        courseId: round.courseId || '',
        courseName: round.courseName || 'Golf Course',
        courseLocation: round.courseLocation || '',
        holesPlayed: round.holesPlayed || 18,
        startingHole: round.startingHole || 1,
        format: round.format || 'stroke',
        status: 'in_progress',
        weather: round.weather || '',
        notes: round.notes || '',
        players: round.players || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const local = api.getLocalRounds();
      localStorage.setItem(LOCAL_STORAGE_KEY_ROUNDS, JSON.stringify([fallback, ...local]));
      return fallback;
    }
  },

  async updateRound(id: string, updates: Partial<GolfRound>): Promise<GolfRound> {
    try {
      const res = await fetch(`/api/rounds/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed to update round');
      const updated = await res.json();
      const local = api.getLocalRounds();
      const idx = local.findIndex(r => r.id === id);
      if (idx !== -1) {
        local[idx] = updated;
      } else {
        local.unshift(updated);
      }
      localStorage.setItem(LOCAL_STORAGE_KEY_ROUNDS, JSON.stringify(local));
      return updated;
    } catch {
      const local = api.getLocalRounds();
      const idx = local.findIndex(r => r.id === id);
      if (idx !== -1) {
        local[idx] = { ...local[idx], ...updates, updatedAt: new Date().toISOString() };
        localStorage.setItem(LOCAL_STORAGE_KEY_ROUNDS, JSON.stringify(local));
        return local[idx];
      }
      throw new Error('Round not found');
    }
  },

  async deleteRound(id: string): Promise<void> {
    try {
      await fetch(`/api/rounds/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('deleteRound error', e);
    }
    const local = api.getLocalRounds().filter(r => r.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY_ROUNDS, JSON.stringify(local));
  },

  // DB Backup / Restore / Reset
  async exportBackup(): Promise<any> {
    const res = await fetch('/api/database/export');
    if (!res.ok) throw new Error('Failed to export backup');
    return await res.json();
  },

  async restoreBackup(backupData: any): Promise<any> {
    const res = await fetch('/api/database/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backupData)
    });
    if (!res.ok) throw new Error('Failed to restore backup');
    return await res.json();
  },

  async resetDatabase(): Promise<any> {
    const res = await fetch('/api/database/reset', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset database');
    return await res.json();
  },

  // Local Storage Fallbacks
  getLocalRounds(): GolfRound[] {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY_ROUNDS);
      return data ? JSON.parse(data).map(normalizeCourseDistances) : [];
    } catch {
      return [];
    }
  },

  getLocalCourses(): Course[] {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY_COURSES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  getLocalPlayers(): Player[] {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY_PLAYERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
};
