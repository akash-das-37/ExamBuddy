import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../api/client';
import type { OriginalDocument, PYQQuestion, Student } from '../types';
import { getDocumentsForStudent } from '../data/documentsData';
import { UploadPyqModal } from '../components/UploadPyqModal';
import { DocumentViewerModal } from '../components/DocumentViewerModal';
import '../styles/PyqPage.css';

interface PyqPageProps {
  student: Student;
}

interface SubjectCardData {
  id: string;
  name: string;
  years: string;
  questionCount: string;
  icon: string;
  accentBg: string;
  accentColor: string;
}

const DEFAULT_SUBJECTS: SubjectCardData[] = [
  {
    id: 'math',
    name: 'Mathematics',
    years: '2018 - 2024',
    questionCount: '1200+ Questions',
    icon: 'calculate',
    accentBg: '#fee2e2',
    accentColor: '#ef4444',
  },
  {
    id: 'physics',
    name: 'Physics',
    years: '2018 - 2024',
    questionCount: '950+ Questions',
    icon: 'science',
    accentBg: '#f3e8ff',
    accentColor: '#a855f7',
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    years: '2018 - 2024',
    questionCount: '1100+ Questions',
    icon: 'biotech',
    accentBg: '#ffedd5',
    accentColor: '#f97316',
  },
  {
    id: 'deco',
    name: 'DECO',
    years: '2020 - 2024',
    questionCount: '600+ Questions',
    icon: 'memory',
    accentBg: '#e0f2fe',
    accentColor: '#0284c7',
  },
  {
    id: 'dsa',
    name: 'DSA',
    years: '2020 - 2024',
    questionCount: '700+ Questions',
    icon: 'database',
    accentBg: '#dcfce7',
    accentColor: '#16a34a',
  },
  {
    id: 'ai',
    name: 'AI',
    years: '2020 - 2024',
    questionCount: '500+ Questions',
    icon: 'psychology',
    accentBg: '#f3e8ff',
    accentColor: '#9333ea',
  },
];

interface PaperData {
  id: string;
  exam: string;
  year: string;
  title: string;
  tags: { label: string; type: 'math' | 'physics' | 'chemistry' | 'cs' }[];
  questionCount: string;
}

const DEFAULT_PAPERS: PaperData[] = [
  {
    id: 'wbjee-2024',
    exam: 'WBJEE',
    year: '2024',
    title: 'WBJEE 2024 (Full Paper)',
    tags: [
      { label: 'Math', type: 'math' },
      { label: 'Physics', type: 'physics' },
      { label: 'Chemistry', type: 'chemistry' },
    ],
    questionCount: '155 Questions',
  },
  {
    id: 'wbjee-2023',
    exam: 'WBJEE',
    year: '2023',
    title: 'WBJEE 2023 (Full Paper)',
    tags: [
      { label: 'Math', type: 'math' },
      { label: 'Physics', type: 'physics' },
      { label: 'Chemistry', type: 'chemistry' },
    ],
    questionCount: '155 Questions',
  },
  {
    id: 'wbjee-2022',
    exam: 'WBJEE',
    year: '2022',
    title: 'WBJEE 2022 (Full Paper)',
    tags: [
      { label: 'Math', type: 'math' },
      { label: 'Physics', type: 'physics' },
      { label: 'Chemistry', type: 'chemistry' },
    ],
    questionCount: '155 Questions',
  },
  {
    id: 'wbjee-2021',
    exam: 'WBJEE',
    year: '2021',
    title: 'WBJEE 2021 (Full Paper)',
    tags: [
      { label: 'Math', type: 'math' },
      { label: 'Physics', type: 'physics' },
      { label: 'Chemistry', type: 'chemistry' },
    ],
    questionCount: '155 Questions',
  },
  {
    id: 'wbjee-2020',
    exam: 'WBJEE',
    year: '2020',
    title: 'WBJEE 2020 (Full Paper)',
    tags: [
      { label: 'Math', type: 'math' },
      { label: 'Physics', type: 'physics' },
      { label: 'Chemistry', type: 'chemistry' },
    ],
    questionCount: '155 Questions',
  },
];

interface RecentSolveItem {
  id: string;
  title: string;
  subject: string;
  questionsCount: number;
  date: string;
  icon: string;
  accentBg: string;
  accentColor: string;
}

const RECENTLY_SOLVED: RecentSolveItem[] = [
  {
    id: 'rs-1',
    title: 'Linear Equations (WBJEE 2023)',
    subject: 'Mathematics',
    questionsCount: 10,
    date: '22 Sep',
    icon: 'calculate',
    accentBg: '#fee2e2',
    accentColor: '#ef4444',
  },
  {
    id: 'rs-2',
    title: 'Current Electricity (WBJEE 2022)',
    subject: 'Physics',
    questionsCount: 15,
    date: '21 Sep',
    icon: 'science',
    accentBg: '#f3e8ff',
    accentColor: '#a855f7',
  },
  {
    id: 'rs-3',
    title: 'Chemical Bonding (WBJEE 2023)',
    subject: 'Chemistry',
    questionsCount: 12,
    date: '20 Sep',
    icon: 'biotech',
    accentBg: '#ffedd5',
    accentColor: '#f97316',
  },
  {
    id: 'rs-4',
    title: 'Boolean Algebra (2022)',
    subject: 'DECO',
    questionsCount: 10,
    date: '19 Sep',
    icon: 'memory',
    accentBg: '#e0f2fe',
    accentColor: '#0284c7',
  },
  {
    id: 'rs-5',
    title: 'Trees (2023)',
    subject: 'DSA',
    questionsCount: 8,
    date: '18 Sep',
    icon: 'database',
    accentBg: '#dcfce7',
    accentColor: '#16a34a',
  },
];

export const PyqPage: React.FC<PyqPageProps> = ({ student }) => {
  const [pyqList, setPyqList] = useState<PYQQuestion[]>([]);
  const [documents, setDocuments] = useState<OriginalDocument[]>(() =>
    getDocumentsForStudent(student)
  );

  const [loading, setLoading] = useState(false);

  // Top Filter state
  const [selectedExam, setSelectedExam] = useState<string>('WBJEE');
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('all');
  const [selectedChapter, setSelectedChapter] = useState<string>('all');
  const [selectedQuestionType, setSelectedQuestionType] = useState<string>('all');

  // Active Subject selection
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);

  // Year-wise papers tab selection (2024, 2023, 2022, ...)
  const [activeYearTab, setActiveYearTab] = useState<string>('2024');

  // Modals & Action Toast state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);
  const [activeViewerDocId, setActiveViewerDocId] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Practice Modal state
  const [practicePaper, setPracticePaper] = useState<PaperData | null>(null);

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
    setToastMessage(`Successfully imported ${newQuestions.length} questions from "${newDoc.file_name}"!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filtered papers based on activeYearTab, activeSubjectId, and selectedExam
  const filteredPapers = useMemo(() => {
    return DEFAULT_PAPERS.filter((paper) => {
      const matchesYear = activeYearTab === 'all' || paper.year === activeYearTab;
      const matchesExam = selectedExam === 'all' || paper.exam === selectedExam;
      const matchesSub =
        !activeSubjectId ||
        paper.tags.some((t) => t.type.toLowerCase().includes(activeSubjectId)) ||
        activeSubjectId === 'math' ||
        activeSubjectId === 'physics' ||
        activeSubjectId === 'chemistry';
      return matchesYear && matchesExam && matchesSub;
    });
  }, [activeYearTab, selectedExam, activeSubjectId]);

  // Donut chart math for 68% accuracy
  const accuracyPercent = 68;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (accuracyPercent / 100) * circumference;

  // Quick Action Handlers
  const handleRandomPYQ = () => {
    if (pyqList.length > 0) {
      const random = pyqList[Math.floor(Math.random() * pyqList.length)];
      setToastMessage(`Random Practice: "${random.question_text.slice(0, 60)}..."`);
    } else {
      setToastMessage('Random Practice loaded: Solving Calculus & Vectors drill (10 Questions)');
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleTopicWisePractice = () => {
    setToastMessage('Topic-wise practice filter activated. Select a subject to drill specific modules.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAnalyzePerformance = () => {
    setToastMessage('Performance Analytics: Accuracy 68% (Strongest: DECO 75%, Focus Area: Chemistry 60%)');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSavedQuestions = () => {
    setToastMessage('Saved questions archive opened. 14 bookmarked problems found.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSolvePaper = (paper: PaperData) => {
    setPracticePaper(paper);
  };

  return (
    <div className="pyq-page-container">
      {/* Botanical Corner Leaf Watermark */}
      <div className="pyq-leaf-watermark">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
          <path d="M20 180 C 40 140, 80 110, 150 90 C 130 110, 90 150, 60 170 Z" fill="#284232" opacity="0.3" />
          <path d="M50 140 C 70 100, 120 70, 180 50 C 160 80, 120 120, 80 140 Z" fill="#284232" opacity="0.25" />
          <path d="M10 190 Q 70 130 160 80" stroke="#284232" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
        </svg>
      </div>

      <div className="pyq-content-wrap">
        {/* ================= TOP HEADER & QUOTE ROW ================= */}
        <div className="pyq-top-row">
          <div className="pyq-header-col">
            <div className="pyq-title-group">
              <h1 className="pyq-main-title">Previous Year Questions</h1>
              <p className="pyq-subtitle">Practice. Analyze. Improve. Score Higher.</p>
            </div>

            {/* Filter Bar with Exam, Year, Chapter, Type & Search Button */}
            <div className="pyq-filter-bar">
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="pyq-select-pill"
              >
                <option value="WBJEE">WBJEE</option>
                <option value="MAKAUT">MAKAUT</option>
                <option value="GATE">GATE</option>
                <option value="JEE">JEE Mains</option>
              </select>

              <select
                value={selectedYearFilter}
                onChange={(e) => {
                  setSelectedYearFilter(e.target.value);
                  if (e.target.value !== 'all') {
                    setActiveYearTab(e.target.value);
                  }
                }}
                className="pyq-select-pill"
              >
                <option value="all">All Years</option>
                {['2024', '2023', '2022', '2021', '2020', '2019', '2018'].map((y) => (
                  <option key={y} value={y}>
                    Year {y}
                  </option>
                ))}
              </select>

              <select
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
                className="pyq-select-pill"
              >
                <option value="all">All Chapters</option>
                <option value="calculus">Calculus & Algebra</option>
                <option value="electricity">Current Electricity</option>
                <option value="bonding">Chemical Bonding</option>
                <option value="logic">Boolean Algebra & Logic</option>
                <option value="trees">Trees & Graphs</option>
              </select>

              <select
                value={selectedQuestionType}
                onChange={(e) => setSelectedQuestionType(e.target.value)}
                className="pyq-select-pill"
              >
                <option value="all">All Question Types</option>
                <option value="mcq">MCQ Single Choice</option>
                <option value="multi">Multiple Select (MSQ)</option>
                <option value="num">Numerical Answer</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setToastMessage(`Searching PYQs: ${selectedExam} • ${selectedYearFilter} • ${selectedChapter}`);
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="pyq-search-btn"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  search
                </span>
                <span>Search</span>
              </button>
            </div>
          </div>

          {/* Inspirational Quote Card on top right */}
          <div className="pyq-quote-card">
            <span className="pyq-quote-mark">“</span>
            <p className="pyq-quote-text">
              Past questions build a stronger you.
            </p>

            <svg
              className="pyq-quote-leaves"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M10 90 C 30 70, 60 50, 95 20 C 80 40, 50 70, 20 85 Z" fill="#33593e" opacity="0.85" />
              <path d="M40 60 C 55 45, 80 35, 95 10 C 85 25, 60 45, 45 55 Z" fill="#477353" opacity="0.85" />
              <path d="M50 75 C 65 65, 85 55, 98 35 C 88 50, 70 70, 55 72 Z" fill="#5c8a68" opacity="0.85" />
              <path d="M2 98 Q 45 65 95 15" stroke="#233e2b" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Action Feedback Banner */}
        {toastMessage && (
          <div
            style={{
              padding: '12px 18px',
              borderRadius: '14px',
              fontSize: '13px',
              background: '#eaf4eb',
              border: '1px solid #c8e0cc',
              color: '#1e3d26',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(40, 66, 50, 0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#284232' }}>
                check_circle
              </span>
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#556b5a' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
            </button>
          </div>
        )}

        {/* ================= MAIN 2-COLUMN WORKSPACE ================= */}
        <div className="pyq-main-grid">
          {/* Left Column: Subjects Grid & Year-wise Papers */}
          <div className="pyq-left-col">
            {/* Section 1: Subjects Grid */}
            <div>
              <h2 className="pyq-section-title">Subjects</h2>
              <div className="pyq-subjects-grid">
                {DEFAULT_SUBJECTS.map((sub) => {
                  const isActive = activeSubjectId === sub.id;
                  return (
                    <div
                      key={sub.id}
                      onClick={() => setActiveSubjectId(isActive ? null : sub.id)}
                      className={`pyq-subject-card ${isActive ? 'active' : ''}`}
                    >
                      <div className="pyq-subj-left">
                        <div
                          className="pyq-subj-icon-box"
                          style={{
                            backgroundColor: sub.accentBg,
                            color: sub.accentColor,
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                            {sub.icon}
                          </span>
                        </div>
                        <div className="pyq-subj-info">
                          <span className="pyq-subj-name">{sub.name}</span>
                          <span className="pyq-subj-years">{sub.years}</span>
                          <span className="pyq-subj-qcount">{sub.questionCount}</span>
                        </div>
                      </div>

                      <span className="material-symbols-outlined pyq-subj-arrow">
                        chevron_right
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Year-wise Papers Card */}
            <div className="pyq-papers-card">
              {loading && (
                <div style={{ textAlign: 'center', padding: '4px 0', fontSize: '11.5px', color: '#687865', fontStyle: 'italic' }}>
                  Syncing previous year question bank...
                </div>
              )}
              <div className="pyq-papers-header">
                <div className="pyq-papers-title-box">
                  <h3 className="pyq-papers-headline">Year-wise Papers</h3>
                  <p className="pyq-papers-desc">Select a year to view and practice questions.</p>
                </div>

                {/* Year Pill Tabs */}
                <div className="pyq-year-pills">
                  {['2024', '2023', '2022', '2021', '2020', '2019', '2018'].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setActiveYearTab(yr)}
                      className={`pyq-year-pill ${activeYearTab === yr ? 'active' : ''}`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Papers List */}
              <div className="pyq-papers-list">
                {filteredPapers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '36px', color: '#687865', fontSize: '13.5px' }}>
                    No papers found for Year {activeYearTab}. Try choosing another year above.
                  </div>
                ) : (
                  filteredPapers.map((paper) => (
                    <div key={paper.id} className="pyq-paper-row">
                      <div className="pyq-paper-left">
                        <span className="material-symbols-outlined pyq-paper-icon">
                          article
                        </span>
                        <span className="pyq-paper-title">{paper.title}</span>
                      </div>

                      <div className="pyq-paper-meta">
                        <div className="pyq-subject-tags">
                          {paper.tags.map((tag, tIdx) => (
                            <span key={tIdx} className={`pyq-sub-badge ${tag.type}`}>
                              {tag.label}
                            </span>
                          ))}
                        </div>

                        <span className="pyq-paper-qcount">{paper.questionCount}</span>

                        <button
                          type="button"
                          onClick={() => handleSolvePaper(paper)}
                          className="pyq-solve-btn"
                        >
                          <span>Solve</span>
                          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                            arrow_forward
                          </span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Recently Solved, Stats Donut, Quick Actions */}
          <div className="pyq-sidebar-cards">
            {/* Card 1: Recently Solved */}
            <div className="pyq-recent-card">
              <div className="pyq-card-headrow">
                <h3 className="pyq-card-title">Recently Solved</h3>
                <span
                  onClick={() => {
                    setToastMessage('Viewing complete practice history (54 topics completed).');
                    setTimeout(() => setToastMessage(null), 3000);
                  }}
                  className="pyq-view-all-link"
                >
                  <span>View All</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                    arrow_forward
                  </span>
                </span>
              </div>

              <div className="pyq-recent-list">
                {RECENTLY_SOLVED.map((item) => (
                  <div key={item.id} className="pyq-recent-item">
                    <div className="pyq-recent-left">
                      <div
                        className="pyq-recent-icon"
                        style={{
                          backgroundColor: item.accentBg,
                          color: item.accentColor,
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                          {item.icon}
                        </span>
                      </div>
                      <div className="pyq-recent-text">
                        <span className="pyq-recent-title">{item.title}</span>
                        <span className="pyq-recent-sub">
                          {item.subject} • {item.questionsCount} Qs
                        </span>
                      </div>
                    </div>

                    <span className="pyq-recent-date">{item.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2: Your PYQ Stats Donut */}
            <div className="pyq-stats-card">
              <div className="pyq-card-headrow">
                <h3 className="pyq-card-title">Your PYQ Stats</h3>
                <select className="pyq-select-pill" style={{ padding: '4px 22px 4px 10px', fontSize: '11px' }}>
                  <option>This Month</option>
                  <option>All Time</option>
                  <option>This Week</option>
                </select>
              </div>

              <div className="pyq-stats-wrap">
                {/* SVG Donut Chart */}
                <div className="pyq-donut-chart">
                  <svg viewBox="0 0 96 96">
                    <circle
                      cx="48"
                      cy="48"
                      r={radius}
                      fill="transparent"
                      stroke="#ede8dc"
                      strokeWidth="10"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r={radius}
                      fill="transparent"
                      stroke="#284232"
                      strokeWidth="10"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeOffset}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                    />
                  </svg>
                  <div className="pyq-donut-center">
                    <span className="pyq-donut-percent">{accuracyPercent}%</span>
                    <span className="pyq-donut-label">Accuracy</span>
                  </div>
                </div>

                {/* Legend list */}
                <div className="pyq-stats-legend">
                  <div className="pyq-legend-row">
                    <span className="pyq-legend-left">
                      <span className="pyq-legend-dot" style={{ backgroundColor: '#284232' }} />
                      Mathematics
                    </span>
                    <span className="pyq-legend-val">70%</span>
                  </div>

                  <div className="pyq-legend-row">
                    <span className="pyq-legend-left">
                      <span className="pyq-legend-dot" style={{ backgroundColor: '#a855f7' }} />
                      Physics
                    </span>
                    <span className="pyq-legend-val">65%</span>
                  </div>

                  <div className="pyq-legend-row">
                    <span className="pyq-legend-left">
                      <span className="pyq-legend-dot" style={{ backgroundColor: '#f97316' }} />
                      Chemistry
                    </span>
                    <span className="pyq-legend-val">60%</span>
                  </div>

                  <div className="pyq-legend-row">
                    <span className="pyq-legend-left">
                      <span className="pyq-legend-dot" style={{ backgroundColor: '#0284c7' }} />
                      DECO
                    </span>
                    <span className="pyq-legend-val">75%</span>
                  </div>

                  <div className="pyq-legend-row">
                    <span className="pyq-legend-left">
                      <span className="pyq-legend-dot" style={{ backgroundColor: '#16a34a' }} />
                      DSA
                    </span>
                    <span className="pyq-legend-val">68%</span>
                  </div>

                  <div className="pyq-legend-row">
                    <span className="pyq-legend-left">
                      <span className="pyq-legend-dot" style={{ backgroundColor: '#9333ea' }} />
                      AI
                    </span>
                    <span className="pyq-legend-val">62%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Quick Actions */}
            <div className="pyq-actions-card">
              <h3 className="pyq-card-title">Quick Actions</h3>

              <div className="pyq-actions-grid">
                {/* Tile 1: Random PYQ */}
                <button
                  type="button"
                  onClick={handleRandomPYQ}
                  className="pyq-action-tile tile-red"
                >
                  <div className="pyq-action-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      description
                    </span>
                  </div>
                  <div>
                    <div className="pyq-action-title">Random PYQ</div>
                    <div className="pyq-action-sub">Get random questions</div>
                  </div>
                </button>

                {/* Tile 2: Topic-wise Practice */}
                <button
                  type="button"
                  onClick={handleTopicWisePractice}
                  className="pyq-action-tile tile-blue"
                >
                  <div className="pyq-action-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      track_changes
                    </span>
                  </div>
                  <div className="pyq-action-title">Topic-wise Practice</div>
                </button>

                {/* Tile 3: Analyze Performance */}
                <button
                  type="button"
                  onClick={handleAnalyzePerformance}
                  className="pyq-action-tile tile-green"
                >
                  <div className="pyq-action-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      bar_chart
                    </span>
                  </div>
                  <div className="pyq-action-title">Analyze Performance</div>
                </button>

                {/* Tile 4: Saved Questions */}
                <button
                  type="button"
                  onClick={handleSavedQuestions}
                  className="pyq-action-tile tile-amber"
                >
                  <div className="pyq-action-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      bookmark
                    </span>
                  </div>
                  <div className="pyq-action-title">Saved Questions</div>
                </button>
              </div>

              {/* Upload & Original Papers Buttons */}
              <div style={{ display: 'flex', gap: '8px', paddingTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(true)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '10px',
                    border: '1px solid #ded5c6',
                    background: '#faf7f2',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: '#284232',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                    upload_file
                  </span>
                  <span>Upload Paper</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const targetDoc =
                      documents.find((d) => d.type === 'pyq') ||
                      documents[0];
                    setActiveViewerDocId(targetDoc?.id);
                    setIsViewerModalOpen(true);
                  }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '10px',
                    border: '1px solid #ded5c6',
                    background: '#faf7f2',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: '#284232',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                    menu_book
                  </span>
                  <span>View PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Practice Question Modal */}
      {practicePaper && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '22px',
              border: '1px solid #ded5c6',
              maxWidth: '650px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'stretch', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: '#284232' }}>
                  Practice Mode • {practicePaper.exam} {practicePaper.year}
                </span>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', fontWeight: 700, margin: '2px 0 0', color: '#181d16' }}>
                  {practicePaper.title}
                </h3>
              </div>
              <button
                onClick={() => setPracticePaper(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#687865' }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: '#faf8f5', padding: '16px', borderRadius: '14px', border: '1px solid #eee8de', fontSize: '13px', lineHeight: 1.6, color: '#2b3329' }}>
              <div style={{ fontWeight: 600, color: '#181d16', marginBottom: '8px' }}>
                Question 1: Mathematics (Calculus &amp; Linear Systems)
              </div>
              &quot;Find the eigenvalues and eigenvectors of the matrix A = [[2, 1], [1, 2]]. Verify if the eigenvectors are orthogonal to each other.&quot;
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setToastMessage('Answer Verified: Correct! λ₁ = 3, λ₂ = 1. Orthogonality holds (v₁ · v₂ = 0).');
                  setPracticePaper(null);
                  setTimeout(() => setToastMessage(null), 4000);
                }}
                className="pyq-solve-btn"
                style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
              >
                Submit Answer &amp; Verify
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetDoc = documents.find((d) => d.type === 'pyq') || documents[0];
                  setActiveViewerDocId(targetDoc?.id);
                  setIsViewerModalOpen(true);
                  setPracticePaper(null);
                }}
                style={{
                  padding: '10px 18px',
                  borderRadius: '9999px',
                  border: '1px solid #ded5c6',
                  background: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: '#284232',
                }}
              >
                View Full Paper Solution PDF
              </button>
            </div>
          </div>
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
