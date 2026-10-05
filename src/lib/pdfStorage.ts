export interface WeeklyPdf {
  week: number;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  url?: string;
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

/**
 * Fetches PDFs from the repository (API endpoint, static repo files, or file detection)
 * Works across any browser, device, or deployment.
 */
export async function fetchWeeklyPdfs(): Promise<Record<number, WeeklyPdf>> {
  const result: Record<number, WeeklyPdf> = {};

  // 1. Try server API endpoint
  try {
    const res = await fetch('/api/pdfs');
    if (res.ok) {
      const serverData = await res.json();
      if (typeof serverData === 'object' && serverData !== null) {
        for (let w = 1; w <= 12; w++) {
          if (serverData[w]) {
            result[w] = {
              week: w,
              fileName: serverData[w].fileName || `week-${w}.pdf`,
              fileSize: serverData[w].fileSize || 0,
              uploadedAt: serverData[w].uploadedAt || new Date().toISOString(),
              url: serverData[w].url || `/pdfs/week-${w}.pdf`,
            };
          }
        }
      }
    }
  } catch {
    // Server API not reachable
  }

  // 2. Try repository static metadata file (/pdfs/metadata.json)
  try {
    const staticRes = await fetch('/pdfs/metadata.json');
    if (staticRes.ok) {
      const staticData = await staticRes.json();
      if (typeof staticData === 'object' && staticData !== null) {
        for (let w = 1; w <= 12; w++) {
          if (staticData[w] && !result[w]) {
            result[w] = {
              week: w,
              fileName: staticData[w].fileName || `week-${w}.pdf`,
              fileSize: staticData[w].fileSize || 0,
              uploadedAt: staticData[w].uploadedAt || new Date().toISOString(),
              url: `/pdfs/week-${w}.pdf`,
            };
          }
        }
      }
    }
  } catch {
    // static file not reachable
  }

  // 3. For any remaining weeks (1..12), check directly if /pdfs/week-X.pdf exists in the repo
  const probePromises: Promise<void>[] = [];
  for (let w = 1; w <= 12; w++) {
    if (!result[w]) {
      probePromises.push(
        (async () => {
          try {
            const probeRes = await fetch(`/pdfs/week-${w}.pdf`, { method: 'HEAD' });
            if (probeRes.ok) {
              const contentType = probeRes.headers.get('content-type') || '';
              if (!contentType.includes('text/html')) {
                const contentLength = parseInt(probeRes.headers.get('content-length') || '0', 10);
                result[w] = {
                  week: w,
                  fileName: `week-${w}.pdf`,
                  fileSize: contentLength || 0,
                  uploadedAt: new Date().toISOString(),
                  url: `/pdfs/week-${w}.pdf`,
                };
              }
            }
          } catch {
            // file not present in repo
          }
        })()
      );
    }
  }
  await Promise.all(probePromises);

  // 4. Merge any local IndexedDB cache if empty on repo
  const localPdfs = await idbGetPdfs();
  Object.keys(localPdfs).forEach((wKey) => {
    const w = parseInt(wKey, 10);
    if (!result[w] && localPdfs[w]) {
      result[w] = localPdfs[w];
    }
  });

  return result;
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
