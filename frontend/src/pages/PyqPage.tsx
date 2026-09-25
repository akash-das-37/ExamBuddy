import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { OriginalDocument, PYQQuestion, Student } from '../types';
import { INITIAL_DOCUMENTS } from '../data/documentsData';
import { UploadPyqModal } from '../components/UploadPyqModal';
import { DocumentViewerModal } from '../components/DocumentViewerModal';

interface PyqPageProps {
  student: Student;
}

export const PyqPage: React.FC<PyqPageProps> = ({ student }) => {
  const [pyqList, setPyqList] = useState<PYQQuestion[]>([]);
  const [documents, setDocuments] = useState<OriginalDocument[]>(() => {
    try {
      const stored = localStorage.getItem('exambuddy_uploaded_docs');
      if (stored) {
        const parsed = JSON.parse(stored);
        return [...parsed, ...INITIAL_DOCUMENTS];
      }
    } catch {
      // ignore
    }
    return INITIAL_DOCUMENTS;
  });

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);
  const [activeViewerDocId, setActiveViewerDocId] = useState<string | undefined>(undefined);
  const [notification, setNotification] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getPYQs(student.college_id);
      let combined = [...data];
      try {
        const stored = localStorage.getItem('exambuddy_uploaded_pyqs');
        if (stored) {
          const parsed: PYQQuestion[] = JSON.parse(stored);
          combined = [...parsed, ...combined];
        }
      } catch {
        // ignore
      }
      setPyqList(combined);
    } catch {
      // Fallback empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUploadSuccess = (newQuestions: PYQQuestion[], newDoc: OriginalDocument) => {
    setPyqList((prev) => [...newQuestions, ...prev]);
    setDocuments((prev) => [newDoc, ...prev]);
    setNotification(`Successfully added ${newQuestions.length} questions from "${newDoc.file_name}"!`);
    setTimeout(() => setNotification(null), 5000);
  };

  const years = Array.from(new Set(pyqList.map((q) => q.exam_year).filter(Boolean))).sort().reverse();
  const subjects = Array.from(new Set(pyqList.map((q) => q.subject).filter(Boolean)));

  const filteredPyqs = pyqList.filter((q) => {
    const matchesYear = selectedYear === 'all' || q.exam_year === selectedYear;
    const matchesSubject = selectedSubject === 'all' || q.subject === selectedSubject;
    const matchesSearch =
      q.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.question_text.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesYear && matchesSubject && matchesSearch;
  });

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto">
      {/* Notification Toast if present */}
      {notification && (
        <div className="p-3.5 rounded-xl bg-cyan-950/90 border border-cyan-500/40 text-cyan-200 text-xs flex items-center justify-between animate-fade-in shadow-lg">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">task_alt</span>
            <span className="font-semibold">{notification}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-cyan-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="card-elevated p-6 sm:p-8 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge badge-cyan">Question Bank Archive</span>
              <span className="text-xs font-mono text-slate-400">
                {student.course} • Sem {student.semester}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Previous Years Questions (PYQs)
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              Exam papers with marks weightage, concept matching, and direct access to original question papers.
            </p>
          </div>

          {/* Action Buttons: View Original Papers & Upload Paper */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
            <button
              type="button"
              onClick={() => {
                setActiveViewerDocId('doc-pyq-official-1');
                setIsViewerModalOpen(true);
              }}
              className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 text-cyan-300 border-cyan-500/40 hover:text-white cursor-pointer shadow-sm"
              title="View original examination question papers & answer keys"
            >
              <span className="material-symbols-outlined text-[17px]">quiz</span>
              <span>View Original Question Papers</span>
            </button>

            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="btn-outline text-xs py-2 px-3.5 flex items-center gap-1.5 cursor-pointer hover:bg-white/10"
              title="Manually upload question paper file or paste exam questions"
            >
              <span className="material-symbols-outlined text-[17px]">post_add</span>
              <span>Upload Question Paper</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {subjects.length > 0 && (
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="form-input text-xs py-1.5 px-3 min-w-[140px] cursor-pointer font-medium"
              >
                <option value="all">All Subjects ({subjects.length})</option>
                {subjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            )}

            {years.length > 0 && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="form-input text-xs py-1.5 px-3 min-w-[110px] cursor-pointer font-medium"
              >
                <option value="all">All Years</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    Year {y}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="w-full sm:w-64 relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search past questions..."
              className="form-input pl-9 py-1.5 text-xs w-full"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400 font-mono">Loading previous years question bank...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPyqs.length === 0 ? (
            <div className="card-base p-16 text-center text-slate-400 space-y-3">
              <span className="material-symbols-outlined text-slate-500 text-[40px] mb-2 block">
                quiz
              </span>
              <p className="text-sm">No previous year questions match the active filter.</p>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="btn-primary py-2 px-4 text-xs font-semibold inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-600/25"
              >
                <span className="material-symbols-outlined text-[16px]">upload_file</span>
                Upload Your Question Paper
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {filteredPyqs.map((q) => (
                <div
                  key={q.id}
                  className="card-base p-5 space-y-3 text-left hover:border-cyan-500/40 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="badge badge-indigo">{q.subject}</span>
                      <span className="badge badge-emerald">Year: {q.exam_year}</span>
                      {q.marks && <span className="badge badge-amber">{q.marks} Marks</span>}
                    </div>

                    <div className="flex items-center gap-3">
                      {q.match_confidence && (
                        <span className="text-[11px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">psychology</span>
                          Topic Match: {Math.round(q.match_confidence * 100)}%
                        </span>
                      )}

                      {/* View Original Paper Link */}
                      <button
                        type="button"
                        onClick={() => {
                          const targetDoc =
                            documents.find((d) => d.id === q.source_document_id) ||
                            documents.find(
                              (d) =>
                                d.type === 'pyq' &&
                                (d.exam_year === q.exam_year || d.subject === q.subject)
                            ) ||
                            documents.find((d) => d.type === 'pyq');
                          setActiveViewerDocId(targetDoc?.id || 'doc-pyq-official-1');
                          setIsViewerModalOpen(true);
                        }}
                        className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer hover:underline"
                        title="View original exam paper document"
                      >
                        <span className="material-symbols-outlined text-[14px]">article</span>
                        View Original Paper
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-slate-100 font-serif leading-relaxed pt-1 border-t border-white/5">
                    &quot;{q.question_text}&quot;
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Manual Upload Question Paper Modal */}
      <UploadPyqModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        student={student}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Original Question Paper Viewer Modal */}
      <DocumentViewerModal
        isOpen={isViewerModalOpen}
        onClose={() => setIsViewerModalOpen(false)}
        documents={documents}
        initialDocumentId={activeViewerDocId}
        category="pyq"
      />
    </div>
  );
};
