import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial seed courses
const INITIAL_COURSES = [
  {
    id: 'course-augusta',
    name: 'Augusta National Golf Club',
    location: 'Augusta, Georgia',
    city: 'Augusta',
    country: 'USA',
    holesCount: 18,
    parTotal: 72,
    rating: 76.2,
    slope: 148,
    createdAt: new Date().toISOString(),
    isCustom: false,
    holes: [
      { holeNumber: 1, par: 4, handicapIndex: 9, yards: { red: 365, white: 400, blue: 445, black: 455 }, notes: 'Tea Olive' },
      { holeNumber: 2, par: 5, handicapIndex: 13, yards: { red: 485, white: 515, blue: 575, black: 585 }, notes: 'Pink Dogwood' },
      { holeNumber: 3, par: 4, handicapIndex: 15, yards: { red: 310, white: 330, blue: 350, black: 350 }, notes: 'Flowering Peach' },
      { holeNumber: 4, par: 3, handicapIndex: 5, yards: { red: 170, white: 200, blue: 240, black: 240 }, notes: 'Flowering Crab Apple' },
      { holeNumber: 5, par: 4, handicapIndex: 1, yards: { red: 410, white: 440, blue: 495, black: 495 }, notes: 'Magnolia' },
      { holeNumber: 6, par: 3, handicapIndex: 11, yards: { red: 150, white: 170, blue: 180, black: 180 }, notes: 'Juniper' },
      { holeNumber: 7, par: 4, handicapIndex: 7, yards: { red: 375, white: 410, blue: 450, black: 450 }, notes: 'Pampas' },
      { holeNumber: 8, par: 5, handicapIndex: 17, yards: { red: 480, white: 520, blue: 570, black: 570 }, notes: 'Yellow Jasmine' },
      { holeNumber: 9, par: 4, handicapIndex: 3, yards: { red: 380, white: 420, blue: 460, black: 460 }, notes: 'Carolina Cherry' },
      { holeNumber: 10, par: 4, handicapIndex: 2, yards: { red: 415, white: 450, blue: 495, black: 495 }, notes: 'Camellia' },
      { holeNumber: 11, par: 4, handicapIndex: 4, yards: { red: 425, white: 460, blue: 520, black: 520 }, notes: 'White Dogwood (Amen Corner)' },
      { holeNumber: 12, par: 3, handicapIndex: 12, yards: { red: 130, white: 145, blue: 155, black: 155 }, notes: 'Golden Bell (Rae\'s Creek)' },
      { holeNumber: 13, par: 5, handicapIndex: 16, yards: { red: 440, white: 475, blue: 510, black: 510 }, notes: 'Azalea (Amen Corner)' },
      { holeNumber: 14, par: 4, handicapIndex: 8, yards: { red: 360, white: 400, blue: 440, black: 440 }, notes: 'Chinese Fir' },
      { holeNumber: 15, par: 5, handicapIndex: 18, yards: { red: 455, white: 490, blue: 550, black: 550 }, notes: 'Firethorn' },
      { holeNumber: 16, par: 3, handicapIndex: 14, yards: { red: 145, white: 160, blue: 170, black: 170 }, notes: 'Redbud' },
      { holeNumber: 17, par: 4, handicapIndex: 10, yards: { red: 370, white: 405, blue: 440, black: 440 }, notes: 'Nandina' },
      { holeNumber: 18, par: 4, handicapIndex: 6, yards: { red: 390, white: 420, blue: 465, black: 465 }, notes: 'Holly' }
    ]
  },
  {
    id: 'course-pebble',
    name: 'Pebble Beach Golf Links',
    location: 'Pebble Beach, California',
    city: 'Pebble Beach',
    country: 'USA',
    holesCount: 18,
    parTotal: 72,
    rating: 75.5,
    slope: 145,
    createdAt: new Date().toISOString(),
    isCustom: false,
    holes: [
      { holeNumber: 1, par: 4, handicapIndex: 8, yards: { red: 310, white: 345, blue: 375, black: 380 }, notes: '' },
      { holeNumber: 2, par: 5, handicapIndex: 10, yards: { red: 420, white: 460, blue: 502, black: 516 }, notes: '' },
      { holeNumber: 3, par: 4, handicapIndex: 12, yards: { red: 315, white: 350, blue: 390, black: 404 }, notes: '' },
      { holeNumber: 4, par: 4, handicapIndex: 16, yards: { red: 260, white: 300, blue: 326, black: 331 }, notes: '' },
      { holeNumber: 5, par: 3, handicapIndex: 14, yards: { red: 125, white: 155, blue: 185, black: 195 }, notes: '' },
      { holeNumber: 6, par: 5, handicapIndex: 2, yards: { red: 430, white: 470, blue: 513, black: 523 }, notes: 'Cliffs along ocean' },
      { holeNumber: 7, par: 3, handicapIndex: 18, yards: { red: 95, white: 100, blue: 106, black: 106 }, notes: 'Iconic downhill par 3' },
      { holeNumber: 8, par: 4, handicapIndex: 6, yards: { red: 355, white: 390, blue: 418, black: 428 }, notes: 'Dramatic ocean chasm' },
      { holeNumber: 9, par: 4, handicapIndex: 4, yards: { red: 405, white: 440, blue: 466, black: 483 }, notes: '' },
      { holeNumber: 10, par: 4, handicapIndex: 5, yards: { red: 390, white: 420, blue: 446, black: 495 }, notes: '' },
      { holeNumber: 11, par: 4, handicapIndex: 7, yards: { red: 310, white: 350, blue: 373, black: 390 }, notes: '' },
      { holeNumber: 12, par: 3, handicapIndex: 17, yards: { red: 150, white: 175, blue: 201, black: 202 }, notes: '' },
      { holeNumber: 13, par: 4, handicapIndex: 9, yards: { red: 330, white: 370, blue: 399, black: 445 }, notes: '' },
      { holeNumber: 14, par: 5, handicapIndex: 1, yards: { red: 460, white: 510, blue: 565, black: 580 }, notes: '' },
      { holeNumber: 15, par: 4, handicapIndex: 13, yards: { red: 315, white: 360, blue: 396, black: 403 }, notes: '' },
      { holeNumber: 16, par: 4, handicapIndex: 11, yards: { red: 330, white: 370, blue: 401, black: 403 }, notes: '' },
      { holeNumber: 17, par: 3, handicapIndex: 15, yards: { red: 140, white: 170, blue: 178, black: 208 }, notes: '' },
      { holeNumber: 18, par: 5, handicapIndex: 3, yards: { red: 440, white: 490, blue: 543, black: 543 }, notes: 'Legendary finishing hole' }
    ]
  },
  {
    id: 'course-standrews',
    name: 'St Andrews Links (Old Course)',
    location: 'St Andrews, Fife',
    city: 'St Andrews',
    country: 'Scotland',
    holesCount: 18,
    parTotal: 72,
    rating: 73.1,
    slope: 132,
    createdAt: new Date().toISOString(),
    isCustom: false,
    holes: [
      { holeNumber: 1, par: 4, handicapIndex: 10, yards: { red: 335, white: 355, blue: 376, black: 376 }, notes: 'Burn' },
      { holeNumber: 2, par: 4, handicapIndex: 6, yards: { red: 370, white: 395, blue: 453, black: 453 }, notes: 'Dyke' },
      { holeNumber: 3, par: 4, handicapIndex: 16, yards: { red: 320, white: 350, blue: 397, black: 397 }, notes: 'Cartgate (Out)' },
      { holeNumber: 4, par: 4, handicapIndex: 8, yards: { red: 400, white: 430, blue: 480, black: 480 }, notes: 'Ginger Beer' },
      { holeNumber: 5, par: 5, handicapIndex: 2, yards: { red: 485, white: 514, blue: 568, black: 568 }, notes: 'Hole O\'Cross (Out)' },
      { holeNumber: 6, par: 4, handicapIndex: 14, yards: { red: 340, white: 374, blue: 412, black: 412 }, notes: 'Heathery (Out)' },
      { holeNumber: 7, par: 4, handicapIndex: 12, yards: { red: 325, white: 359, blue: 371, black: 371 }, notes: 'High (Out)' },
      { holeNumber: 8, par: 3, handicapIndex: 18, yards: { red: 145, white: 166, blue: 175, black: 175 }, notes: 'Short' },
      { holeNumber: 9, par: 4, handicapIndex: 4, yards: { red: 310, white: 347, blue: 352, black: 352 }, notes: 'End' },
      { holeNumber: 10, par: 4, handicapIndex: 5, yards: { red: 310, white: 340, blue: 386, black: 386 }, notes: 'Bobby Jones' },
      { holeNumber: 11, par: 3, handicapIndex: 17, yards: { red: 140, white: 164, blue: 174, black: 174 }, notes: 'High (In)' },
      { holeNumber: 12, par: 4, handicapIndex: 11, yards: { red: 300, white: 316, blue: 348, black: 348 }, notes: 'Heathery (In)' },
      { holeNumber: 13, par: 4, handicapIndex: 7, yards: { red: 380, white: 418, blue: 465, black: 465 }, notes: 'Hole O\'Cross (In)' },
      { holeNumber: 14, par: 5, handicapIndex: 1, yards: { red: 510, white: 530, blue: 618, black: 618 }, notes: 'Long' },
      { holeNumber: 15, par: 4, handicapIndex: 13, yards: { red: 370, white: 412, blue: 455, black: 455 }, notes: 'Cartgate (In)' },
      { holeNumber: 16, par: 4, handicapIndex: 15, yards: { red: 340, white: 381, blue: 423, black: 423 }, notes: 'Corner of the Dyke' },
      { holeNumber: 17, par: 4, handicapIndex: 3, yards: { red: 415, white: 455, blue: 495, black: 495 }, notes: 'Road Hole' },
      { holeNumber: 18, par: 4, handicapIndex: 9, yards: { red: 330, white: 357, blue: 357, black: 357 }, notes: 'Tom Morris / Swilcan Bridge' }
    ]
  },
  {
    id: 'course-sawgrass',
    name: 'TPC Sawgrass (Stadium Course)',
    location: 'Ponte Vedra Beach, Florida',
    city: 'Ponte Vedra Beach',
    country: 'USA',
    holesCount: 18,
    parTotal: 72,
    rating: 76.4,
    slope: 155,
    createdAt: new Date().toISOString(),
    isCustom: false,
    holes: [
      { holeNumber: 1, par: 4, handicapIndex: 7, yards: { red: 340, white: 375, blue: 395, black: 423 }, notes: '' },
      { holeNumber: 2, par: 5, handicapIndex: 13, yards: { red: 465, white: 505, blue: 532, black: 532 }, notes: '' },
      { holeNumber: 3, par: 3, handicapIndex: 17, yards: { red: 125, white: 150, blue: 177, black: 177 }, notes: '' },
      { holeNumber: 4, par: 4, handicapIndex: 3, yards: { red: 320, white: 355, blue: 384, black: 384 }, notes: '' },
      { holeNumber: 5, par: 4, handicapIndex: 1, yards: { red: 390, white: 430, blue: 471, black: 471 }, notes: '' },
      { holeNumber: 6, par: 4, handicapIndex: 11, yards: { red: 330, white: 365, blue: 393, black: 393 }, notes: '' },
      { holeNumber: 7, par: 4, handicapIndex: 5, yards: { red: 365, white: 400, blue: 451, black: 451 }, notes: '' },
      { holeNumber: 8, par: 3, handicapIndex: 15, yards: { red: 160, white: 190, blue: 237, black: 237 }, notes: '' },
      { holeNumber: 9, par: 5, handicapIndex: 9, yards: { red: 490, white: 535, blue: 583, black: 583 }, notes: '' },
      { holeNumber: 10, par: 4, handicapIndex: 12, yards: { red: 350, white: 385, blue: 424, black: 424 }, notes: '' },
      { holeNumber: 11, par: 5, handicapIndex: 8, yards: { red: 470, white: 510, blue: 558, black: 558 }, notes: '' },
      { holeNumber: 12, par: 4, handicapIndex: 16, yards: { red: 275, white: 320, blue: 358, black: 369 }, notes: 'Drivable par 4' },
      { holeNumber: 13, par: 3, handicapIndex: 18, yards: { red: 135, white: 155, blue: 181, black: 181 }, notes: '' },
      { holeNumber: 14, par: 4, handicapIndex: 2, yards: { red: 380, white: 435, blue: 481, black: 481 }, notes: '' },
      { holeNumber: 15, par: 4, handicapIndex: 10, yards: { red: 365, white: 410, blue: 449, black: 449 }, notes: '' },
      { holeNumber: 16, par: 5, handicapIndex: 14, yards: { red: 445, white: 485, blue: 523, black: 523 }, notes: 'Risk / Reward par 5' },
      { holeNumber: 17, par: 3, handicapIndex: 6, yards: { red: 110, white: 125, blue: 137, black: 137 }, notes: 'Famous Island Green' },
      { holeNumber: 18, par: 4, handicapIndex: 4, yards: { red: 395, white: 430, blue: 462, black: 462 }, notes: 'Water all along left' }
    ]
  },
  {
    id: 'course-pine-valley',
    name: 'Pine Valley Executive 9',
    location: 'Clementon, New Jersey',
    city: 'Clementon',
    country: 'USA',
    holesCount: 9,
    parTotal: 36,
    rating: 35.8,
    slope: 128,
    createdAt: new Date().toISOString(),
    isCustom: false,
    holes: [
      { holeNumber: 1, par: 4, handicapIndex: 3, yards: { red: 320, white: 355, blue: 390, black: 410 }, notes: '' },
      { holeNumber: 2, par: 4, handicapIndex: 1, yards: { red: 340, white: 375, blue: 410, black: 430 }, notes: '' },
      { holeNumber: 3, par: 3, handicapIndex: 9, yards: { red: 130, white: 155, blue: 180, black: 195 }, notes: '' },
      { holeNumber: 4, par: 5, handicapIndex: 5, yards: { red: 460, white: 495, blue: 530, black: 555 }, notes: '' },
      { holeNumber: 5, par: 3, handicapIndex: 7, yards: { red: 140, white: 165, blue: 190, black: 205 }, notes: '' },
      { holeNumber: 6, par: 4, handicapIndex: 4, yards: { red: 310, white: 345, blue: 380, black: 400 }, notes: '' },
      { holeNumber: 7, par: 5, handicapIndex: 2, yards: { red: 470, white: 510, blue: 545, black: 570 }, notes: '' },
      { holeNumber: 8, par: 4, handicapIndex: 8, yards: { red: 290, white: 320, blue: 355, black: 375 }, notes: '' },
      { holeNumber: 9, par: 4, handicapIndex: 6, yards: { red: 330, white: 365, blue: 400, black: 420 }, notes: '' }
    ]
  }
];

const INITIAL_PLAYERS = [
  {
    id: 'player-1',
    name: 'Elias',
    handicapIndex: 9.4,
    defaultTee: 'white',
    avatarBg: '#059669', // Emerald
    createdAt: new Date().toISOString()
  },
  {
    id: 'player-2',
    name: 'Alex Miller',
    handicapIndex: 14.2,
    defaultTee: 'white',
    avatarBg: '#2563eb', // Blue
    createdAt: new Date().toISOString()
  },
  {
    id: 'player-3',
    name: 'Jordan Smith',
    handicapIndex: 6.8,
    defaultTee: 'blue',
    avatarBg: '#7c3aed', // Purple
    createdAt: new Date().toISOString()
  },
  {
    id: 'player-4',
    name: 'Sam Taylor',
    handicapIndex: 18.0,
    defaultTee: 'red',
    avatarBg: '#d97706', // Amber
    createdAt: new Date().toISOString()
  }
];

// Helper to seed a sample completed round
const createSampleCompletedRound = () => {
  const course = INITIAL_COURSES[0];
  const holeScores1: Record<number, any> = {};
  const holeScores2: Record<number, any> = {};

  const scores1 = [4, 5, 4, 3, 5, 3, 4, 4, 4, 5, 4, 2, 4, 4, 5, 3, 4, 4]; // 75 (+3)
  const putts1 =  [2, 2, 2, 1, 2, 2, 1, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2];

  const scores2 = [5, 6, 4, 4, 5, 3, 5, 5, 5, 5, 5, 3, 6, 4, 6, 4, 5, 5]; // 85 (+13)
  const putts2 =  [2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1, 2, 2, 3, 2, 2, 2];

  for (let i = 1; i <= 18; i++) {
    holeScores1[i] = {
      holeNumber: i,
      strokes: scores1[i - 1],
      putts: putts1[i - 1],
      fairwayHit: course.holes[i - 1].par > 3 ? (i % 3 === 0 ? 'left' : 'hit') : 'na',
      greenInRegulation: scores1[i - 1] <= course.holes[i - 1].par,
      penalties: 0,
      sandSave: false
    };

    holeScores2[i] = {
      holeNumber: i,
      strokes: scores2[i - 1],
      putts: putts2[i - 1],
      fairwayHit: course.holes[i - 1].par > 3 ? (i % 2 === 0 ? 'hit' : 'right') : 'na',
      greenInRegulation: scores2[i - 1] <= course.holes[i - 1].par,
      penalties: i === 13 ? 1 : 0,
      sandSave: false
    };
  }

  return {
    id: 'round-sample-1',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    courseId: 'course-augusta',
    courseName: 'Augusta National Golf Club',
    courseLocation: 'Augusta, Georgia',
    holesPlayed: 18,
    startingHole: 1,
    format: 'stroke',
    status: 'completed',
    weather: 'Sunny, 72°F / 22°C, Light Breeze',
    notes: 'Great match play round! Chipped in for birdie on 12.',
    players: [
      {
        playerId: 'player-1',
        playerName: 'Elias',
        handicap: 9.4,
        teeColor: 'white',
        holeScores: holeScores1
      },
      {
        playerId: 'player-2',
        playerName: 'Alex Miller',
        handicap: 14.2,
        teeColor: 'white',
        holeScores: holeScores2
      }
    ],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  };
};

interface DatabaseSchema {
  courses: typeof INITIAL_COURSES;
  players: typeof INITIAL_PLAYERS;
  rounds: any[];
  version: string;
  lastUpdated: string;
}

function loadDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed.courses && parsed.players && parsed.rounds) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading DB_FILE, initializing fresh database:', err);
  }

  const initialDb: DatabaseSchema = {
    courses: INITIAL_COURSES,
    players: INITIAL_PLAYERS,
    rounds: [createSampleCompletedRound()],
    version: '1.0.0',
    lastUpdated: new Date().toISOString()
  };

  saveDatabase(initialDb);
  return initialDb;
}

function saveDatabase(db: DatabaseSchema) {
  try {
    db.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to DB_FILE:', err);
  }
}

// In-memory synced DB instance
let db = loadDatabase();

// ================= API ROUTES =================

// 1. Status / Health & Stats
app.get('/api/status', (req, res) => {
  const stats = {
    status: 'online',
    database: 'Firestore/JSON Native Database',
    totalCourses: db.courses.length,
    totalPlayers: db.players.length,
    totalRounds: db.rounds.length,
    completedRounds: db.rounds.filter(r => r.status === 'completed').length,
    inProgressRounds: db.rounds.filter(r => r.status === 'in_progress').length,
    lastUpdated: db.lastUpdated,
    fileStorageBytes: fs.existsSync(DB_FILE) ? fs.statSync(DB_FILE).size : 0
  };
  res.json(stats);
});

// 2. Courses
app.get('/api/courses', (req, res) => {
  res.json(db.courses);
});

app.post('/api/courses', (req, res) => {
  try {
    const { name, location, city, country, holesCount, holes, rating, slope } = req.body;
    if (!name || !holes || !Array.isArray(holes)) {
      return res.status(400).json({ error: 'Name and valid holes array are required' });
    }

    const parTotal = holes.reduce((sum: number, h: any) => sum + (Number(h.par) || 4), 0);
    const newCourse: any = {
      id: `course-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      location: location || '',
      city: city || '',
      country: country || '',
      holesCount: Number(holesCount) === 9 ? 9 : 18,
      holes,
      parTotal,
      createdAt: new Date().toISOString(),
      isCustom: true
    };

    if (rating) newCourse.rating = Number(rating);
    if (slope) newCourse.slope = Number(slope);

    db.courses.unshift(newCourse);
    saveDatabase(db);
    res.status(201).json(newCourse);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/courses/:id', (req, res) => {
  try {
    const index = db.courses.findIndex(c => c.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const updated = {
      ...db.courses[index],
      ...req.body,
      id: req.params.id,
      parTotal: req.body.holes
        ? req.body.holes.reduce((sum: number, h: any) => sum + (Number(h.par) || 4), 0)
        : db.courses[index].parTotal
    };

    db.courses[index] = updated;
    saveDatabase(db);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/courses/:id', (req, res) => {
  const index = db.courses.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Course not found' });
  }
  const deleted = db.courses.splice(index, 1)[0];
  saveDatabase(db);
  res.json({ message: 'Course deleted', course: deleted });
});

// 3. Players
app.get('/api/players', (req, res) => {
  res.json(db.players);
});

app.post('/api/players', (req, res) => {
  try {
    const { name, handicapIndex, defaultTee, avatarBg } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Player name is required' });
    }

    const palette = ['#059669', '#2563eb', '#7c3aed', '#d97706', '#dc2626', '#0891b2', '#4f46e5'];
    const newPlayer = {
      id: `player-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      handicapIndex: handicapIndex !== undefined ? Number(handicapIndex) : 18.0,
      defaultTee: defaultTee || 'white',
      avatarBg: avatarBg || palette[Math.floor(Math.random() * palette.length)],
      createdAt: new Date().toISOString()
    };

    db.players.push(newPlayer);
    saveDatabase(db);
    res.status(201).json(newPlayer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/players/:id', (req, res) => {
  const index = db.players.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Player not found' });
  }
  db.players[index] = {
    ...db.players[index],
    ...req.body,
    id: req.params.id
  };
  saveDatabase(db);
  res.json(db.players[index]);
});

app.delete('/api/players/:id', (req, res) => {
  const index = db.players.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Player not found' });
  }
  const deleted = db.players.splice(index, 1)[0];
  saveDatabase(db);
  res.json({ message: 'Player deleted', player: deleted });
});

// 4. Rounds
app.get('/api/rounds', (req, res) => {
  let list = [...db.rounds];
  const { status, playerId, courseId } = req.query;

  if (status) {
    list = list.filter(r => r.status === status);
  }
  if (courseId) {
    list = list.filter(r => r.courseId === courseId);
  }
  if (playerId) {
    list = list.filter(r => r.players?.some((p: any) => p.playerId === playerId));
  }

  // Sort by date descending
  list.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());

  res.json(list);
});

app.get('/api/rounds/:id', (req, res) => {
  const round = db.rounds.find(r => r.id === req.params.id);
  if (!round) {
    return res.status(404).json({ error: 'Round not found' });
  }
  res.json(round);
});

app.post('/api/rounds', (req, res) => {
  try {
    const { courseId, courseName, courseLocation, holesPlayed, startingHole, format, players, weather, notes, date } = req.body;
    if (!courseId || !players || !Array.isArray(players) || players.length === 0) {
      return res.status(400).json({ error: 'Course and at least one player are required' });
    }

    const newRound = {
      id: `round-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      date: date || new Date().toISOString(),
      courseId,
      courseName: courseName || 'Golf Course',
      courseLocation: courseLocation || '',
      holesPlayed: Number(holesPlayed) === 9 ? 9 : 18,
      startingHole: Number(startingHole) || 1,
      format: format || 'stroke',
      status: 'in_progress',
      weather: weather || '',
      notes: notes || '',
      players,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.rounds.unshift(newRound);
    saveDatabase(db);
    res.status(201).json(newRound);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/rounds/:id', (req, res) => {
  try {
    const index = db.rounds.findIndex(r => r.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Round not found' });
    }

    const updated = {
      ...db.rounds[index],
      ...req.body,
      id: req.params.id,
      updatedAt: new Date().toISOString()
    };

    db.rounds[index] = updated;
    saveDatabase(db);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/rounds/:id', (req, res) => {
  const index = db.rounds.findIndex(r => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Round not found' });
  }
  const deleted = db.rounds.splice(index, 1)[0];
  saveDatabase(db);
  res.json({ message: 'Round deleted', round: deleted });
});

// 5. Database Backup & Restore & Reset
app.get('/api/database/export', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=golf-database-backup-${new Date().toISOString().split('T')[0]}.json`);
  res.json(db);
});

app.post('/api/database/restore', (req, res) => {
  try {
    const backup = req.body;
    if (!backup || !Array.isArray(backup.courses) || !Array.isArray(backup.players) || !Array.isArray(backup.rounds)) {
      return res.status(400).json({ error: 'Invalid database backup structure' });
    }

    db = {
      courses: backup.courses,
      players: backup.players,
      rounds: backup.rounds,
      version: backup.version || '1.0.0',
      lastUpdated: new Date().toISOString()
    };

    saveDatabase(db);
    res.json({ message: 'Database restored successfully', counts: { courses: db.courses.length, players: db.players.length, rounds: db.rounds.length } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/database/reset', (req, res) => {
  db = {
    courses: INITIAL_COURSES,
    players: INITIAL_PLAYERS,
    rounds: [createSampleCompletedRound()],
    version: '1.0.0',
    lastUpdated: new Date().toISOString()
  };
  saveDatabase(db);
  res.json({ message: 'Database reset to initial sample records' });
});

// ================= VITE INTEGRATION =================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Golf Scorekeeper server running on http://localhost:${PORT}`);
  });
}

startServer();
