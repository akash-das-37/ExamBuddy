import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { PYQQuestion, Student } from '../types';

interface PyqPageProps {
  student: Student;
}

export const PyqPage: React.FC<PyqPageProps> = ({ student }) => {
  const [pyqList, setPyqList] = useState<PYQQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getPYQs(student.college_id);
      setPyqList(data);
    } catch {
      // Fallback empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
      {/* Header & Controls */}
      <div className="card-elevated p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
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
            Exam papers with marks weightage and algorithmic concept matching.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {subjects.length > 0 && (
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="form-input text-xs sm:text-sm py-2 px-3 min-w-[140px] cursor-pointer"
            >
              <option value="all">All Subjects</option>
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
              className="form-input text-xs sm:text-sm py-2 px-3 min-w-[110px] cursor-pointer"
            >
              <option value="all">All Years</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          )}

          <div className="w-full sm:w-64 relative">
            <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search past questions..."
              className="form-input pl-10 text-xs sm:text-sm"
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
            <div className="card-base p-16 text-center text-slate-400 text-sm">
              <span className="material-symbols-outlined text-slate-500 text-[40px] mb-2 block">
                quiz
              </span>
              No previous year questions found. Click &quot;Crawl Portal&quot; in the header to fetch question papers.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {filteredPyqs.map((q) => (
                <div
                  key={q.id}
                  className="card-base p-5 space-y-2.5 text-left hover:border-cyan-500/40 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="badge badge-indigo">{q.subject}</span>
                      <span className="badge badge-emerald">Year: {q.exam_year}</span>
                      {q.marks && <span className="badge badge-amber">{q.marks} Marks</span>}
                    </div>
                    {q.match_confidence && (
                      <span className="text-[11px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">psychology</span>
                        Topic Match: {Math.round(q.match_confidence * 100)}%
                      </span>
                    )}
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
    </div>
  );
};
