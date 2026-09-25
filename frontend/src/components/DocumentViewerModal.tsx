import React, { useEffect, useState } from 'react';
import type { OriginalDocument } from '../types';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: OriginalDocument[];
  initialDocumentId?: string;
  category: 'syllabus' | 'pyq';
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  documents,
  initialDocumentId,
  category,
}) => {
  const categoryDocs = documents.filter((d) => d.type === category);
  const [selectedDocId, setSelectedDocId] = useState<string>(initialDocumentId || categoryDocs[0]?.id || '');
  const [activeViewTab, setActiveViewTab] = useState<'sheet' | 'embed'>('embed');

  useEffect(() => {
    if (initialDocumentId) {
      setSelectedDocId(initialDocumentId);
    } else if (categoryDocs.length > 0) {
      setSelectedDocId(categoryDocs[0].id);
    }
  }, [initialDocumentId, isOpen]);

  if (!isOpen) return null;

  const currentDoc =
    categoryDocs.find((d) => d.id === selectedDocId) ||
    categoryDocs.find((d) => d.id === initialDocumentId) ||
    categoryDocs[0];

  const handleDownload = (doc: OriginalDocument) => {
    if (doc.file_url.startsWith('blob:') || doc.file_url.startsWith('http')) {
      const a = document.createElement('a');
      a.href = doc.file_url;
      a.download = doc.file_name;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Create text blob download if mock or text content
      const blob = new Blob([doc.content_preview || ''], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name || `${doc.title}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[850px] bg-[#0c101d] border border-white/15 rounded-2xl shadow-2xl shadow-indigo-950/70 flex flex-col overflow-hidden text-slate-100 animate-scale-in">
        {/* Top Gradient Banner */}
        <div className="h-1.5 w-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#0f1424]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-md">
              <span className="material-symbols-outlined text-[22px]">
                {category === 'syllabus' ? 'menu_book' : 'quiz'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {category === 'syllabus'
                    ? 'Original Syllabus & Regulations'
                    : 'Original Examination Question Papers'}
                </h3>
                <span className="badge badge-indigo text-[10px]">
                  {categoryDocs.length} {categoryDocs.length === 1 ? 'File' : 'Files'} Available
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Inspect authentic examination formats, full university guidelines &amp; modular blueprints
              </p>
            </div>
          </div>

          {/* Right: Controls & Actions */}
          <div className="flex items-center gap-2 self-end md:self-center">
            {/* Document Selector Dropdown if multiple */}
            {categoryDocs.length > 1 && (
              <select
                value={currentDoc?.id}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="bg-[#080b13] border border-white/15 rounded-lg text-xs py-1.5 px-3 text-slate-200 focus:outline-none focus:border-indigo-400 max-w-[200px] sm:max-w-xs truncate font-medium cursor-pointer"
              >
                {categoryDocs.map((doc) => (
                  <option key={doc.id} value={doc.id} className="bg-[#0c101d]">
                    {doc.is_official ? '🏛️ ' : '📁 '} {doc.title}
                  </option>
                ))}
              </select>
            )}

            {currentDoc && (
              <>
                <button
                  type="button"
                  onClick={() => handleDownload(currentDoc)}
                  className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer hover:bg-white/10"
                  title="Download File"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span className="hidden sm:inline">Download</span>
                </button>
                <a
                  href={currentDoc.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 text-indigo-300 border-indigo-500/40 hover:text-white"
                  title="Open in new browser tab"
                >
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  <span className="hidden sm:inline">Open</span>
                </a>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Document Meta Ribbon */}
        {currentDoc && (
          <div className="px-5 py-2.5 bg-[#090d18] border-b border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded-full font-semibold text-[10px] uppercase tracking-wider ${
                  currentDoc.is_official
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {currentDoc.is_official ? 'Verified University Document' : 'Student Uploaded File'}
              </span>
              {currentDoc.semester && (
                <span className="badge badge-indigo text-[10px]">Sem {currentDoc.semester}</span>
              )}
              {currentDoc.exam_year && (
                <span className="badge badge-cyan text-[10px]">Year {currentDoc.exam_year}</span>
              )}
              {currentDoc.subject && (
                <span className="text-slate-300 font-medium">{currentDoc.subject}</span>
              )}
            </div>

            {/* View Switcher Tabs */}
            <div className="flex items-center gap-1 bg-[#0c101d] p-1 rounded-lg border border-white/10">
              <button
                type="button"
                onClick={() => setActiveViewTab('sheet')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  activeViewTab === 'sheet'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Document Sheet &amp; Text
              </button>
              <button
                type="button"
                onClick={() => setActiveViewTab('embed')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  activeViewTab === 'embed'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Embedded PDF / Preview
              </button>
            </div>
          </div>
        )}

        {/* Modal Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#080b13]">
          {!currentDoc ? (
            <div className="h-full flex items-center justify-center text-center text-slate-400">
              <div>
                <span className="material-symbols-outlined text-[48px] text-slate-600 mb-2 block">
                  find_in_page
                </span>
                <p>No document selected</p>
              </div>
            </div>
          ) : activeViewTab === 'embed' ? (
            <div className="h-full min-h-[500px] flex flex-col rounded-xl overflow-hidden border border-white/10 bg-[#0c101d]">
              <div className="p-3 bg-[#0f1424] border-b border-white/10 flex items-center justify-between text-xs text-slate-300">
                <span className="font-mono truncate">{currentDoc.file_name}</span>
                <a
                  href={currentDoc.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:underline flex items-center gap-1"
                >
                  Direct PDF Link <span className="material-symbols-outlined text-[14px]">launch</span>
                </a>
              </div>
              <iframe
                src={`${currentDoc.file_url}#toolbar=1&navpanes=0`}
                title={currentDoc.title}
                className="w-full flex-1 border-0 bg-slate-900"
              />
            </div>
          ) : (
            /* Document Sheet View */
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="p-6 sm:p-8 bg-[#0e1424] border border-white/10 rounded-2xl shadow-xl text-left font-mono text-sm leading-relaxed text-slate-200 whitespace-pre-wrap selection:bg-indigo-500 selection:text-white">
                {/* Official Exam/Curriculum Header Watermark */}
                <div className="pb-4 mb-4 border-b border-white/10 flex items-center justify-between text-xs font-sans text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-400 text-[18px]">
                      verified_user
                    </span>
                    <span className="font-semibold text-slate-200">
                      {currentDoc.is_official
                        ? 'Official Autonomous Board Examination & Curriculum Archive'
                        : 'Uploaded Student Reference Document'}
                    </span>
                  </div>
                  <span>Size: {currentDoc.file_size || '1.2 MB'}</span>
                </div>

                {currentDoc.content_preview ||
                  'No formatted text preview available for this document. Switch to Embedded PDF tab or click Open in New Tab to view the binary file.'}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#0f1424] border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono">
            {currentDoc?.extracted_count ? `${currentDoc.extracted_count} items extracted & mapped` : 'Active Document'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-semibold cursor-pointer"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
