import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const DATA_DIR = path.join(process.cwd(), 'data');
const QUESTIONS_FILE = path.join(DATA_DIR, 'questions.json');
const ATTEMPTS_FILE = path.join(DATA_DIR, 'attempts.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const DATA_PDFS_DIR = path.join(DATA_DIR, 'pdfs');
const DATA_PDFS_META = path.join(DATA_PDFS_DIR, 'metadata.json');
const PUBLIC_PDFS_DIR = path.join(process.cwd(), 'public', 'pdfs');
const PUBLIC_PDFS_META = path.join(PUBLIC_PDFS_DIR, 'metadata.json');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_PDFS_DIR)) {
  fs.mkdirSync(DATA_PDFS_DIR, { recursive: true });
}
if (!fs.existsSync(PUBLIC_PDFS_DIR)) {
  fs.mkdirSync(PUBLIC_PDFS_DIR, { recursive: true });
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

  // Helper to normalize metadata into Record<number, any[]>
  function normalizePdfsMetadata(raw: Record<string, any>): Record<number, any[]> {
    const normalized: Record<number, any[]> = {};
    for (let w = 1; w <= 12; w++) {
      const entry = raw[w];
      if (Array.isArray(entry)) {
        normalized[w] = entry;
      } else if (entry && typeof entry === 'object') {
        normalized[w] = [
          {
            ...entry,
            id: entry.id || `w${w}-${entry.fileName || 'pdf'}`,
            storageName: entry.storageName || `week-${w}.pdf`,
            url: entry.url || `/pdfs/${entry.storageName || `week-${w}.pdf`}`,
          },
        ];
      } else {
        normalized[w] = [];
      }
    }
    return normalized;
  }

  // Get uploaded PDFs metadata from repo (supports multiple PDFs per week)
  app.get('/api/pdfs', (_req, res) => {
    const dataMeta = readJsonFile<Record<string, any>>(DATA_PDFS_META, {});
    const publicMeta = readJsonFile<Record<string, any>>(PUBLIC_PDFS_META, {});
    const normData = normalizePdfsMetadata(dataMeta);
    const normPublic = normalizePdfsMetadata(publicMeta);

    // Merge lists by ID/storageName
    const merged: Record<number, any[]> = {};
    for (let w = 1; w <= 12; w++) {
      const map = new Map<string, any>();
      (normPublic[w] || []).forEach((item) => {
        const key = item.id || item.storageName || item.fileName;
        map.set(key, item);
      });
      (normData[w] || []).forEach((item) => {
        const key = item.id || item.storageName || item.fileName;
        if (!map.has(key)) {
          map.set(key, item);
        }
      });

      // Also detect legacy week-{w}.pdf directly on disk if not tracked
      const pubFile = path.join(PUBLIC_PDFS_DIR, `week-${w}.pdf`);
      const dataFile = path.join(DATA_PDFS_DIR, `week-${w}.pdf`);
      const legacyPath = fs.existsSync(pubFile) ? pubFile : fs.existsSync(dataFile) ? dataFile : null;
      const alreadyHasFile = Array.from(map.values()).some(
        (item) => item.storageName === `week-${w}.pdf`
      );
      if (legacyPath && !alreadyHasFile) {
        const stats = fs.statSync(legacyPath);
        map.set(`week-${w}.pdf`, {
          id: `w${w}-legacy`,
          week: w,
          fileName: `week-${w}.pdf`,
          storageName: `week-${w}.pdf`,
          fileSize: stats.size,
          uploadedAt: stats.mtime.toISOString(),
          url: `/pdfs/week-${w}.pdf`,
        });
      }

      merged[w] = Array.from(map.values());
    }
    res.json(merged);
  });

  // Upload PDF for a specific week (1-12) - supports adding multiple PDFs
  app.post('/api/pdfs/:week', (req, res) => {
    const week = parseInt(req.params.week, 10);
    if (isNaN(week) || week < 1 || week > 12) {
      res.status(400).json({ error: 'Week must be between 1 and 12' });
      return;
    }
    const { fileName, fileData } = req.body;
    if (!fileData || typeof fileData !== 'string') {
      res.status(400).json({ error: 'fileData base64 is required' });
      return;
    }

    try {
      const base64Content = fileData.includes(',') ? fileData.split(',')[1] : fileData;
      const buffer = Buffer.from(base64Content, 'base64');

      const safeBase = (fileName || 'document.pdf')
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/\.pdf$/i, '');
      const uniqueStorageName = `week-${week}-${Date.now()}-${safeBase}.pdf`;

      // Save to repo data/pdfs and public/pdfs
      fs.writeFileSync(path.join(DATA_PDFS_DIR, uniqueStorageName), buffer);
      fs.writeFileSync(path.join(PUBLIC_PDFS_DIR, uniqueStorageName), buffer);

      const distPdfsDir = path.join(process.cwd(), 'dist', 'pdfs');
      if (fs.existsSync(distPdfsDir)) {
        fs.writeFileSync(path.join(distPdfsDir, uniqueStorageName), buffer);
      }

      const pdfInfo = {
        id: `pdf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        week,
        fileName: fileName || `Week-${week}.pdf`,
        storageName: uniqueStorageName,
        fileSize: buffer.length,
        uploadedAt: new Date().toISOString(),
        url: `/pdfs/${uniqueStorageName}`,
      };

      // Update metadata in data/pdfs and public/pdfs
      const dataMeta = normalizePdfsMetadata(readJsonFile<Record<string, any>>(DATA_PDFS_META, {}));
      dataMeta[week] = [...(dataMeta[week] || []), pdfInfo];
      writeJsonFile(DATA_PDFS_META, dataMeta);

      const publicMeta = normalizePdfsMetadata(readJsonFile<Record<string, any>>(PUBLIC_PDFS_META, {}));
      publicMeta[week] = [...(publicMeta[week] || []), pdfInfo];
      writeJsonFile(PUBLIC_PDFS_META, publicMeta);

      if (fs.existsSync(distPdfsDir)) {
        writeJsonFile(path.join(distPdfsDir, 'metadata.json'), publicMeta);
      }

      res.json({ success: true, pdf: pdfInfo, pdfs: publicMeta[week] });
    } catch (err) {
      console.error(`Error saving PDF for week ${week}:`, err);
      res.status(500).json({ error: 'Failed to save PDF' });
    }
  });

  // Get / View / Stream PDF for a week
  app.get('/api/pdfs/:week', (req, res) => {
    const week = parseInt(req.params.week, 10);
    const { id, storageName } = req.query;

    const publicMeta = normalizePdfsMetadata(readJsonFile<Record<string, any>>(PUBLIC_PDFS_META, {}));
    const weekList = publicMeta[week] || [];

    let targetItem = null;
    if (id) {
      targetItem = weekList.find((p) => p.id === id);
    } else if (storageName) {
      targetItem = weekList.find((p) => p.storageName === storageName);
    } else if (weekList.length > 0) {
      targetItem = weekList[0];
    }

    const fileNameToServe = targetItem ? targetItem.storageName : `week-${week}.pdf`;
    const pubFile = path.join(PUBLIC_PDFS_DIR, fileNameToServe);
    const dataFile = path.join(DATA_PDFS_DIR, fileNameToServe);
    const distFile = path.join(process.cwd(), 'dist', 'pdfs', fileNameToServe);
    const targetPath = fs.existsSync(pubFile)
      ? pubFile
      : fs.existsSync(dataFile)
      ? dataFile
      : fs.existsSync(distFile)
      ? distFile
      : null;

    if (!targetPath) {
      res.status(404).json({ error: 'PDF not found' });
      return;
    }

    const downloadName = targetItem?.fileName || fileNameToServe;
    res.setHeader('Content-Type', 'application/pdf');
    const disposition = req.query.download === '1' ? 'attachment' : 'inline';
    res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(downloadName)}"`);
    res.sendFile(targetPath);
  });

  // Delete a specific PDF for a week
  app.delete('/api/pdfs/:week', (req, res) => {
    const week = parseInt(req.params.week, 10);
    const fileId = (req.query.id as string) || (req.body && req.body.id);

    const publicMeta = normalizePdfsMetadata(readJsonFile<Record<string, any>>(PUBLIC_PDFS_META, {}));
    const dataMeta = normalizePdfsMetadata(readJsonFile<Record<string, any>>(DATA_PDFS_META, {}));

    const currentList = publicMeta[week] || [];
    const itemToDelete = fileId
      ? currentList.find((p) => p.id === fileId || p.storageName === fileId)
      : currentList[0];

    const storageNameToDelete = itemToDelete?.storageName || fileId || `week-${week}.pdf`;

    [
      path.join(DATA_PDFS_DIR, storageNameToDelete),
      path.join(PUBLIC_PDFS_DIR, storageNameToDelete),
      path.join(process.cwd(), 'dist', 'pdfs', storageNameToDelete),
    ].forEach((filePath) => {
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error(`Error deleting PDF ${filePath}:`, err);
        }
      }
    });

    if (fileId) {
      publicMeta[week] = (publicMeta[week] || []).filter(
        (p) => p.id !== fileId && p.storageName !== fileId
      );
      dataMeta[week] = (dataMeta[week] || []).filter(
        (p) => p.id !== fileId && p.storageName !== fileId
      );
    } else {
      publicMeta[week] = [];
      dataMeta[week] = [];
    }

    writeJsonFile(PUBLIC_PDFS_META, publicMeta);
    writeJsonFile(DATA_PDFS_META, dataMeta);

    const distPdfsDir = path.join(process.cwd(), 'dist', 'pdfs');
    if (fs.existsSync(distPdfsDir)) {
      writeJsonFile(path.join(distPdfsDir, 'metadata.json'), publicMeta);
    }

    res.json({ success: true, remaining: publicMeta[week] });
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

    // Also update questions in data/questions directory files (week-*.json, all-questions.json, test-data.json)
    const QUESTIONS_DIR = path.join(process.cwd(), 'data', 'questions');
    let dirDeletedCount = 0;
    if (fs.existsSync(QUESTIONS_DIR)) {
      try {
        const files = fs.readdirSync(QUESTIONS_DIR);
        for (const file of files) {
          if (file.endsWith('.json')) {
            const filePath = path.join(QUESTIONS_DIR, file);
            try {
              const fileContent = fs.readFileSync(filePath, 'utf-8');
              const list = JSON.parse(fileContent);
              if (Array.isArray(list)) {
                const updatedList = list.filter((q: any) => !idSet.has(q.id));
                if (updatedList.length !== list.length) {
                  dirDeletedCount += list.length - updatedList.length;
                  fs.writeFileSync(filePath, JSON.stringify(updatedList, null, 2), 'utf-8');
                }
              }
            } catch (err) {
              console.error(`Error filtering file ${file}:`, err);
            }
          }
        }
      } catch (err) {
        console.error('Error reading QUESTIONS_DIR:', err);
      }
    }

    const currentAttempts = readJsonFile<any[]>(ATTEMPTS_FILE, []);
    const filteredAttempts = currentAttempts.filter((a) => !idSet.has(a.questionId));
    writeJsonFile(ATTEMPTS_FILE, filteredAttempts);

    res.json({
      success: true,
      deleted: (currentQuestions.length - filtered.length) + dirDeletedCount,
      remaining: filtered.length,
    });
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

  // Serve static public folder and repository PDFs
  const publicDir = path.join(process.cwd(), 'public');
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
  }
  app.use('/pdfs', express.static(PUBLIC_PDFS_DIR));
  app.use('/data/pdfs', express.static(DATA_PDFS_DIR));

  // Vite middleware in dev or static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
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
