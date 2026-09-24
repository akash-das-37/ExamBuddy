import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Student, SyllabusEntry } from '../types';

interface SyllabusPageProps {
  student: Student;
}

export const SyllabusPage: React.FC<SyllabusPageProps> = ({ student }) => {
  const [syllabusList, setSyllabusList] = useState<SyllabusEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string | null>(null);
  const [sourcePdfUrl, setSourcePdfUrl] = useState<string | null>(null);

  // Search parameters
  const [branch, setBranch] = useState(student.branch || student.course || 'CSE');
  const [semester, setSemester] = useState(String(student.semester || '3'));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [viewFilter, setViewFilter] = useState<'all' | 'theory' | 'practical' | 'modules'>('all');

  const loadData = async (targetCourse = branch, targetSem = semester) => {
    setLoading(true);
    try {
      const data = await api.getSyllabus(
        student.college_id,
        targetCourse,
        targetSem
      );
      setSyllabusList(data);
    } catch {
      // Fallback empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(branch, semester);
  }, [semester]);

  const handleDiscoverSyllabus = async () => {
    setSearching(true);
    setSearchStatus('Connecting to college portal & searching curriculum blueprints...');
    setSourcePdfUrl(null);
    try {
      setSearchStatus('Finding course regulations & downloading curriculum PDF...');
      const res = await api.searchAndImportSyllabus(
        student.college_id,
        branch,
        semester
      );
      setSourcePdfUrl(res.source_pdf_url);
      setSearchStatus(
        `Discovered & parsed ${res.total_courses_found} courses (${res.total_entries_created} syllabus blueprints & modules) using PyMuPDF!`
      );
      await loadData(branch, semester);
    } catch (err: any) {
      setSearchStatus(`Search failed: ${err.message || 'Could not find syllabus PDF for this course/semester.'}`);
    } finally {
      setSearching(false);
    }
  };

  const subjects = Array.from(new Set(syllabusList.map((item) => item.subject)));

  const blueprints = syllabusList.filter((item) => item.topic_title.includes('Course Blueprint'));
  const theoryBlueprints = blueprints.filter(
    (item) => item.topic_description && item.topic_description.includes('Category: Theory')
  );
  const practicalBlueprints = blueprints.filter(
    (item) =>
      item.topic_description &&
      (item.topic_description.includes('Category: Practical') ||
        item.topic_title.toLowerCase().includes('lab'))
  );
  const modulesList = syllabusList.filter((item) => !item.topic_title.includes('Course Blueprint'));

  const filteredSyllabus = syllabusList.filter((item) => {
    const matchesSubject = selectedSubject === 'all' || item.subject === selectedSubject;
    const matchesSearch =
      item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.topic_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.topic_description &&
        item.topic_description.toLowerCase().includes(searchTerm.toLowerCase()));

    const isBlueprint = item.topic_title.includes('Course Blueprint');
    const isTheory = isBlueprint && item.topic_description?.includes('Category: Theory');
    const isPractical =
      isBlueprint &&
      (item.topic_description?.includes('Category: Practical') ||
        item.topic_title.toLowerCase().includes('lab'));

    let matchesView = true;
    if (viewFilter === 'theory') matchesView = isTheory;
    if (viewFilter === 'practical') matchesView = isPractical;
    if (viewFilter === 'modules') matchesView = !isBlueprint;

    return matchesSubject && matchesSearch && matchesView;
  });

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto">
      {/* Header & Automated Search Bar */}
      <div className="card-elevated p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge badge-indigo">Automated Curriculum Search</span>
              <span className="text-xs font-mono text-slate-400">
                {branch} • Semester {semester}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Curriculum &amp; Syllabus Topics
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              Automated PDF table extraction via PyMuPDF. Extracts all theory subjects, lab courses, and modular topics directly from official university regulations.
            </p>
          </div>

          {/* Quick PDF Link if available */}
          {sourcePdfUrl && (
            <a
              href={sourcePdfUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary text-xs flex items-center gap-1.5 self-start md:self-center text-indigo-300 border-indigo-500/40 hover:text-white"
            >
              <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
              Open Regulation PDF
            </a>
          )}
        </div>

        {/* Discovery & Search Controls Form */}
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/60 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-mono text-slate-400">Branch:</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="e.g. CSE, IT, ECE"
                className="form-input text-xs py-1.5 px-2.5 w-28 uppercase font-bold"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-mono text-slate-400">Semester:</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="form-input text-xs py-1.5 px-2.5 cursor-pointer font-bold"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={String(s)}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleDiscoverSyllabus}
            disabled={searching}
            className="btn-primary py-2 px-4 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/20 disabled:opacity-50"
          >
            {searching ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Searching &amp; Extracting...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">travel_explore</span>
                <span>Auto-Discover from Portal</span>
              </>
            )}
          </button>
        </div>

        {/* Live Search Status Banner */}
        {searchStatus && (
          <div
            className={`p-3.5 rounded-lg text-xs flex items-center justify-between gap-2 transition-all ${
              searchStatus.includes('failed')
                ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                : 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">
                {searchStatus.includes('failed') ? 'error' : 'info'}
              </span>
              <span>{searchStatus}</span>
            </div>
            <button
              onClick={() => setSearchStatus(null)}
              className="text-slate-400 hover:text-white"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* Content Filters & Keyword Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
              <button
                onClick={() => setViewFilter('all')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  viewFilter === 'all'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({syllabusList.length})
              </button>
              <button
                onClick={() => setViewFilter('theory')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  viewFilter === 'theory'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Theory Courses ({theoryBlueprints.length})
              </button>
              <button
                onClick={() => setViewFilter('practical')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  viewFilter === 'practical'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Practical &amp; Labs ({practicalBlueprints.length})
              </button>
              <button
                onClick={() => setViewFilter('modules')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  viewFilter === 'modules'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Modules ({modulesList.length})
              </button>
            </div>

            {subjects.length > 0 && (
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="form-input text-xs py-1.5 px-3 min-w-[150px] cursor-pointer"
              >
                <option value="all">All Subjects ({subjects.length})</option>
                {subjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
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
              placeholder="Search topics, modules..."
              className="form-input pl-9 py-1.5 text-xs w-full"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="text-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400 font-mono">Loading university curriculum database...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSyllabus.length === 0 ? (
            <div className="card-base p-16 text-center text-slate-400 space-y-4">
              <span className="material-symbols-outlined text-indigo-400 text-[48px] mx-auto block animate-pulse">
                manage_search
              </span>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">No syllabus topics found for Semester {semester}</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  Click the button below to automatically search the college portal, download the official regulation PDF, and parse course tables via PyMuPDF.
                </p>
              </div>
              <button
                onClick={handleDiscoverSyllabus}
                disabled={searching}
                className="btn-primary py-2.5 px-6 text-sm font-semibold inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/25"
              >
                <span className="material-symbols-outlined text-[20px]">travel_explore</span>
                <span>Auto-Discover {branch} Sem {semester} Syllabus</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSyllabus.map((item) => {
                const isBlueprint = item.topic_title.includes('Course Blueprint');
                const isTheory = isBlueprint && item.topic_description?.includes('Category: Theory');
                const isPractical =
                  isBlueprint &&
                  (item.topic_description?.includes('Category: Practical') ||
                    item.topic_title.toLowerCase().includes('lab'));

                return (
                  <div
                    key={item.id}
                    className={`card-base p-5 space-y-3 text-left transition-all hover:border-indigo-500/50 ${
                      isBlueprint
                        ? 'border-indigo-500/30 bg-gradient-to-br from-slate-900/90 to-indigo-950/20'
                        : 'hover:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className={`badge ${isBlueprint ? 'badge-indigo' : 'bg-slate-800 text-slate-300'}`}>
                        {item.subject}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isTheory && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            Theory Course
                          </span>
                        )}
                        {isPractical && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Practical / Lab
                          </span>
                        )}
                        <span className="text-[11px] font-mono text-slate-400">
                          Sem {item.semester}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-base font-bold text-white tracking-tight">
                      {item.topic_title}
                    </h4>

                    {item.topic_description && (
                      <p className="text-xs text-slate-300 leading-relaxed font-normal bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
                        {item.topic_description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
