import React, { useState, useEffect } from 'react';
import type { OriginalDocument } from '../types';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: OriginalDocument[];
  initialDocumentId?: string;
  category?: 'syllabus' | 'pyq' | 'notice' | string;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  documents,
  initialDocumentId,
  category = 'syllabus',
}) => {
  const filteredDocs = documents.filter((d) => !category || d.type === category);
  const displayDocs = filteredDocs.length > 0 ? filteredDocs : documents;

  const [activeDocId, setActiveDocId] = useState<string>(
    initialDocumentId || (displayDocs[0]?.id ?? '')
  );

  useEffect(() => {
    if (initialDocumentId) {
      setActiveDocId(initialDocumentId);
    } else if (displayDocs[0]) {
      setActiveDocId(displayDocs[0].id);
    }
  }, [initialDocumentId, isOpen]);

  if (!isOpen) return null;

  const activeDoc = displayDocs.find((d) => d.id === activeDocId) || displayDocs[0];
  const isPdf = activeDoc?.file_url?.toLowerCase().endsWith('.pdf') ||
    activeDoc?.file_name?.toLowerCase().endsWith('.pdf') ||
    (activeDoc?.file_url && activeDoc.file_url.startsWith('http') && !activeDoc.file_url.startsWith('#'));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-5xl h-[90vh] bg-[#090d19] border border-white/15 rounded-2xl shadow-2xl shadow-indigo-950/70 overflow-hidden flex flex-col text-slate-100 animate-scale-in">
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400" />

        {/* Modal Top Bar */}
        <div className="px-6 py-3.5 border-b border-white/10 flex items-center justify-between gap-4 bg-slate-950/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
              <span className="material-symbols-outlined text-[20px]">
                {isPdf ? 'picture_as_pdf' : 'description'}
              </span>
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">
                {activeDoc?.title || activeDoc?.file_name || 'Document Viewer'}
              </h3>
              <p className="text-xs text-slate-400 font-mono truncate">
                {activeDoc?.subject && `${activeDoc.subject} • `}
                {activeDoc?.semester && `Semester ${activeDoc.semester} • `}
                {activeDoc?.file_size || 'Official Document'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeDoc?.file_url && activeDoc.file_url !== '#' && (
              <a
                href={activeDoc.file_url}
                target="_blank"
                rel="noreferrer"
                className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5 hover:text-white"
                title="Open in new tab"
              >
                <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                <span className="hidden sm:inline">Open in New Tab</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Left doc list (if multiple) */}
          {displayDocs.length > 1 && (
            <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/10 bg-slate-950/40 overflow-y-auto p-3 space-y-1.5 shrink-0 max-h-40 md:max-h-none">
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider px-2 py-1">
                Available Documents ({displayDocs.length})
              </p>
              {displayDocs.map((doc) => {
                const isSelected = doc.id === activeDoc?.id;
                return (
                  <button
                    key={doc.id}
                    onClick={() => setActiveDocId(doc.id)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-start gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/25 border border-indigo-500/40 text-white font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px] text-indigo-400 shrink-0 mt-0.5">
                      {doc.type === 'pyq' ? 'quiz' : 'menu_book'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs">{doc.title || doc.file_name}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {doc.subject || doc.semester ? `${doc.subject || ''} Sem ${doc.semester || ''}` : doc.file_size}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Main Document Content */}
          <div className="flex-1 bg-[#060913] min-h-0 flex flex-col">
            {isPdf && activeDoc?.file_url && activeDoc.file_url !== '#' ? (
              <iframe
                src={`${activeDoc.file_url}#toolbar=1&navpanes=0`}
                title={activeDoc.title}
                className="w-full h-full border-none"
              />
            ) : (
              <div className="flex-1 p-6 overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap selection:bg-indigo-600">
                {activeDoc?.content_preview ||
                  `Document: ${activeDoc?.title || activeDoc?.file_name}\nType: ${activeDoc?.type}\nSubject: ${activeDoc?.subject}\n\nContent preview not available for this document format.`}
              </div>
            )}
          </div>
        </div>

        {/* Footer status */}
        <div className="px-6 py-2.5 bg-slate-950 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>{activeDoc?.file_name || 'Document'}</span>
          <span>
            {activeDoc?.uploaded_at
              ? `Uploaded on ${new Date(activeDoc.uploaded_at).toLocaleDateString()}`
              : 'Official College Regulation'}
          </span>
        </div>
      </div>
    </div>
  );
};
