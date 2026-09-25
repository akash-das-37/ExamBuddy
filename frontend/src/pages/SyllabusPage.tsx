import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { OriginalDocument, Student, SyllabusEntry } from '../types';
import { getDocumentsForStudent } from '../data/documentsData';
import { UploadSyllabusModal } from '../components/UploadSyllabusModal';
import { DocumentViewerModal } from '../components/DocumentViewerModal';
import { aiCollegeScraper, deriveCollegeNameFromUrl, cleanCollegeUrl } from '../services/aiCollegeScraper';

interface SyllabusPageProps {
  student: Student;
}

export const SyllabusPage: React.FC<SyllabusPageProps> = ({ student }) => {
  const [syllabusList, setSyllabusList] = useState<SyllabusEntry[]>([]);
  const [documents, setDocuments] = useState<OriginalDocument[]>(() =>
    getDocumentsForStudent(student)
  );

  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string | null>(null);

  // Priority: student.college_url > localStorage > empty
  const initialCollegeUrl = student.college_url || localStorage.getItem('exambuddy_college_url') || '';
  const initialCollegeName = deriveCollegeNameFromUrl(initialCollegeUrl, student.college_name);

  // AI College Web Scraper state
  const [collegeUrlInput, setCollegeUrlInput] = useState<string>(initialCollegeUrl);
  const [activeCollegeName, setActiveCollegeName] = useState<string>(initialCollegeName);
  const [isAiScraping, setIsAiScraping] = useState(false);
  const [aiScrapeProgress, setAiScrapeProgress] = useState<string | null>(null);

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);
  const [activeViewerDocId, setActiveViewerDocId] = useState<string | undefined>(undefined);

  // Search parameters
  const [branch, setBranch] = useState(student.branch || student.course || 'CSE');
  const [semester, setSemester] = useState(String(student.semester || '3'));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [viewFilter, setViewFilter] = useState<'all' | 'theory' | 'practical' | 'modules'>('all');

  // Sync state whenever student updates (e.g. user changes college in profile modal or auth resolves)
  useEffect(() => {
    const curUrl = student.college_url || localStorage.getItem('exambuddy_college_url') || '';
    if (curUrl) {
      setCollegeUrlInput(curUrl);
      const derived = deriveCollegeNameFromUrl(curUrl, student.college_name);
      setActiveCollegeName(derived);
      localStorage.setItem('exambuddy_college_url', curUrl);
      localStorage.setItem('exambuddy_college_name', derived);
    }
    setDocuments(getDocumentsForStudent(student));
  }, [student.college_url, student.college_name]);

  const loadData = async (targetCourse = branch, targetSem = semester) => {
    setLoading(true);
    try {
      const data = await api.getSyllabus(
        student.college_id,
        targetCourse,
        targetSem
      );

      // Merge with any uploaded syllabus entries from localStorage
      let combined = [...data];
      try {
        const storedSyllabus = localStorage.getItem('exambuddy_uploaded_syllabus');
        if (storedSyllabus) {
          const parsed: SyllabusEntry[] = JSON.parse(storedSyllabus);
          const matching = parsed.filter(
            (p) => !p.semester || String(p.semester) === String(targetSem)
          );
          combined = [...matching, ...combined];
        }
      } catch {
        // ignore
      }
      setSyllabusList(combined);
    } catch {
      // Fallback empty
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerAiScrape = async () => {
    const rawTarget = collegeUrlInput.trim() || student.college_url || '';
    if (!rawTarget) {
      setSearchStatus('Please enter your college portal URL above (e.g. gnit.ac.in).');
      return;
    }
    const targetUrl = cleanCollegeUrl(rawTarget);
    const targetCollegeName = deriveCollegeNameFromUrl(targetUrl);
    setActiveCollegeName(targetCollegeName);
    setIsAiScraping(true);
    setAiScrapeProgress(`Connecting to ${targetCollegeName} (${targetUrl})...`);
    try {
      const res = await aiCollegeScraper.scrapeAndSyncCollege({
        collegeUrl: targetUrl,
        collegeName: targetCollegeName,
        course: student.course || 'B.Tech',
        branch,
        semester: Number(semester),
        onProgress: (msg) => setAiScrapeProgress(msg),
      });

      setActiveCollegeName(res.college_name);
      setDocuments(res.documents);
      setSyllabusList(res.syllabus_entries);
      setSearchStatus(
        `AI Scraper successfully crawled ${res.college_name}! Synced ${res.syllabus_entries.length} topics and ${res.documents.length} official documents directly to your Supabase database.`
      );
    } catch (err: any) {
      setSearchStatus(`AI Scrape failed: ${err.message || 'Could not scrape portal.'}`);
    } finally {
      setIsAiScraping(false);
      setTimeout(() => setAiScrapeProgress(null), 5000);
    }
  };

  const handleUploadSuccess = (newEntries: SyllabusEntry[], newDoc: OriginalDocument) => {
    setSyllabusList((prev) => [...newEntries, ...prev]);
    setDocuments((prev) => [newDoc, ...prev]);
    setSearchStatus(`Successfully uploaded & imported ${newEntries.length} topics from "${newDoc.file_name}"!`);
  };

  useEffect(() => {
    loadData(branch, semester);
  }, [semester]);

  const handleDiscoverSyllabus = async () => {
    setSearching(true);
    setSearchStatus('Connecting to college portal & searching curriculum blueprints...');
    try {
      setSearchStatus('Finding course regulations & downloading curriculum PDF...');
      const res = await api.searchAndImportSyllabus(
        student.college_id,
        branch,
        semester
      );

      if (res.source_pdf_url) {
        const discoveredDoc: OriginalDocument = {
          id: `doc-discovered-${semester}`,
          title: `Portal Discovered Curriculum: ${branch} Sem ${semester}`,
          type: 'syllabus',
          subject: branch,
          semester,
          file_name: res.source_pdf_url.split('/').pop() || 'Curriculum_Regulation.pdf',
          file_url: res.source_pdf_url,
          file_size: '3.4 MB',
          uploaded_at: new Date().toISOString(),
          is_official: true,
          extracted_count: res.total_entries_created,
        };
        setDocuments((prev) => [discoveredDoc, ...prev.filter((d) => d.id !== discoveredDoc.id)]);
      }

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

  const activeSylDoc =
    documents.find((d) => d.type === 'syllabus' && (d.semester === semester || d.semester?.includes(semester))) ||
    documents.find((d) => d.type === 'syllabus') ||
    documents[0];

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto">
      {/* AI College Web Scraper & Supabase Sync Portal */}
      <div className="card-elevated p-5 sm:p-6 bg-gradient-to-br from-[#0c1021] via-[#0e1429] to-[#12112b] border border-indigo-500/30 rounded-2xl shadow-xl shadow-indigo-950/40 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[12px] text-indigo-400">smart_toy</span>
                AI Agent Web Scraper
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Supabase User DB
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>{activeCollegeName}</span>
            </h3>
            <p className="text-xs text-slate-400">
              Web scrape any university or college portal to extract official syllabus blueprints &amp; sync to Supabase.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {collegeUrlInput ? (
              <a
                href={cleanCollegeUrl(collegeUrlInput)}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono text-indigo-300 hover:text-white flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
              >
                <span className="material-symbols-outlined text-[14px]">public</span>
                <span className="truncate max-w-[200px]">{cleanCollegeUrl(collegeUrlInput).replace(/^https?:\/\//, '')}</span>
                <span className="material-symbols-outlined text-[12px]">open_in_new</span>
              </a>
            ) : null}
          </div>
        </div>

        {/* Live URL Scraper Input & Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-500 text-[18px]">
              link
            </span>
            <input
              type="url"
              value={collegeUrlInput}
              onChange={(e) => {
                const val = e.target.value;
                setCollegeUrlInput(val);
                if (val.trim()) {
                  setActiveCollegeName(deriveCollegeNameFromUrl(val));
                }
              }}
              placeholder="Enter College Portal URL e.g. gnit.ac.in, heritageit.edu, or iem.edu.in"
              style={{ backgroundColor: '#090d19', color: '#ffffff' }}
              className="w-full !bg-[#090d19] !text-white border border-white/20 rounded-xl pl-9.5 pr-4 py-2.5 text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all font-mono"
            />
          </div>

          <button
            type="button"
            onClick={handleTriggerAiScrape}
            disabled={isAiScraping}
            className="btn-primary text-xs py-2 px-4.5 font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30 whitespace-nowrap"
          >
            {isAiScraping ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Crawling Portal...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">travel_explore</span>
                <span>Scrape &amp; Store in Supabase</span>
              </>
            )}
          </button>
        </div>

        {/* Live Progress Feedback */}
        {aiScrapeProgress && (
          <div className="p-3 rounded-xl bg-indigo-950/70 border border-indigo-500/40 text-xs text-indigo-200 flex items-center gap-3 animate-fade-in font-mono">
            <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
            <span>{aiScrapeProgress}</span>
          </div>
        )}
      </div>

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

          {/* Action Buttons: View Original & Upload */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
            <button
              type="button"
              onClick={() => {
                setActiveViewerDocId(activeSylDoc?.id);
                setIsViewerModalOpen(true);
              }}
              className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 text-indigo-300 border-indigo-500/40 hover:text-white cursor-pointer shadow-sm"
              title="View authentic university regulation syllabus PDF"
            >
              <span className="material-symbols-outlined text-[17px]">menu_book</span>
              <span>View Original Regulations</span>
            </button>

            <a
              href={activeSylDoc?.file_url || '/syllabus/B.Tech_CSE_R23_Curriculum_and_Syllabus.pdf'}
              target="_blank"
              rel="noreferrer"
              className="btn-outline text-xs py-2 px-3 flex items-center gap-1.5 text-slate-300 hover:text-white cursor-pointer"
              title={`Open ${activeSylDoc?.title || 'syllabus'} in new browser tab`}
            >
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              <span>Open PDF</span>
            </a>

            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="btn-outline text-xs py-2 px-3.5 flex items-center gap-1.5 cursor-pointer hover:bg-white/10"
              title="Manually upload syllabus document (.pdf, .docx, .txt)"
            >
              <span className="material-symbols-outlined text-[17px]">upload_file</span>
              <span>Upload Syllabus</span>
            </button>
          </div>
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

                    <div className="pt-2 flex items-center justify-between border-t border-white/5">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const targetDoc =
                              documents.find((d) => d.type === 'syllabus' && d.semester === String(item.semester)) ||
                              documents.find((d) => d.id === 'doc-syl-official-1');
                            setActiveViewerDocId(targetDoc?.id || 'doc-syl-official-1');
                            setIsViewerModalOpen(true);
                          }}
                          className="text-[11px] font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer hover:underline font-semibold"
                          title="Preview syllabus in embedded document viewer"
                        >
                          <span className="material-symbols-outlined text-[15px]">menu_book</span>
                          Preview Regulation
                        </button>

                        <a
                          href={
                            item.source_document_url ||
                            (item.semester === '2'
                              ? '/syllabus/syllabus_CSE_2.pdf'
                              : item.semester === '6'
                              ? '/syllabus/syllabus_CSE_6.pdf'
                              : '/syllabus/B.Tech_CSE_R23_Curriculum_and_Syllabus.pdf')
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-mono text-slate-400 hover:text-white flex items-center gap-1 hover:underline"
                          title="Open original regulation PDF in new browser tab"
                        >
                          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                          Open PDF
                        </a>
                      </div>

                      <span className="text-[10px] font-mono text-slate-500">
                        {item.course} • Sem {item.semester}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Manual Upload Syllabus Modal */}
      <UploadSyllabusModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        student={student}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Original Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={isViewerModalOpen}
        onClose={() => setIsViewerModalOpen(false)}
        documents={documents}
        initialDocumentId={activeViewerDocId}
        category="syllabus"
      />
    </div>
  );
};
