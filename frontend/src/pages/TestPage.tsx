import React, { useState, useEffect, useRef } from 'react';
import type { Student } from '../types';
import { AVAILABLE_TESTS, type TestPaper, type TestQuestion } from '../data/testsData';
import { SEMESTER_SUBJECTS_MAP } from '../data/semesterSubjects';
import { api } from '../api/client';
import '../styles/TestPage.css';

interface TestPageProps {
  student: Student | null;
  onNavigateTab?: (tab: string) => void;
}

// Subject card definitions matching the user's design image
interface SubjectCardData {
  name: string;
  chapters: string;
  icon: string;
  bg: string;
  color: string;
}

const SEMESTER_2_SUBJECTS: SubjectCardData[] = [
  {
    name: 'Data structure and Algorithms',
    chapters: '5 Chapters',
    icon: 'storage',
    bg: '#dcfce7',
    color: '#15803d',
  },
  {
    name: 'Introduction to Artificial Intelligence',
    chapters: '5 Chapters',
    icon: 'psychology',
    bg: '#e0f2fe',
    color: '#0284c7',
  },
  {
    name: 'Digital Logic and Computer Organization',
    chapters: '6 Chapters',
    icon: 'memory',
    bg: '#f3e8ff',
    color: '#7e22ce',
  },
  {
    name: 'Engineering Mathematics–II',
    chapters: '4 Chapters',
    icon: 'calculate',
    bg: '#fee2e2',
    color: '#dc2626',
  },
  {
    name: 'Engineering Chemistry',
    chapters: '5 Chapters',
    icon: 'science',
    bg: '#fef3c7',
    color: '#d97706',
  },
  {
    name: 'Constitution of India & Professional Ethics',
    chapters: '4 Chapters',
    icon: 'gavel',
    bg: '#f1f5f9',
    color: '#475569',
  },
];

export const TestPage: React.FC<TestPageProps> = ({ student, onNavigateTab }) => {
  // Test selection & filtering
  const [selectedSubject, setSelectedSubject] = useState<string>('Data structure and Algorithms');
  const [testType, setTestType] = useState<string>('Previous Year Paper');
  const [selectedYear, setSelectedYear] = useState<string>('2024');
  const [selectedSemester, setSelectedSemester] = useState<string>(
    student?.semester ? `Semester ${student.semester}` : 'Semester 2'
  );

  // Tests list including presets and dynamic AI generated tests
  const [testsList, setTestsList] = useState<TestPaper[]>(() => AVAILABLE_TESTS);

  // Active Test Paper
  const [activeTest, setActiveTest] = useState<TestPaper>(() => AVAILABLE_TESTS[0]);
  const [currentQIndex, setCurrentQIndex] = useState<number>(4); // Default to Q5 (0-indexed 4) to match mockup!

  // User state per question in active test
  // answers: { [questionId: number]: 'A' | 'B' | 'C' | 'D' }
  const [answers, setAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({
    1: 'B', // Answered Q1
    5: 'A', // Answered Q5 as shown in mockup
  });
  // bookmarks: Set of questionIds
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set([5])); // Q5 marked for review as in mockup

  // Palette display toggle
  const [showAllQuestions, setShowAllQuestions] = useState<boolean>(false);

  // Timer: 2 hrs 42 mins 15 secs (9735 seconds) as displayed in mockup!
  const [secondsLeft, setSecondsLeft] = useState<number>(9735);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);

  // Modals & Submission state
  const [showEndModal, setShowEndModal] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState<boolean>(false);

  // AI Test Generation state
  const [showAiGenModal, setShowAiGenModal] = useState<boolean>(false);
  const [aiTopic, setAiTopic] = useState<string>('');
  const [aiQuestionCount, setAiQuestionCount] = useState<number>(5);
  const [aiDifficulty, setAiDifficulty] = useState<string>('Medium');
  const [aiProvider, setAiProvider] = useState<'backboard' | 'gemini'>('backboard');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const subjectScrollRef = useRef<HTMLDivElement>(null);

  const handleScrollRight = () => {
    if (subjectScrollRef.current) {
      subjectScrollRef.current.scrollBy({ left: 280, behavior: 'smooth' });
    }
  };

  // Semester string
  const semNum = selectedSemester.replace('Semester ', '').trim() || '2';

  // Timer countdown hook
  useEffect(() => {
    if (!isTimerRunning || isSubmitted) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, isSubmitted]);

  // Format seconds to H:MM:SS
  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const currentQ: TestQuestion = activeTest.questions[currentQIndex] || activeTest.questions[0];

  const handleSelectOption = (optId: 'A' | 'B' | 'C' | 'D') => {
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optId,
    }));
  };

  const handleClearAnswer = () => {
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentQ.id];
      return copy;
    });
  };

  const handleToggleBookmark = () => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(currentQ.id)) {
        next.delete(currentQ.id);
      } else {
        next.add(currentQ.id);
      }
      return next;
    });
  };

  const handleNext = () => {
    if (currentQIndex < activeTest.questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQIndex > 0) {
      setCurrentQIndex(currentQIndex - 1);
    }
  };

  const handleJumpToQuestion = (idx: number) => {
    setCurrentQIndex(idx);
  };

  const handleSwitchTest = (test: TestPaper) => {
    setActiveTest(test);
    setCurrentQIndex(0);
    setAnswers({});
    setBookmarks(new Set());
    setSecondsLeft(test.durationMinutes * 60);
    setIsSubmitted(false);
  };

  // Generate new test using Backboard.io or Google Gemini
  const handleGenerateAiTest = async () => {
    setIsGenerating(true);
    setAiError(null);
    try {
      const res = await api.generateTest({
        subject: selectedSubject,
        semester: parseInt(semNum, 10) || 2,
        course: student?.branch || 'CSE',
        topic: aiTopic.trim() || undefined,
        difficulty: aiDifficulty,
        question_count: aiQuestionCount,
        provider: aiProvider,
      });

      const newPaper: TestPaper = {
        id: res.id,
        title: res.title,
        subject: res.subject,
        course: res.course,
        semester: res.semester,
        college: res.college,
        year: res.year,
        term: res.term as 'Even' | 'Odd',
        type: res.type as any,
        totalMarks: res.totalMarks,
        durationMinutes: res.durationMinutes,
        questions: res.questions,
      };

      setTestsList((prev) => [newPaper, ...prev]);
      setActiveTest(newPaper);
      setCurrentQIndex(0);
      setAnswers({});
      setBookmarks(new Set());
      setSecondsLeft(newPaper.durationMinutes * 60);
      setIsSubmitted(false);
      setShowAiGenModal(false);
    } catch (err: any) {
      setAiError(err.message || 'Could not generate test questions. Please check API key.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Progress metrics
  const totalQuestions = activeTest.questions.length;
  const answeredCount = Object.keys(answers).length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  // Result calculation
  const correctCount = activeTest.questions.filter(
    (q) => answers[q.id] === q.correctAnswer
  ).length;
  const totalScoreEarned = activeTest.questions.reduce((acc, q) => {
    return answers[q.id] === q.correctAnswer ? acc + q.marks : acc;
  }, 0);
  const accuracyPercent = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  // Render SVG Binary Tree matching the mockup
  const renderTreeDiagram = () => (
    <div className="eb-test-diagram-wrap" aria-label="Binary Tree Diagram">
      <svg
        className="eb-test-tree-svg"
        viewBox="0 0 320 200"
        width="320"
        height="200"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <marker
            id="treeArrow"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#1b261d" />
          </marker>
        </defs>

        {/* Tree Edges */}
        {/* A -> B */}
        <line x1="160" y1="38" x2="114" y2="82" stroke="#1b261d" strokeWidth="1.8" markerEnd="url(#treeArrow)" />
        {/* A -> C */}
        <line x1="160" y1="38" x2="206" y2="82" stroke="#1b261d" strokeWidth="1.8" markerEnd="url(#treeArrow)" />
        {/* B -> D */}
        <line x1="104" y1="108" x2="72" y2="152" stroke="#1b261d" strokeWidth="1.8" markerEnd="url(#treeArrow)" />
        {/* B -> E */}
        <line x1="104" y1="108" x2="136" y2="152" stroke="#1b261d" strokeWidth="1.8" markerEnd="url(#treeArrow)" />
        {/* C -> F */}
        <line x1="216" y1="108" x2="248" y2="152" stroke="#1b261d" strokeWidth="1.8" markerEnd="url(#treeArrow)" />

        {/* Node A (Root) */}
        <circle cx="160" cy="30" r="14" fill="#ffffff" stroke="#1b261d" strokeWidth="2" />
        <text x="160" y="34.5" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1b261d" fontFamily="'Outfit', sans-serif">
          A
        </text>

        {/* Node B */}
        <circle cx="104" cy="98" r="14" fill="#ffffff" stroke="#1b261d" strokeWidth="2" />
        <text x="104" y="102.5" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1b261d" fontFamily="'Outfit', sans-serif">
          B
        </text>

        {/* Node C */}
        <circle cx="216" cy="98" r="14" fill="#ffffff" stroke="#1b261d" strokeWidth="2" />
        <text x="216" y="102.5" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1b261d" fontFamily="'Outfit', sans-serif">
          C
        </text>

        {/* Node D */}
        <circle cx="68" cy="166" r="14" fill="#ffffff" stroke="#1b261d" strokeWidth="2" />
        <text x="68" y="170.5" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1b261d" fontFamily="'Outfit', sans-serif">
          D
        </text>

        {/* Node E */}
        <circle cx="140" cy="166" r="14" fill="#ffffff" stroke="#1b261d" strokeWidth="2" />
        <text x="140" y="170.5" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1b261d" fontFamily="'Outfit', sans-serif">
          E
        </text>

        {/* Node F */}
        <circle cx="252" cy="166" r="14" fill="#ffffff" stroke="#1b261d" strokeWidth="2" />
        <text x="252" y="170.5" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1b261d" fontFamily="'Outfit', sans-serif">
          F
        </text>
      </svg>
    </div>
  );

  return (
    <div className="eb-test-container">
      {/* Subtle Botanical Leaf Watermark */}
      <svg className="eb-test-leaf-watermark" viewBox="0 0 200 200" fill="none">
        <path
          d="M20,180 C50,110 120,70 190,40 C170,90 130,150 60,185 Z"
          fill="#2d6a4f"
          fillOpacity="0.12"
        />
        <path
          d="M60,185 C90,130 150,90 200,60 C180,120 140,165 80,195 Z"
          fill="#1b4332"
          fillOpacity="0.08"
        />
      </svg>

      <div className="eb-test-content-wrap">
        {/* ================= 1. HEADER ROW ================= */}
        <div className="eb-test-header-row">
          <div className="eb-test-title-group">
            <h1 className="eb-test-main-title">Test</h1>
            <p className="eb-test-subtitle">
              Attempt subject-wise tests, mock exams and previous year papers.
            </p>
          </div>

          {/* Botanical Quote Card */}
          <div className="eb-test-quote-card">
            <span className="eb-test-quote-icon">“</span>
            <div className="eb-test-quote-text">
              Practice like a test,
              <br />
              <em>Perform like the real one.</em>
            </div>
            {/* Elegant leaf stroke in bottom right */}
            <svg className="eb-test-quote-leaf-svg" viewBox="0 0 100 80" fill="none">
              <path
                d="M10,70 C40,45 80,30 100,5 C85,35 60,65 20,78 Z"
                fill="#2d6a4f"
              />
              <path
                d="M30,75 C60,55 90,40 105,15 C95,45 75,70 40,80 Z"
                fill="#52b788"
                opacity="0.6"
              />
            </svg>
          </div>
        </div>

        {/* ================= 2. TOP SECTION: SUBJECT CARDS CAROUSEL ================= */}
        <div className="eb-test-top-section">
          {/* Horizontal Subject Cards Row (Exact recreation of user reference image) */}
          <div className="eb-test-subject-row-wrap">
            <div className="eb-test-subject-scroll-container" ref={subjectScrollRef}>
              {SEMESTER_2_SUBJECTS.map((subj) => {
                const isActive =
                  selectedSubject.toLowerCase().includes(subj.name.toLowerCase().slice(0, 10)) ||
                  subj.name.toLowerCase().includes(selectedSubject.toLowerCase().slice(0, 10));

                return (
                  <div
                    key={subj.name}
                    className={`eb-test-subject-card ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedSubject(subj.name);
                      // Switch active test to match subject if available
                      const matching = testsList.find(
                        (t) =>
                          t.subject.toLowerCase().includes(subj.name.toLowerCase().slice(0, 10)) ||
                          subj.name.toLowerCase().includes(t.subject.toLowerCase().slice(0, 10))
                      );
                      if (matching) handleSwitchTest(matching);
                    }}
                  >
                    <div
                      className="eb-test-subj-icon-box"
                      style={{ backgroundColor: subj.bg, color: subj.color }}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {subj.icon}
                      </span>
                    </div>
                    <div className="eb-test-subj-info">
                      <span className="eb-test-subj-name" title={subj.name}>
                        {subj.name}
                      </span>
                      <span className="eb-test-subj-chapters">{subj.chapters}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Scroll Right Button */}
            <button
              type="button"
              className="eb-test-scroll-arrow-btn"
              onClick={handleScrollRight}
              title="View more subjects"
              aria-label="Scroll subjects"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>

          {/* Secondary Filter & AI Tool Bar */}
          <div className="eb-test-filter-bar">
            {/* Test Type Dropdown */}
            <div className="eb-test-filter-item">
              <span className="material-symbols-outlined eb-test-filter-icon">calendar_today</span>
              <div className="eb-test-filter-inner">
                <span className="eb-test-filter-label">Test Type</span>
                <select
                  className="eb-test-select"
                  value={testType}
                  onChange={(e) => setTestType(e.target.value)}
                >
                  <option value="Previous Year Paper">Previous Year Paper</option>
                  <option value="Subject-wise Mock">Subject-wise Mock</option>
                  <option value="Chapter Quiz">Chapter Quiz</option>
                  <option value="Full Semester Mock">Full Semester Mock</option>
                </select>
              </div>
            </div>

            {/* Year Dropdown */}
            <div className="eb-test-filter-item">
              <span className="material-symbols-outlined eb-test-filter-icon">school</span>
              <div className="eb-test-filter-inner">
                <span className="eb-test-filter-label">Year</span>
                <select
                  className="eb-test-select"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                  <option value="2021">2021</option>
                </select>
              </div>
            </div>

            {/* Semester Dropdown */}
            <div className="eb-test-filter-item">
              <span className="material-symbols-outlined eb-test-filter-icon">description</span>
              <div className="eb-test-filter-inner">
                <span className="eb-test-filter-label">Semester</span>
                <select
                  className="eb-test-select"
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                >
                  {Object.keys(SEMESTER_SUBJECTS_MAP).map((sem) => (
                    <option key={sem} value={`Semester ${sem}`}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* AI Question Generator Button */}
            <button
              type="button"
              className="eb-test-generate-ai-btn"
              onClick={() => setShowAiGenModal(true)}
              title="Generate new exam questions with AI (Backboard / Gemini)"
            >
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              <span>Generate with AI</span>
            </button>

            {/* Start Test Action Button */}
            <button
              type="button"
              className="eb-test-start-btn"
              onClick={() => {
                setCurrentQIndex(0);
                setSecondsLeft(activeTest.durationMinutes * 60);
                setIsSubmitted(false);
              }}
            >
              <span className="material-symbols-outlined text-[18px]">play_arrow</span>
              <span>Start Test</span>
            </button>
          </div>
        </div>

        {/* ================= 3. MAIN WORKSPACE / RESULT ================= */}
        {isSubmitted ? (
          <div className="eb-test-result-card">
            <div className="eb-test-result-hero">
              <div className="eb-test-score-banner">
                <div className="eb-test-score-circle">
                  <span className="eb-test-score-big">{totalScoreEarned}</span>
                  <span className="eb-test-score-total">/ {activeTest.totalMarks}</span>
                </div>
                <div>
                  <h2 className="eb-test-work-title">Test Assessment Completed</h2>
                  <p className="eb-test-work-sub">
                    {activeTest.title} • {activeTest.subject}
                  </p>
                </div>
              </div>

              <div className="eb-test-modal-stats-grid" style={{ margin: 0 }}>
                <div className="eb-test-modal-stat-box">
                  <div className="eb-test-modal-stat-val text-emerald-700">{correctCount}</div>
                  <div className="eb-test-modal-stat-lbl">Correct Answers</div>
                </div>
                <div className="eb-test-modal-stat-box">
                  <div className="eb-test-modal-stat-val text-amber-700">
                    {answeredCount - correctCount}
                  </div>
                  <div className="eb-test-modal-stat-lbl">Incorrect</div>
                </div>
                <div className="eb-test-modal-stat-box">
                  <div className="eb-test-modal-stat-val text-indigo-700">{accuracyPercent}%</div>
                  <div className="eb-test-modal-stat-lbl">Accuracy</div>
                </div>
              </div>
            </div>

            {/* Detailed Question Review */}
            <div className="eb-test-col-header">
              <h3 className="eb-test-col-title">Question by Question Review</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                {onNavigateTab && (
                  <button
                    type="button"
                    className="eb-test-prev-btn"
                    onClick={() => onNavigateTab('dashboard')}
                  >
                    Back to Dashboard
                  </button>
                )}
                <button
                  type="button"
                  className="eb-test-start-btn"
                  onClick={() => {
                    setIsSubmitted(false);
                    setCurrentQIndex(0);
                  }}
                >
                  Retake This Test
                </button>
              </div>
            </div>

            <div className="eb-test-list" style={{ gap: '14px' }}>
              {activeTest.questions.map((q, idx) => {
                const userAns = answers[q.id];
                const isCorrect = userAns === q.correctAnswer;
                return (
                  <div
                    key={q.id}
                    className="eb-test-card"
                    style={{
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      borderColor: isCorrect ? '#86efac' : userAns ? '#fca5a5' : '#e5e7eb',
                      background: isCorrect ? '#f0fdf4' : userAns ? '#fff5f5' : '#ffffff',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px' }}>
                        Q{idx + 1}. {q.question}
                      </span>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: isCorrect ? '#166534' : userAns ? '#991b1b' : '#6b7280',
                        }}
                      >
                        {isCorrect
                          ? `+${q.marks} Marks`
                          : userAns
                          ? '0 Marks (Incorrect)'
                          : 'Unattempted'}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', marginTop: '6px', color: '#374151' }}>
                      <strong>Your Answer:</strong> {userAns || 'None'} |{' '}
                      <strong>Correct Answer:</strong> {q.correctAnswer}
                    </div>

                    <div
                      style={{
                        fontSize: '12.5px',
                        background: '#ffffff',
                        padding: '10px',
                        borderRadius: '8px',
                        marginTop: '8px',
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      <strong style={{ color: '#2d6a4f' }}>Explanation:</strong> {q.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="eb-test-workspace-grid">
            {/* ================= LEFT COLUMN: AVAILABLE TESTS ================= */}
            <div className="eb-test-left-col">
              <div className="eb-test-col-header">
                <h2 className="eb-test-col-title">Available Tests</h2>
                <button
                  type="button"
                  className="eb-test-filter-toggle-btn"
                  onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                >
                  <span className="material-symbols-outlined text-[16px]">filter_list</span>
                  <span>Filter</span>
                  <span className="material-symbols-outlined text-[14px]">expand_more</span>
                </button>
              </div>

              <div className="eb-test-list">
                {testsList.map((t) => {
                  const isActive = activeTest.id === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={`eb-test-card ${isActive ? 'active' : ''}`}
                      onClick={() => handleSwitchTest(t)}
                    >
                      <div className="eb-test-card-left">
                        <div className="eb-test-card-icon-box">
                          <span className="material-symbols-outlined text-[20px]">
                            description
                          </span>
                        </div>
                        <div className="eb-test-card-meta">
                          <span className="eb-test-card-title">{t.title}</span>
                          <span className="eb-test-card-sub">
                            {t.course} • Sem {t.semester} • {t.college}
                          </span>
                          <span className="eb-test-card-tags">
                            {t.totalMarks} marks • {Math.round(t.durationMinutes / 60)} hrs
                          </span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined eb-test-card-arrow">
                        chevron_right
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ================= CENTER COLUMN: QUESTION WORKSPACE ================= */}
            <div className="eb-test-center-col">
              {/* Workspace Header */}
              <div className="eb-test-work-header">
                <div className="eb-test-work-title-wrap">
                  <h2 className="eb-test-work-title">{activeTest.title}</h2>
                  <div className="eb-test-work-sub">
                    {activeTest.subject} • {activeTest.course} • Sem {activeTest.semester} •{' '}
                    {activeTest.totalMarks} marks • {Math.round(activeTest.durationMinutes / 60)} hrs
                  </div>
                </div>

                <button
                  type="button"
                  className="eb-test-end-btn"
                  onClick={() => setShowEndModal(true)}
                  title="Finish and submit test"
                >
                  <span className="material-symbols-outlined text-[16px]">cancel</span>
                  <span>End Test</span>
                </button>
              </div>

              {/* Question Sub-bar */}
              <div className="eb-test-q-bar">
                <div className="eb-test-q-bar-left">
                  <span className="eb-test-q-index">
                    <span className="material-symbols-outlined text-[18px] text-[#2d6a4f]">
                      account_tree
                    </span>
                    Question {currentQ.id} of {totalQuestions}
                  </span>
                  <span className="eb-test-q-badge-marks">{currentQ.marks} Marks</span>
                  <span className={`eb-test-q-badge-diff ${currentQ.difficulty.toLowerCase()}`}>
                    {currentQ.difficulty}
                  </span>
                </div>

                <button
                  type="button"
                  className={`eb-test-bookmark-btn ${bookmarks.has(currentQ.id) ? 'active' : ''}`}
                  onClick={handleToggleBookmark}
                  title="Mark for review"
                >
                  <span
                    className={`material-symbols-outlined text-[18px] ${
                      bookmarks.has(currentQ.id) ? 'text-amber-500 fill-1' : ''
                    }`}
                  >
                    bookmark
                  </span>
                  <span>{bookmarks.has(currentQ.id) ? 'Bookmarked' : 'Bookmark'}</span>
                </button>
              </div>

              {/* Question Statement */}
              <div className="eb-test-q-statement">{currentQ.question}</div>

              {/* Diagram Render (if question has binary tree or similar) */}
              {currentQ.diagramType === 'binary-tree' && renderTreeDiagram()}

              {/* Multiple Choice Options */}
              <div className="eb-test-options-list">
                {currentQ.options.map((opt) => {
                  const isSelected = answers[currentQ.id] === opt.id;
                  return (
                    <div
                      key={opt.id}
                      className={`eb-test-option-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectOption(opt.id as 'A' | 'B' | 'C' | 'D')}
                    >
                      <div className="eb-test-option-radio">
                        {isSelected && (
                          <span className="material-symbols-outlined text-[14px]">check</span>
                        )}
                      </div>
                      <span className="eb-test-option-id">{opt.id}.</span>
                      <span className="eb-test-option-text">{opt.text}</span>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Navigation Controls */}
              <div className="eb-test-controls-row">
                <button
                  type="button"
                  className="eb-test-prev-btn"
                  onClick={handlePrevious}
                  disabled={currentQIndex === 0}
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  <span>Previous</span>
                </button>

                <button
                  type="button"
                  className="eb-test-clear-btn"
                  onClick={handleClearAnswer}
                >
                  <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                  <span>Clear Answer</span>
                </button>

                <button
                  type="button"
                  className="eb-test-next-btn"
                  onClick={handleNext}
                  disabled={currentQIndex === totalQuestions - 1}
                >
                  <span>Next</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>

            {/* ================= RIGHT COLUMN: TIMER, PALETTE, PROGRESS ================= */}
            <div className="eb-test-right-col">
              {/* 1. Time Left Countdown */}
              <div
                className="eb-test-timer-card"
                onClick={() => setIsTimerRunning((prev) => !prev)}
                style={{ cursor: 'pointer' }}
                title={isTimerRunning ? 'Click to pause timer' : 'Click to resume timer'}
              >
                <div className="eb-test-timer-icon-wrap">
                  <span className="material-symbols-outlined text-[24px]">
                    {isTimerRunning ? 'schedule' : 'pause_circle'}
                  </span>
                </div>
                <div className="eb-test-timer-content">
                  <span className="eb-test-timer-label">
                    Time Left {isTimerRunning ? '' : '(Paused)'}
                  </span>
                  <span className="eb-test-timer-digits">{formatTime(secondsLeft)}</span>
                </div>
              </div>

              {/* 2. Question Palette */}
              <div className="eb-test-palette-card">
                <h3 className="eb-test-palette-title">Question Palette</h3>

                {/* Legend */}
                <div className="eb-test-palette-legend">
                  <div className="eb-test-legend-item">
                    <span className="eb-test-legend-dot ans" />
                    <span>Answered</span>
                  </div>
                  <div className="eb-test-legend-item">
                    <span className="eb-test-legend-dot curr" />
                    <span>Current</span>
                  </div>
                  <div className="eb-test-legend-item">
                    <span className="eb-test-legend-dot not-ans" />
                    <span>Not Answered</span>
                  </div>
                  <div className="eb-test-legend-item">
                    <span className="eb-test-legend-dot marked" />
                    <span>Marked for Review</span>
                  </div>
                </div>

                {/* Grid of question buttons */}
                <div className="eb-test-palette-grid">
                  {activeTest.questions
                    .slice(0, showAllQuestions ? totalQuestions : 20)
                    .map((q, idx) => {
                      const isCurrent = idx === currentQIndex;
                      const isAnswered = answers[q.id] !== undefined;
                      const isMarked = bookmarks.has(q.id);

                      let statusClass = '';
                      if (isCurrent) statusClass = 'current';
                      else if (isMarked) statusClass = 'marked';
                      else if (isAnswered) statusClass = 'answered';

                      return (
                        <button
                          key={q.id}
                          type="button"
                          className={`eb-test-palette-btn ${statusClass}`}
                          onClick={() => handleJumpToQuestion(idx)}
                          title={`Question ${q.id} (${
                            isMarked
                              ? 'Marked for Review'
                              : isAnswered
                              ? 'Answered'
                              : isCurrent
                              ? 'Current'
                              : 'Not Answered'
                          })`}
                        >
                          {q.id}
                        </button>
                      );
                    })}
                </div>

                {totalQuestions > 20 && (
                  <button
                    type="button"
                    className="eb-test-palette-toggle-btn"
                    onClick={() => setShowAllQuestions(!showAllQuestions)}
                  >
                    <span>
                      {showAllQuestions
                        ? 'Collapse Palette'
                        : `Show All Questions (${totalQuestions})`}
                    </span>
                    <span className="material-symbols-outlined text-[16px]">
                      {showAllQuestions ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                )}
              </div>

              {/* 3. Test Progress */}
              <div className="eb-test-progress-card">
                <h3 className="eb-test-progress-title">Test Progress</h3>
                <div className="eb-test-progress-stats">
                  <span>
                    {answeredCount} / {totalQuestions}
                  </span>
                  <span className="eb-test-progress-percent">{progressPercent}%</span>
                </div>
                <div className="eb-test-progress-track">
                  <div
                    className="eb-test-progress-bar"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= END TEST CONFIRMATION MODAL ================= */}
      {showEndModal && (
        <div className="eb-test-modal-backdrop" onClick={() => setShowEndModal(false)}>
          <div className="eb-test-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="eb-test-modal-title">Ready to Submit Test?</h3>
            <p className="eb-test-modal-body">
              Are you sure you want to end this examination? Once submitted, your answers will be
              graded immediately.
            </p>

            <div className="eb-test-modal-stats-grid">
              <div className="eb-test-modal-stat-box">
                <div className="eb-test-modal-stat-val text-emerald-700">{answeredCount}</div>
                <div className="eb-test-modal-stat-lbl">Answered</div>
              </div>
              <div className="eb-test-modal-stat-box">
                <div className="eb-test-modal-stat-val text-gray-700">
                  {totalQuestions - answeredCount}
                </div>
                <div className="eb-test-modal-stat-lbl">Unanswered</div>
              </div>
              <div className="eb-test-modal-stat-box">
                <div className="eb-test-modal-stat-val text-rose-700">{bookmarks.size}</div>
                <div className="eb-test-modal-stat-lbl">Marked for Review</div>
              </div>
            </div>

            <div className="eb-test-modal-actions">
              <button
                type="button"
                className="eb-test-modal-cancel"
                onClick={() => setShowEndModal(false)}
              >
                Resume Test
              </button>
              <button
                type="button"
                className="eb-test-modal-confirm"
                onClick={() => {
                  setShowEndModal(false);
                  setIsSubmitted(true);
                }}
              >
                Submit & End Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= AI QUESTION GENERATOR MODAL ================= */}
      {showAiGenModal && (
        <div className="eb-test-modal-backdrop" onClick={() => !isGenerating && setShowAiGenModal(false)}>
          <div className="eb-test-modal" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="material-symbols-outlined text-[26px] text-emerald-700">auto_awesome</span>
              <div>
                <h3 className="eb-test-modal-title">Generate Custom Test with AI</h3>
                <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#68796c' }}>
                  Powered by <strong>Backboard.io</strong> & <strong>Google Gemini</strong>
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleGenerateAiTest();
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '4px' }}
            >
              {/* Subject */}
              <div>
                <label className="eb-test-modal-field-label">
                  Target Subject
                </label>
                <input
                  type="text"
                  value={selectedSubject}
                  readOnly
                  className="eb-test-modal-readonly"
                />
              </div>

              {/* Topic Focus */}
              <div>
                <label className="eb-test-modal-field-label">
                  Topic / Chapter Focus (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Binary Trees, Sorting, or Midterm Syllabus"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  disabled={isGenerating}
                />
              </div>

              {/* Two columns: Count & Difficulty */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="eb-test-modal-field-label">
                    Number of Questions
                  </label>
                  <select
                    value={aiQuestionCount}
                    onChange={(e) => setAiQuestionCount(Number(e.target.value))}
                    disabled={isGenerating}
                  >
                    <option value={3}>3 Questions (Quick Quiz)</option>
                    <option value={5}>5 Questions (Standard Practice)</option>
                    <option value={10}>10 Questions (Midterm Review)</option>
                    <option value={15}>15 Questions (Full Mock)</option>
                  </select>
                </div>

                <div>
                  <label className="eb-test-modal-field-label">
                    Target Difficulty
                  </label>
                  <select
                    value={aiDifficulty}
                    onChange={(e) => setAiDifficulty(e.target.value)}
                    disabled={isGenerating}
                  >
                    <option value="Easy">Easy (Conceptual)</option>
                    <option value="Medium">Medium (University Exam)</option>
                    <option value="Hard">Hard (Advanced & Numericals)</option>
                    <option value="Mixed">Mixed (All Levels)</option>
                  </select>
                </div>
              </div>

              {/* Provider Selection */}
              <div>
                <label className="eb-test-modal-field-label">
                  AI Generation Engine
                </label>
                <div className="eb-test-provider-grid">
                  <div
                    className={`eb-test-provider-card ${aiProvider === 'backboard' ? 'active' : ''}`}
                    onClick={() => !isGenerating && setAiProvider('backboard')}
                  >
                    <input
                      type="radio"
                      id="ai-prov-bb"
                      name="aiProvider"
                      checked={aiProvider === 'backboard'}
                      onChange={() => setAiProvider('backboard')}
                      disabled={isGenerating}
                    />
                    <label htmlFor="ai-prov-bb" style={{ cursor: 'pointer', margin: 0 }}>
                      <span style={{ fontWeight: 700, display: 'block', color: '#1a231b' }}>Backboard.io</span>
                      <span style={{ fontSize: '11px', color: '#687a6d' }}>Unified API Key (espr_...)</span>
                    </label>
                  </div>

                  <div
                    className={`eb-test-provider-card ${aiProvider === 'gemini' ? 'active' : ''}`}
                    onClick={() => !isGenerating && setAiProvider('gemini')}
                  >
                    <input
                      type="radio"
                      id="ai-prov-gem"
                      name="aiProvider"
                      checked={aiProvider === 'gemini'}
                      onChange={() => setAiProvider('gemini')}
                      disabled={isGenerating}
                    />
                    <label htmlFor="ai-prov-gem" style={{ cursor: 'pointer', margin: 0 }}>
                      <span style={{ fontWeight: 700, display: 'block', color: '#1a231b' }}>Google Gemini</span>
                      <span style={{ fontSize: '11px', color: '#687a6d' }}>Gemini 2.5 Flash (Fast)</span>
                    </label>
                  </div>
                </div>
              </div>

              {aiError && (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '12.5px',
                    color: '#991b1b'
                  }}
                >
                  {aiError}
                </div>
              )}

              <div className="eb-test-modal-actions" style={{ marginTop: '10px' }}>
                <button
                  type="button"
                  className="eb-test-modal-cancel"
                  onClick={() => setShowAiGenModal(false)}
                  disabled={isGenerating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="eb-test-start-btn"
                  disabled={isGenerating}
                  style={{ background: isGenerating ? '#9ca3af' : '#1b4332' }}
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Synthesizing Exam Paper...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                      <span>Generate Exam Paper</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestPage;
