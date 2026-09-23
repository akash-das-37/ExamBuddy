import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { PYQQuestion, Student, SyllabusEntry } from '../types';

interface SyllabusPyqPageProps {
  student: Student;
}

export const SyllabusPyqPage: React.FC<SyllabusPyqPageProps> = ({ student }) => {
  const [activeSubTab, setActiveSubTab] = useState<'syllabus' | 'pyqs'>('syllabus');
  const [syllabusList, setSyllabusList] = useState<SyllabusEntry[]>([]);
  const [pyqList, setPyqList] = useState<PYQQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [sData, pData] = await Promise.all([
        api.getSyllabus(student.college_id, student.course, String(student.semester)),
        api.getPYQs(student.college_id),
      ]);
      setSyllabusList(sData);
      setPyqList(pData);
    } catch {
      // Fallback empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredSyllabus = syllabusList.filter(
    (item) =>
      item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.topic_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.topic_description && item.topic_description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredPyqs = pyqList.filter(
    (q) =>
      q.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.question_text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto">
      {/* Header & Search */}
      <div className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-indigo">Curriculum Intelligence</span>
            <span className="text-xs font-mono text-slate-400">
              {student.course} • Sem {student.semester}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Syllabus &amp; Exam Question Bank
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            Extracted from university portal course blueprints and previous years question papers.
          </p>
        </div>

        {/* Search Input */}
        <div className="w-full md:w-72 relative">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-500 text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search topics, questions, marks..."
            className="form-input pl-9 text-xs sm:text-sm"
          />
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex bg-[#070a13] p-1 rounded-xl w-fit border border-slate-800">
        <button
          onClick={() => setActiveSubTab('syllabus')}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
            activeSubTab === 'syllabus'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[17px]">menu_book</span>
          Syllabus Topics ({filteredSyllabus.length})
        </button>
        <button
          onClick={() => setActiveSubTab('pyqs')}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
            activeSubTab === 'pyqs'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[17px]">quiz</span>
          PYQ Question Papers ({filteredPyqs.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400 font-mono">Loading university curriculum database...</p>
        </div>
      ) : activeSubTab === 'syllabus' ? (
        /* Syllabus List */
        <div className="space-y-3">
          {filteredSyllabus.length === 0 ? (
            <div className="glass-card p-12 text-center text-slate-400 text-sm">
              No syllabus topics indexed yet. Click &quot;Crawl Portal&quot; in the navbar to scrape syllabus PDFs.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSyllabus.map((item) => (
                <div key={item.id} className="glass-card p-5 space-y-2 text-left">
                  <div className="flex items-center justify-between">
                    <span className="badge badge-indigo">{item.subject}</span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Sem {item.semester}
                    </span>
                  </div>
                  <h4 className="text-base font-semibold text-white">
                    {item.topic_title}
                  </h4>
                  {item.topic_description && (
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {item.topic_description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* PYQs List */
        <div className="space-y-3">
          {filteredPyqs.length === 0 ? (
            <div className="glass-card p-12 text-center text-slate-400 text-sm">
              No PYQ questions indexed yet. Click &quot;Crawl Portal&quot; to fetch question papers.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredPyqs.map((q) => (
                <div key={q.id} className="glass-card p-4 space-y-2 text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="badge badge-indigo">{q.subject}</span>
                      <span className="badge badge-emerald">Year: {q.exam_year}</span>
                      {q.marks && <span className="badge badge-amber">{q.marks} Marks</span>}
                    </div>
                    {q.match_confidence && (
                      <span className="text-[11px] font-mono text-slate-400">
                        Topic Match: {Math.round(q.match_confidence * 100)}%
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-200 font-serif leading-relaxed">
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
