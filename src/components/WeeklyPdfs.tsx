import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
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
  const [pdfs, setPdfs] = useState<Record<number, WeeklyPdf[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [activeViewPdf, setActiveViewPdf] = useState<WeeklyPdf | null>(null);
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

  const handleFilesSelect = async (week: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingWeek(week);
    try {
      const addedPdfs: WeeklyPdf[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const saved = await uploadWeeklyPdf(week, file);
        addedPdfs.push(saved);
      }
      setPdfs((prev) => ({
        ...prev,
        [week]: [...(prev[week] || []), ...addedPdfs],
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

  const handleDelete = async (week: number, pdfId: string) => {
    await removeWeeklyPdf(week, pdfId);
    setPdfs((prev) => ({
      ...prev,
      [week]: (prev[week] || []).filter((p) => p.id !== pdfId),
    }));
    if (activeViewPdf && activeViewPdf.id === pdfId) {
      setActiveViewPdf(null);
    }
  };

  const handleDownload = (pdf: WeeklyPdf) => {
    const link = document.createElement('a');
    link.href = pdf.url || `/api/pdfs/${pdf.week}?id=${encodeURIComponent(pdf.id)}&download=1`;
    link.download = pdf.fileName || `Week-${pdf.week}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getViewerUrl = (pdf: WeeklyPdf): string => {
    if (pdf.url) return pdf.url;
    return `/api/pdfs/${pdf.week}?id=${encodeURIComponent(pdf.id)}`;
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {weeks.map((week) => {
            const weekPdfs = pdfs[week] || [];
            const isUploading = uploadingWeek === week;

            return (
              <div
                key={week}
                className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs transition-shadow hover:shadow-sm"
              >
                <div>
                  {/* Week Card Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-900 text-base">
                        Week {week}
                      </span>
                      {weekPdfs.length > 0 && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                          {weekPdfs.length} {weekPdfs.length === 1 ? 'PDF' : 'PDFs'}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => fileInputRefs.current[week]?.click()}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                      title="Add PDF"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isUploading ? 'Adding...' : 'Add PDF'}</span>
                    </button>
                  </div>

                  {/* Hidden Multi-file input */}
                  <input
                    type="file"
                    multiple
                    accept="application/pdf,.pdf"
                    ref={(el) => {
                      fileInputRefs.current[week] = el;
                    }}
                    className="hidden"
                    onChange={(e) => handleFilesSelect(week, e)}
                  />

                  {/* List of PDFs for this week */}
                  {weekPdfs.length > 0 ? (
                    <div className="space-y-2 mb-2 max-h-72 overflow-y-auto pr-1">
                      {weekPdfs.map((pdf) => (
                        <div
                          key={pdf.id}
                          className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors"
                        >
                          <div className="flex items-center space-x-2.5 min-w-0 flex-1 mr-2">
                            <FileText className="w-5 h-5 text-rose-500 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p
                                className="text-xs font-medium text-slate-800 truncate"
                                title={pdf.fileName}
                              >
                                {pdf.fileName}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {formatFileSize(pdf.fileSize)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setActiveViewPdf(pdf)}
                              className="px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors inline-flex items-center space-x-1"
                              title="View PDF"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">View</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDownload(pdf)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
                              title="Download PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(week, pdf.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                              title="Delete PDF"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
                      <p className="text-xs text-slate-500">
                        {isUploading ? 'Uploading...' : 'No PDFs added yet'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* In-Website PDF Viewer Modal */}
      {activeViewPdf !== null && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/80 backdrop-blur-xs">
          {/* Viewer Toolbar */}
          <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-slate-900 truncate">
                  Week {activeViewPdf.week} — {activeViewPdf.fileName}
                </h2>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handleDownload(activeViewPdf)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveViewPdf(null)}
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
              data={getViewerUrl(activeViewPdf)}
              type="application/pdf"
              className="w-full flex-1 rounded-xl bg-white border border-slate-300 shadow-sm"
            >
              <iframe
                src={getViewerUrl(activeViewPdf)}
                className="w-full h-full rounded-xl bg-white border-0"
                title={`Week ${activeViewPdf.week} PDF`}
              >
                <div className="p-8 text-center bg-white rounded-xl h-full flex flex-col items-center justify-center">
                  <p className="text-slate-700 font-medium mb-3">
                    Unable to display PDF preview directly in this browser view.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleDownload(activeViewPdf)}
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
