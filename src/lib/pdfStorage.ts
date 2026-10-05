export interface WeeklyPdf {
  week: number;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  dataUrl?: string;
}

const DB_NAME = 'NPTEL_PDF_STORAGE';
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
        db.createObjectStore(STORE_NAME, { keyPath: 'week' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGetPdfs(): Promise<Record<number, WeeklyPdf>> {
  try {
    const db = await openPdfDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const result: Record<number, WeeklyPdf> = {};
        if (Array.isArray(req.result)) {
          req.result.forEach((item) => {
            if (item && item.week) {
              result[item.week] = item;
            }
          });
        }
        resolve(result);
      };
      req.onerror = () => resolve({});
    });
  } catch {
    return {};
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

async function idbDeletePdf(week: number): Promise<void> {
  try {
    const db = await openPdfDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(week);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // ignore
  }
}

export async function fetchWeeklyPdfs(): Promise<Record<number, WeeklyPdf>> {
  // Try server first
  try {
    const res = await fetch('/api/pdfs');
    if (res.ok) {
      const serverData = await res.json();
      const result: Record<number, WeeklyPdf> = {};
      for (let w = 1; w <= 12; w++) {
        if (serverData[w]) {
          result[w] = {
            week: w,
            fileName: serverData[w].fileName || `Week-${w}.pdf`,
            fileSize: serverData[w].fileSize || 0,
            uploadedAt: serverData[w].uploadedAt || new Date().toISOString(),
          };
        }
      }
      return result;
    }
  } catch {
    // fallback to IndexedDB
  }

  return await idbGetPdfs();
}

export async function uploadWeeklyPdf(week: number, file: File): Promise<WeeklyPdf> {
  // Read file as base64 Data URL
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const pdfRecord: WeeklyPdf = {
    week,
    fileName: file.name,
    fileSize: file.size,
    uploadedAt: new Date().toISOString(),
    dataUrl: base64Data,
  };

  // Save to IndexedDB
  await idbSavePdf(pdfRecord);

  // Send to server
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
        return {
          ...pdfRecord,
          ...data.pdf,
        };
      }
    }
  } catch (err) {
    console.warn('Server upload error, using local fallback:', err);
  }

  return pdfRecord;
}

export async function removeWeeklyPdf(week: number): Promise<void> {
  await idbDeletePdf(week);
  try {
    await fetch(`/api/pdfs/${week}`, { method: 'DELETE' });
  } catch {
    // ignore
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
