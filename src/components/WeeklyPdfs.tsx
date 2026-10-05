import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Upload,
  Eye,
  Download,
  Trash2,
  X,
  Plus,
} from 'lucide-react';
import {
  WeeklyPdf,
  fetchWeeklyPdfs,
  uploadWeeklyPdf,
  removeWeeklyPdf,
  formatFileSize,
} from '../lib/pdfStorage';

export const WeeklyPdfs: React.FC = () => {
  const [pdfs, setPdfs] = useState<Record<number, WeeklyPdf>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [activeViewWeek, setActiveViewWeek] = useState<number | null>(null);
  const [uploadingWeek, setUploadingWeek] = useState<number | null>(null);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  useEffect(() => {
    let isMounted = true;
    fetchWeeklyPdfs()
      .then((data) => {
        if (isMounted) {
          setPdfs(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleFileSelect = async (week: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingWeek(week);
    try {
      const savedPdf = await uploadWeeklyPdf(week, file);
      setPdfs((prev) => ({
        ...prev,
        [week]: savedPdf,
      }));
    } catch (err) {
      console.error('Failed to upload PDF:', err);
    } finally {
      setUploadingWeek(null);
      if (fileInputRefs.current[week]) {
        fileInputRefs.current[week]!.value = '';
      }
    }
  };

  const handleDelete = async (week: number) => {
    await removeWeeklyPdf(week);
    setPdfs((prev) => {
      const updated = { ...prev };
      delete updated[week];
      return updated;
    });
    if (activeViewWeek === week) {
      setActiveViewWeek(null);
    }
  };

  const getViewerUrl = (week: number): string => {
    const pdf = pdfs[week];
    if (pdf?.url) return pdf.url;
    return `/pdfs/week-${week}.pdf`;
  };

  const handleDownload = (week: number) => {
    const pdf = pdfs[week];
    if (!pdf) return;

    const link = document.createElement('a');
    link.href = pdf.url || `/pdfs/week-${week}.pdf`;
    link.download = pdf.fileName || `Week-${week}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const weeks = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Weekly PDFs
        </h1>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500 text-sm">
          Loading PDFs...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {weeks.map((week) => {
            const pdf = pdfs[week];
            const isUploading = uploadingWeek === week;

            return (
              <div
                key={week}
                className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs transition-shadow hover:shadow-sm"
              >
                {/* Week Header */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-slate-900 text-base">
                      Week {week}
                    </span>
                    {pdf && (
                      <span className="text-xs text-slate-400">
                        {formatFileSize(pdf.fileSize)}
                      </span>
                    )}
                  </div>

                  {/* Hidden File Input */}
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    ref={(el) => {
                      fileInputRefs.current[week] = el;
                    }}
                    className="hidden"
                    onChange={(e) => handleFileSelect(week, e)}
                  />

                  {/* PDF Details or Empty State */}
                  {pdf ? (
                    <div className="flex items-center space-x-3 p-3 bg-slate-50 border border-slate-100 rounded-xl mb-4">
                      <FileText className="w-8 h-8 text-rose-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 truncate" title={pdf.fileName}>
                          {pdf.fileName}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl mb-4 text-center">
                      <p className="text-xs text-slate-500">
                        {isUploading ? 'Uploading...' : 'No PDF added'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
                  {pdf ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setActiveViewWeek(week)}
                        className="flex-1 inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownload(week)}
                        className="flex-1 inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[week]?.click()}
                        title="Replace PDF"
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(week)}
                        title="Delete PDF"
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => fileInputRefs.current[week]?.click()}
                      className="w-full inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isUploading ? 'Adding...' : 'Add PDF'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* In-Website PDF Viewer Modal */}
      {activeViewWeek !== null && pdfs[activeViewWeek] && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/80 backdrop-blur-xs">
          {/* Viewer Toolbar */}
          <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-slate-900 truncate">
                  Week {activeViewWeek} — {pdfs[activeViewWeek].fileName}
                </h2>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handleDownload(activeViewWeek)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveViewWeek(null)}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Embedded Viewer */}
          <div className="flex-1 bg-slate-200 p-2 sm:p-4 flex flex-col">
            <object
              data={getViewerUrl(activeViewWeek)}
              type="application/pdf"
              className="w-full flex-1 rounded-xl bg-white border border-slate-300 shadow-sm"
            >
              <iframe
                src={getViewerUrl(activeViewWeek)}
                className="w-full h-full rounded-xl bg-white border-0"
                title={`Week ${activeViewWeek} PDF`}
              >
                <div className="p-8 text-center bg-white rounded-xl h-full flex flex-col items-center justify-center">
                  <p className="text-slate-700 font-medium mb-3">
                    Unable to display PDF preview in this browser view.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleDownload(activeViewWeek)}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </iframe>
            </object>
          </div>
        </div>
      )}
    </div>
  );
};
