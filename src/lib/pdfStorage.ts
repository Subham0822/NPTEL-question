export interface WeeklyPdf {
  id: string;
  week: number;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  storageName?: string;
  url?: string;
  dataUrl?: string;
}

const DB_NAME = 'NPTEL_PDF_STORAGE_V2';
const DB_VERSION = 1;
const STORE_NAME = 'pdfs';

function openPdfDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('week', 'week', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGetPdfs(): Promise<Record<number, WeeklyPdf[]>> {
  try {
    const db = await openPdfDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const result: Record<number, WeeklyPdf[]> = {};
        for (let w = 1; w <= 12; w++) {
          result[w] = [];
        }
        if (Array.isArray(req.result)) {
          req.result.forEach((item) => {
            if (item && item.week >= 1 && item.week <= 12) {
              if (!result[item.week]) {
                result[item.week] = [];
              }
              result[item.week].push(item);
            }
          });
        }
        resolve(result);
      };
      req.onerror = () => {
        const empty: Record<number, WeeklyPdf[]> = {};
        for (let w = 1; w <= 12; w++) empty[w] = [];
        resolve(empty);
      };
    });
  } catch {
    const empty: Record<number, WeeklyPdf[]> = {};
    for (let w = 1; w <= 12; w++) empty[w] = [];
    return empty;
  }
}

async function idbSavePdf(pdf: WeeklyPdf & { fileData?: string }): Promise<void> {
  try {
    const db = await openPdfDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(pdf);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // ignore
  }
}

async function idbDeletePdf(fileId: string): Promise<void> {
  try {
    const db = await openPdfDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(fileId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // ignore
  }
}

function normalizeRawPdfItem(raw: any, week: number): WeeklyPdf {
  const fileName = raw.fileName || `week-${week}.pdf`;
  const storageName = raw.storageName || `week-${week}.pdf`;
  return {
    id: raw.id || `pdf-${week}-${storageName}`,
    week,
    fileName,
    storageName,
    fileSize: raw.fileSize || 0,
    uploadedAt: raw.uploadedAt || new Date().toISOString(),
    url: raw.url || `/pdfs/${storageName}`,
    dataUrl: raw.dataUrl,
  };
}

/**
 * Fetches all PDFs grouped by week (1–12), supporting multiple PDFs per week.
 */
export async function fetchWeeklyPdfs(): Promise<Record<number, WeeklyPdf[]>> {
  const result: Record<number, WeeklyPdf[]> = {};
  for (let w = 1; w <= 12; w++) {
    result[w] = [];
  }

  // 1. Try server API endpoint
  try {
    const res = await fetch('/api/pdfs');
    if (res.ok) {
      const serverData = await res.json();
      if (typeof serverData === 'object' && serverData !== null) {
        for (let w = 1; w <= 12; w++) {
          const entry = serverData[w];
          if (Array.isArray(entry)) {
            result[w] = entry.map((item) => normalizeRawPdfItem(item, w));
          } else if (entry && typeof entry === 'object') {
            result[w] = [normalizeRawPdfItem(entry, w)];
          }
        }
      }
    }
  } catch {
    // server API offline
  }

  // 2. Try static repo metadata (/pdfs/metadata.json)
  try {
    const staticRes = await fetch('/pdfs/metadata.json');
    if (staticRes.ok) {
      const staticData = await staticRes.json();
      if (typeof staticData === 'object' && staticData !== null) {
        for (let w = 1; w <= 12; w++) {
          const entry = staticData[w];
          const existingIds = new Set(result[w].map((p) => p.id || p.storageName));
          const addIfNew = (item: any) => {
            const normalized = normalizeRawPdfItem(item, w);
            if (!existingIds.has(normalized.id) && !existingIds.has(normalized.storageName)) {
              result[w].push(normalized);
              existingIds.add(normalized.id);
            }
          };

          if (Array.isArray(entry)) {
            entry.forEach(addIfNew);
          } else if (entry && typeof entry === 'object') {
            addIfNew(entry);
          }
        }
      }
    }
  } catch {
    // static file error
  }

  // 3. Backward compat check: if week-X.pdf exists directly in repo and not yet tracked
  for (let w = 1; w <= 12; w++) {
    if (result[w].length === 0) {
      try {
        const probeRes = await fetch(`/pdfs/week-${w}.pdf`, { method: 'HEAD' });
        if (probeRes.ok) {
          const contentType = probeRes.headers.get('content-type') || '';
          if (!contentType.includes('text/html')) {
            const contentLength = parseInt(probeRes.headers.get('content-length') || '0', 10);
            result[w].push({
              id: `w${w}-legacy`,
              week: w,
              fileName: `week-${w}.pdf`,
              storageName: `week-${w}.pdf`,
              fileSize: contentLength || 0,
              uploadedAt: new Date().toISOString(),
              url: `/pdfs/week-${w}.pdf`,
            });
          }
        }
      } catch {
        // file not present
      }
    }
  }

  // 4. Merge any local IndexedDB cache items
  const localMap = await idbGetPdfs();
  for (let w = 1; w <= 12; w++) {
    const existingIds = new Set(result[w].map((p) => p.id || p.storageName));
    (localMap[w] || []).forEach((item) => {
      if (!existingIds.has(item.id) && !existingIds.has(item.storageName)) {
        result[w].push(item);
        existingIds.add(item.id);
      }
    });
  }

  return result;
}

export async function uploadWeeklyPdf(week: number, file: File): Promise<WeeklyPdf> {
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const tempId = `pdf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const pdfRecord: WeeklyPdf = {
    id: tempId,
    week,
    fileName: file.name,
    fileSize: file.size,
    uploadedAt: new Date().toISOString(),
    dataUrl: base64Data,
  };

  await idbSavePdf(pdfRecord);

  try {
    const res = await fetch(`/api/pdfs/${week}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileData: base64Data,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.pdf) {
        const saved = {
          ...pdfRecord,
          ...data.pdf,
        };
        await idbSavePdf(saved);
        return saved;
      }
    }
  } catch (err) {
    console.warn('Server upload error, using local fallback:', err);
  }

  return pdfRecord;
}

export async function removeWeeklyPdf(week: number, fileId: string): Promise<void> {
  await idbDeletePdf(fileId);
  try {
    await fetch(`/api/pdfs/${week}?id=${encodeURIComponent(fileId)}`, {
      method: 'DELETE',
    });
  } catch {
    // ignore
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
