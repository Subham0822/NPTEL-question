import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const DATA_DIR = path.join(process.cwd(), 'data');
const QUESTIONS_FILE = path.join(DATA_DIR, 'questions.json');
const ATTEMPTS_FILE = path.join(DATA_DIR, 'attempts.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf-8');
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return defaultValue;
  }
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', dataDir: DATA_DIR });
  });

  // Get all data stored in directory
  app.get('/api/data', (_req, res) => {
    const questions = readJsonFile(QUESTIONS_FILE, []);
    const attempts = readJsonFile(ATTEMPTS_FILE, []);
    const sessions = readJsonFile(SESSIONS_FILE, []);
    res.json({ questions, attempts, sessions });
  });

  // Sync / save all data to directory files
  app.post('/api/sync', (req, res) => {
    const { questions, attempts, sessions } = req.body;
    if (Array.isArray(questions)) {
      writeJsonFile(QUESTIONS_FILE, questions);
    }
    if (Array.isArray(attempts)) {
      writeJsonFile(ATTEMPTS_FILE, attempts);
    }
    if (Array.isArray(sessions)) {
      writeJsonFile(SESSIONS_FILE, sessions);
    }
    res.json({ success: true, count: Array.isArray(questions) ? questions.length : 0 });
  });

  // Add questions directly to directory
  app.post('/api/questions', (req, res) => {
    const { questions: newQuestions } = req.body;
    if (!Array.isArray(newQuestions)) {
      res.status(400).json({ error: 'questions array is required' });
      return;
    }

    const currentQuestions = readJsonFile<any[]>(QUESTIONS_FILE, []);
    const updated = [...currentQuestions, ...newQuestions];
    writeJsonFile(QUESTIONS_FILE, updated);
    res.json({ success: true, added: newQuestions.length, total: updated.length });
  });

  // Update a question in directory
  app.put('/api/questions/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const currentQuestions = readJsonFile<any[]>(QUESTIONS_FILE, []);
    const index = currentQuestions.findIndex((q) => q.id === id);

    if (index === -1) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    currentQuestions[index] = { ...currentQuestions[index], ...updates };
    writeJsonFile(QUESTIONS_FILE, currentQuestions);
    res.json({ success: true, question: currentQuestions[index] });
  });

  // Delete a question in directory
  app.delete('/api/questions/:id', (req, res) => {
    const { id } = req.params;
    const currentQuestions = readJsonFile<any[]>(QUESTIONS_FILE, []);
    const initialLen = currentQuestions.length;
    const filtered = currentQuestions.filter((q) => q.id !== id);

    if (filtered.length === initialLen) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    writeJsonFile(QUESTIONS_FILE, filtered);
    res.json({ success: true, remaining: filtered.length });
  });

  // Bulk delete questions in directory
  app.post('/api/questions/bulk-delete', (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: 'ids array is required' });
      return;
    }
    const idSet = new Set(ids);
    const currentQuestions = readJsonFile<any[]>(QUESTIONS_FILE, []);
    const filtered = currentQuestions.filter((q) => !idSet.has(q.id));
    writeJsonFile(QUESTIONS_FILE, filtered);

    const currentAttempts = readJsonFile<any[]>(ATTEMPTS_FILE, []);
    const filteredAttempts = currentAttempts.filter((a) => !idSet.has(a.questionId));
    writeJsonFile(ATTEMPTS_FILE, filteredAttempts);

    res.json({ success: true, deleted: currentQuestions.length - filtered.length, remaining: filtered.length });
  });

  // Record an attempt in directory
  app.post('/api/attempts', (req, res) => {
    const attempt = req.body;
    if (!attempt || !attempt.questionId) {
      res.status(400).json({ error: 'Invalid attempt' });
      return;
    }

    const currentAttempts = readJsonFile<any[]>(ATTEMPTS_FILE, []);
    currentAttempts.push(attempt);
    writeJsonFile(ATTEMPTS_FILE, currentAttempts);
    res.json({ success: true, totalAttempts: currentAttempts.length });
  });

  // Reset week progress in directory
  app.post('/api/reset-week', (req, res) => {
    const { week } = req.body;
    const currentAttempts = readJsonFile<any[]>(ATTEMPTS_FILE, []);
    const filteredAttempts = currentAttempts.filter((a) => a.week !== week);
    writeJsonFile(ATTEMPTS_FILE, filteredAttempts);

    const currentSessions = readJsonFile<any[]>(SESSIONS_FILE, []);
    const filteredSessions = currentSessions.filter((s) => s.week !== week);
    writeJsonFile(SESSIONS_FILE, filteredSessions);

    res.json({ success: true });
  });

  // Reset all course progress in directory
  app.post('/api/reset-all', (_req, res) => {
    const currentAttempts = readJsonFile<any[]>(ATTEMPTS_FILE, []);
    const testOnlyAttempts = currentAttempts.filter((a) => a.source === 'test');
    writeJsonFile(ATTEMPTS_FILE, testOnlyAttempts);

    const currentSessions = readJsonFile<any[]>(SESSIONS_FILE, []);
    const testOnlySessions = currentSessions.filter((s) => s.week === 'test');
    writeJsonFile(SESSIONS_FILE, testOnlySessions);

    res.json({ success: true });
  });

  // Vite middleware in dev or static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
