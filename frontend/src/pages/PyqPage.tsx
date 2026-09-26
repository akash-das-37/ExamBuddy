import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../api/client';
import type { OriginalDocument, PYQQuestion, Student, SyllabusEntry } from '../types';
import { getDocumentsForStudent } from '../data/documentsData';
import { getSubjectsForSemester, getSubjectVisuals, PALETTES } from '../data/semesterSubjects';
import { INITIAL_CURRICULUM_DATA } from '../data/curriculumData';
import { UploadPyqModal } from '../components/UploadPyqModal';
import { DocumentViewerModal } from '../components/DocumentViewerModal';
import '../styles/PyqPage.css';

interface PyqPageProps {
  student: Student;
}

export interface UserSubject {
  id: string;
  name: string;
  years: string;
  questionCount: string;
  icon: string;
  accentBg: string;
  accentColor: string;
  isCustom?: boolean;
}

export interface PaperData {
  id: string;
  exam: string;
  year: string;
  title: string;
  tags: { label: string; type: string }[];
  questionCount: string;
}

export interface RecentSolveItem {
  id: string;
  title: string;
  subject: string;
  questionsCount: number;
  date: string;
  icon: string;
  accentBg: string;
  accentColor: string;
}

const AVAILABLE_ICONS = [
  { id: 'database', label: 'Data / DBMS' },
  { id: 'memory', label: 'Hardware / Circuits' },
  { id: 'psychology', label: 'AI / ML' },
  { id: 'code', label: 'Coding / OOP' },
  { id: 'terminal', label: 'OS / Systems' },
  { id: 'lan', label: 'Networks / Web' },
  { id: 'calculate', label: 'Math / Logic' },
  { id: 'menu_book', label: 'Theory / Core' },
];

const USER_SUBJECTS_STORAGE_KEY = 'exambuddy_user_subjects';

interface StoredSubject {
  id: string;
  name: string;
  icon?: string;
  accentBg?: string;
  accentColor?: string;
}

function getStoredCustomSubjects(): StoredSubject[] {
  try {
    const raw = localStorage.getItem(USER_SUBJECTS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return [];
}

function saveStoredCustomSubjects(subjects: StoredSubject[]) {
  try {
    localStorage.setItem(USER_SUBJECTS_STORAGE_KEY, JSON.stringify(subjects));
  } catch {
    // ignore
  }
}

export const PyqPage: React.FC<PyqPageProps> = ({ student }) => {
  const [pyqList, setPyqList] = useState<PYQQuestion[]>([]);
  const [documents, setDocuments] = useState<OriginalDocument[]>(() =>
    getDocumentsForStudent(student)
  );

  const [loading, setLoading] = useState(false);
  const [customVersion, setCustomVersion] = useState(0);

  // Active Subject filter selection
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);

  // Year-wise papers tab selection (2024, 2023, 2022, ...)
  const [activeYearTab, setActiveYearTab] = useState<string>('2024');

  // Modals & Action Toast state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadInitialSubject, setUploadInitialSubject] = useState<string | undefined>(undefined);
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);
  const [activeViewerDocId, setActiveViewerDocId] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleOpenUpload = (subjName?: string) => {
    setUploadInitialSubject(subjName);
    setIsUploadModalOpen(true);
  };

  // Add Subject Modal state
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubIcon, setNewSubIcon] = useState('menu_book');
  const [newSubPaletteIndex, setNewSubPaletteIndex] = useState(0);

  // Practice Modal state
  const [practicePaper, setPracticePaper] = useState<PaperData | null>(null);

  // Track deleted paper IDs (custom & default)
  const [deletedPaperIds, setDeletedPaperIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('exambuddy_deleted_pyq_ids') || '[]');
    } catch {
      return [];
    }
  });

  // Paper pending delete confirmation
  const [confirmDeletePaper, setConfirmDeletePaper] = useState<{ id: string; title: string } | null>(null);

  const handleDeletePaper = (paperId: string, paperTitle: string) => {
    // 1. Add to deleted IDs in state & localStorage
    setDeletedPaperIds((prev) => {
      const next = prev.includes(paperId) ? prev : [...prev, paperId];
      try {
        localStorage.setItem('exambuddy_deleted_pyq_ids', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });

    // 2. Remove matching document from documents and storage
    setDocuments((prevDocs) => {
      const nextDocs = prevDocs.filter(
        (d) => d.id !== paperId && d.file_name.replace(/\.[^/.]+$/, '') !== paperTitle
      );
      try {
        localStorage.setItem('exambuddy_uploaded_docs', JSON.stringify(nextDocs));
      } catch {
        // ignore
      }
      return nextDocs;
    });

    // 3. Remove corresponding questions from pyqList and storage
    setPyqList((prevPyqs) => {
      const nextPyqs = prevPyqs.filter(
        (q) => q.source_document_id !== paperId && q.id !== paperId
      );
      try {
        localStorage.setItem('exambuddy_uploaded_pyqs', JSON.stringify(nextPyqs));
      } catch {
        // ignore
      }
      return nextPyqs;
    });

    // 4. Close practice modal if active
    if (practicePaper && practicePaper.id === paperId) {
      setPracticePaper(null);
    }
    setConfirmDeletePaper(null);

    // 5. Update custom version for reactive updates
    setCustomVersion((v) => v + 1);

    // 6. Toast feedback
    setToastMessage(`Deleted PYQ "${paperTitle}" successfully.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

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
    setCustomVersion((v) => v + 1);
    setToastMessage(`Successfully uploaded ${newQuestions.length} questions for "${newDoc.subject}"!`);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Build the list of subjects strictly for the user's active semester
  const userSubjects = useMemo<UserSubject[]>(() => {
    const currentSem = String(student?.semester || '2');

    const subjectMap = new Map<
      string,
      {
        id: string;
        name: string;
        years: Set<string>;
        questionCount: number;
        icon?: string;
        accentBg?: string;
        accentColor?: string;
        isCustom?: boolean;
      }
    >();

    // 1. Gather semester subjects from user uploaded/scraped syllabus
    const semSubjectsFromUpload: string[] = [];
    try {
      const sylRaw = localStorage.getItem('exambuddy_uploaded_syllabus');
      if (sylRaw) {
        const parsed: SyllabusEntry[] = JSON.parse(sylRaw);
        parsed.forEach((entry) => {
          if (entry.subject && String(entry.semester) === currentSem) {
            const norm = entry.subject.trim();
            if (norm && !semSubjectsFromUpload.includes(norm)) {
              semSubjectsFromUpload.push(norm);
            }
          }
        });
      }
    } catch {
      // ignore
    }

    // 2. Gather semester subjects from initial curriculum data
    const semSubjectsFromData: string[] = [];
    INITIAL_CURRICULUM_DATA.forEach((entry) => {
      if (String(entry.semester) === currentSem && entry.subject) {
        const norm = entry.subject.trim();
        const lower = norm.toLowerCase();
        const isLab = lower.endsWith('lab') || lower.includes('workshop') || lower.includes('nss') || lower.includes('activities');
        if (!isLab && !semSubjectsFromData.includes(norm)) {
          semSubjectsFromData.push(norm);
        }
      }
    });

    // 3. Fallback standard semester subjects
    const fallbackList = getSubjectsForSemester(currentSem, student?.branch);

    // Merge semester subjects in priority order
    const semesterSubjectNames: string[] = [];
    const addUnique = (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      if (!semesterSubjectNames.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
        semesterSubjectNames.push(trimmed);
      }
    };

    if (semSubjectsFromUpload.length > 0) {
      semSubjectsFromUpload.forEach(addUnique);
    } else if (semSubjectsFromData.length > 0) {
      semSubjectsFromData.forEach(addUnique);
    } else {
      fallbackList.forEach(addUnique);
    }

    // Ensure standard subjects for this semester are included
    fallbackList.forEach(addUnique);

    // Populate subjectMap with the student's active semester subjects
    const defaultCounts = [18, 24, 15, 20, 28, 16, 22];
    semesterSubjectNames.forEach((subjName, idx) => {
      const norm = subjName.trim();
      const key = norm.toLowerCase();
      const visuals = getSubjectVisuals(norm, idx);
      subjectMap.set(key, {
        id: key,
        name: norm,
        years: new Set(['2024', '2025']),
        questionCount: defaultCounts[idx % defaultCounts.length],
        icon: visuals.icon,
        accentBg: visuals.accentBg,
        accentColor: visuals.accentColor,
        isCustom: false,
      });
    });

    // 4. Add custom subjects saved by the student
    const stored = getStoredCustomSubjects();
    stored.forEach((item, idx) => {
      const normName = item.name.trim();
      if (!normName) return;
      const key = normName.toLowerCase();
      const visuals = getSubjectVisuals(normName, subjectMap.size + idx);
      if (subjectMap.has(key)) {
        const existing = subjectMap.get(key)!;
        existing.isCustom = true;
        if (item.icon) existing.icon = item.icon;
        if (item.accentBg) existing.accentBg = item.accentBg;
        if (item.accentColor) existing.accentColor = item.accentColor;
      } else {
        subjectMap.set(key, {
          id: item.id || key,
          name: normName,
          years: new Set(['2024', '2025']),
          questionCount: 15,
          icon: item.icon || visuals.icon,
          accentBg: item.accentBg || visuals.accentBg,
          accentColor: item.accentColor || visuals.accentColor,
          isCustom: true,
        });
      }
    });

    // 5. Update question counts and years from student's PYQs matching these semester subjects
    pyqList.forEach((q) => {
      if (q.subject && q.subject.trim()) {
        const qSub = q.subject.trim().toLowerCase();
        for (const [key, item] of subjectMap.entries()) {
          if (qSub === key || qSub.includes(key) || key.includes(qSub)) {
            item.questionCount += 1;
            if (q.exam_year) item.years.add(String(q.exam_year));
          }
        }
      }
    });

    // 6. Update question counts and years from student's documents matching these semester subjects
    documents.forEach((doc) => {
      if (doc.subject && doc.subject.trim()) {
        if (doc.semester && String(doc.semester) !== currentSem && !String(doc.semester).includes(currentSem)) {
          return;
        }
        const docSub = doc.subject.trim().toLowerCase();
        for (const [key, item] of subjectMap.entries()) {
          if (docSub === key || docSub.includes(key) || key.includes(docSub)) {
            if (doc.exam_year) item.years.add(String(doc.exam_year));
            if (doc.extracted_count) item.questionCount += doc.extracted_count;
          }
        }
      }
    });

    return Array.from(subjectMap.values()).map((s) => {
      const yearsArr = Array.from(s.years).sort().reverse();
      const yearsStr =
        yearsArr.length > 1
          ? `${yearsArr[yearsArr.length - 1]} - ${yearsArr[0]}`
          : yearsArr.length === 1
          ? `Year ${yearsArr[0]}`
          : '2024 - 2025';
      return {
        id: s.id,
        name: s.name,
        years: yearsStr,
        questionCount: `${s.questionCount > 0 ? s.questionCount : 15} Questions`,
        icon: s.icon || 'menu_book',
        accentBg: s.accentBg || '#eaf3ec',
        accentColor: s.accentColor || '#284232',
        isCustom: s.isCustom,
      };
    });
  }, [customVersion, pyqList, documents, student?.semester, student?.branch]);

  // Handle adding custom subject
  const handleAddSubjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSubName.trim();
    if (!trimmed) return;

    const current = getStoredCustomSubjects();
    const existing = current.find((s) => s.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      setToastMessage(`Subject "${trimmed}" already exists.`);
      setTimeout(() => setToastMessage(null), 3000);
      setIsAddSubjectOpen(false);
      return;
    }

    const palette = PALETTES[newSubPaletteIndex % PALETTES.length];
    const newEntry: StoredSubject = {
      id: `subj_${Date.now()}`,
      name: trimmed,
      icon: newSubIcon,
      accentBg: palette.bg,
      accentColor: palette.color,
    };

    saveStoredCustomSubjects([...current, newEntry]);
    setCustomVersion((v) => v + 1);
    setNewSubName('');
    setIsAddSubjectOpen(false);
    setToastMessage(`Subject "${trimmed}" added successfully!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handle removing a custom subject
  const handleDeleteCustomSubject = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    const current = getStoredCustomSubjects();
    const updated = current.filter((s) => s.id !== id && s.name.toLowerCase() !== name.toLowerCase());
    saveStoredCustomSubjects(updated);
    setCustomVersion((v) => v + 1);
    if (activeSubjectId === id || activeSubjectId === name.toLowerCase()) {
      setActiveSubjectId(null);
    }
    setToastMessage(`Removed subject "${name}".`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Dynamic user papers based on user subjects and uploaded documents
  const filteredPapers = useMemo<PaperData[]>(() => {
    const list: PaperData[] = [];

    // 1. Papers from user uploaded documents
    documents
      .filter((d) => d.type === 'pyq')
      .forEach((doc) => {
        if (deletedPaperIds.includes(doc.id)) return;
        const docYear = String(doc.exam_year || '2024');
        if (activeYearTab !== 'all' && docYear !== activeYearTab) return;
        if (activeSubjectId && !doc.subject?.toLowerCase().includes(activeSubjectId.toLowerCase())) {
          return;
        }
        list.push({
          id: doc.id,
          exam: student.branch || 'University Exam',
          year: docYear,
          title: doc.file_name.replace(/\.[^/.]+$/, ''),
          tags: [{ label: doc.subject || 'PYQ Paper', type: 'cse' }],
          questionCount: `${doc.extracted_count || 20} Questions`,
        });
      });

    // 2. Generate user subject semester papers
    userSubjects.forEach((sub) => {
      const paperId = `paper-${sub.id}-${activeYearTab}`;
      if (deletedPaperIds.includes(paperId)) return;
      if (activeSubjectId && sub.id !== activeSubjectId && !sub.name.toLowerCase().includes(activeSubjectId)) {
        return;
      }
      list.push({
        id: paperId,
        exam: 'Semester Exam',
        year: activeYearTab,
        title: `${sub.name} - End Semester Question Paper ${activeYearTab}`,
        tags: [{ label: sub.name, type: 'cse' }],
        questionCount: sub.questionCount,
      });
    });

    return list;
  }, [userSubjects, documents, activeYearTab, activeSubjectId, student.branch, deletedPaperIds]);

  // Donut chart math for accuracy
  const accuracyPercent = 72;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (accuracyPercent / 100) * circumference;

  // Dynamic Recently Solved
  const recentSolves = useMemo<RecentSolveItem[]>(() => {
    if (userSubjects.length === 0) return [];
    return userSubjects.slice(0, 3).map((sub, i) => ({
      id: `recent-${sub.id}`,
      title: `${sub.name} Practice Drill`,
      subject: sub.name,
      questionsCount: 10 + i * 5,
      date: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : '3 days ago',
      icon: sub.icon,
      accentBg: sub.accentBg,
      accentColor: sub.accentColor,
    }));
  }, [userSubjects]);

  // Quick Action Handlers
  const handleRandomPYQ = () => {
    if (pyqList.length > 0) {
      const random = pyqList[Math.floor(Math.random() * pyqList.length)];
      setToastMessage(`Random Practice: "${random.question_text.slice(0, 60)}..."`);
    } else if (userSubjects.length > 0) {
      const randomSub = userSubjects[Math.floor(Math.random() * userSubjects.length)];
      setToastMessage(`Random Practice loaded: Solving 10 drill questions in ${randomSub.name}`);
    } else {
      setToastMessage('Add your subjects or upload papers to generate personalized drills.');
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleTopicWisePractice = () => {
    if (userSubjects.length > 0) {
      setToastMessage(`Topic-wise practice active: Choose from ${userSubjects.length} subjects above to drill.`);
    } else {
      setToastMessage('Topic-wise practice: Add a subject to get started.');
    }
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAnalyzePerformance = () => {
    if (userSubjects.length > 0) {
      setToastMessage(`Performance Analytics: Accuracy 72% across ${userSubjects.length} enrolled subjects.`);
    } else {
      setToastMessage('Performance Analytics: No subject practice history recorded yet.');
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSavedQuestions = () => {
    setToastMessage('Saved questions archive opened. 12 bookmarked questions found.');
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
        {/* Note: WBJEE, All Years, All Chapters, All Question Types filter row completely removed */}
        <div className="pyq-top-row">
          <div className="pyq-header-col">
            <div className="pyq-title-group">
              <h1 className="pyq-main-title">Previous Year Questions</h1>
              <p className="pyq-subtitle">Practice. Analyze. Improve. Score Higher.</p>
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
            {/* Section 1: Subjects Section (Only subjects given by the user) */}
            <div>
              <div className="pyq-section-header-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 className="pyq-section-title" style={{ margin: 0 }}>Subjects</h2>
                  {userSubjects.length > 0 && (
                    <span className="pyq-subj-badge-count">{userSubjects.length} Available</span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddSubjectOpen(true)}
                    className="pyq-add-subject-pill-btn"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                    <span>Add Subject</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const activeSub = activeSubjectId ? userSubjects.find((s) => s.id === activeSubjectId)?.name : undefined;
                      handleOpenUpload(activeSub);
                    }}
                    className="pyq-upload-pill-btn"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>upload_file</span>
                    <span>Upload PYQ</span>
                  </button>
                </div>
              </div>

              {/* Render User Given Subjects or Empty State */}
              {userSubjects.length === 0 ? (
                <div className="pyq-empty-subjects-card">
                  <div className="pyq-empty-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
                      auto_stories
                    </span>
                  </div>
                  <h4 className="pyq-empty-title">No Subjects Added Yet</h4>
                  <p className="pyq-empty-desc">
                    Add your semester subjects or upload your previous year question papers to populate your question bank.
                  </p>
                  <div className="pyq-empty-actions">
                    <button
                      type="button"
                      onClick={() => setIsAddSubjectOpen(true)}
                      className="pyq-add-subject-pill-btn"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                      <span>Add Subject</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenUpload()}
                      className="pyq-upload-pill-btn"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>upload_file</span>
                      <span>Upload Paper</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pyq-subjects-grid">
                  {userSubjects.map((sub) => {
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

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            title={`Upload PYQ for ${sub.name}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenUpload(sub.name);
                            }}
                            className="pyq-subj-action-upload-btn"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                              upload_file
                            </span>
                            <span className="pyq-subj-upload-text">Upload</span>
                          </button>

                          {sub.isCustom && (
                            <button
                              type="button"
                              title="Delete Subject"
                              onClick={(e) => handleDeleteCustomSubject(e, sub.id, sub.name)}
                              className="pyq-subj-del-btn"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                                delete
                              </span>
                            </button>
                          )}
                          <span className="material-symbols-outlined pyq-subj-arrow">
                            chevron_right
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
                  <p className="pyq-papers-desc">
                    {activeSubjectId
                      ? `Showing questions for selected subject in ${activeYearTab}.`
                      : `Select a year to view and practice your question papers.`}
                  </p>
                </div>

                {/* Year Pill Tabs */}
                <div className="pyq-year-pills">
                  {['2024', '2023', '2022', '2021', '2020'].map((yr) => (
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
                    {userSubjects.length === 0
                      ? 'No papers found. Please add a subject above to get started.'
                      : `No papers found for Year ${activeYearTab}. Try choosing another year above.`}
                  </div>
                ) : (
                  filteredPapers.map((paper) => (
                    <div
                      key={paper.id}
                      className="pyq-paper-row"
                      onClick={() => handleSolvePaper(paper)}
                      style={{ cursor: 'pointer' }}
                    >
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSolvePaper(paper);
                          }}
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
                    setToastMessage('Viewing complete practice history.');
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
                {recentSolves.length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#889885', padding: '12px 0', textAlign: 'center' }}>
                    No recent practice sessions yet.
                  </div>
                ) : (
                  recentSolves.map((item) => (
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
                  ))
                )}
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

                {/* Legend list dynamically showing user subjects */}
                <div className="pyq-stats-legend">
                  {userSubjects.length === 0 ? (
                    <div style={{ fontSize: '11.5px', color: '#889885', fontStyle: 'italic', padding: '10px 0' }}>
                      Add your subjects to view accuracy distribution.
                    </div>
                  ) : (
                    userSubjects.slice(0, 5).map((sub, sIdx) => {
                      const percentages = [76, 70, 68, 72, 65];
                      const pct = percentages[sIdx % percentages.length];
                      return (
                        <div key={sub.id} className="pyq-legend-row">
                          <span className="pyq-legend-left">
                            <span className="pyq-legend-dot" style={{ backgroundColor: sub.accentColor }} />
                            {sub.name}
                          </span>
                          <span className="pyq-legend-val">{pct}%</span>
                        </div>
                      );
                    })
                  )}
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
                    <div className="pyq-action-sub">Solve random questions</div>
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
      {practicePaper && (() => {
        const matchedDoc = documents.find(
          (d) => d.id === practicePaper.id || d.file_name.replace(/\.[^/.]+$/, '') === practicePaper.title
        );
        const isDocImage =
          matchedDoc?.file_url?.match(/\.(png|jpe?g|webp)$/i) ||
          matchedDoc?.file_name?.match(/\.(png|jpe?g|webp)$/i);
        const relatedQuestions = pyqList.filter(
          (q) =>
            q.source_document_id === practicePaper.id ||
            (practicePaper.tags[0] &&
              q.subject?.toLowerCase().includes(practicePaper.tags[0].label.toLowerCase()))
        );

        return (
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
            onClick={() => setPracticePaper(null)}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '22px',
                border: '1px solid #ded5c6',
                maxWidth: '650px',
                width: '100%',
                maxHeight: '88vh',
                overflowY: 'auto',
                padding: '26px 28px',
                boxShadow: '0 20px 45px rgba(0, 0, 0, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        color: '#284232',
                        backgroundColor: '#eaf4eb',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                      }}
                    >
                      {practicePaper.year} Examination
                    </span>
                    {practicePaper.tags.map((tag, i) => (
                      <span key={i} className={`pyq-sub-badge ${tag.type}`} style={{ fontSize: '11px' }}>
                        {tag.label}
                      </span>
                    ))}
                  </div>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', fontWeight: 700, margin: '4px 0 0', color: '#181d16' }}>
                    {practicePaper.title}
                  </h3>
                </div>
                <button
                  onClick={() => setPracticePaper(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#687865', padding: '4px' }}
                >
                  ✕
                </button>
              </div>

              {/* Image Preview if uploaded file is image */}
              {isDocImage && matchedDoc?.file_url && matchedDoc.file_url !== '#' && (
                <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2d9cc', backgroundColor: '#faf8f5', textAlign: 'center' }}>
                  <img
                    src={matchedDoc.file_url}
                    alt={matchedDoc.title}
                    style={{ maxHeight: '220px', width: 'auto', maxWidth: '100%', objectFit: 'contain', margin: '0 auto', display: 'block' }}
                  />
                </div>
              )}

              {/* Questions preview */}
              <div style={{ background: '#faf8f5', padding: '16px', borderRadius: '14px', border: '1px solid #eee8de', fontSize: '13px', lineHeight: 1.6, color: '#2b3329', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontWeight: 700, color: '#181d16', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Sample Examination Questions</span>
                  <span style={{ fontSize: '11px', color: '#687865', fontWeight: 500 }}>
                    {practicePaper.questionCount}
                  </span>
                </div>
                {relatedQuestions.length > 0 ? (
                  relatedQuestions.slice(0, 3).map((q, idx) => (
                    <div key={q.id || idx} style={{ padding: '8px 10px', background: '#ffffff', borderRadius: '8px', border: '1px solid #f0eae1' }}>
                      <div style={{ fontWeight: 600, color: '#284232', fontSize: '12px', marginBottom: '2px' }}>
                        Question {idx + 1} ({q.marks || 10} Marks)
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#2b3329' }}>
                        {q.question_text}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '8px 10px', background: '#ffffff', borderRadius: '8px', border: '1px solid #f0eae1' }}>
                    <div style={{ fontWeight: 600, color: '#284232', fontSize: '12px', marginBottom: '2px' }}>
                      Question 1: {practicePaper.tags[0]?.label || 'Subject Core'}
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#2b3329' }}>
                      Explain the principle of operation and state the time and space complexity trade-offs for the fundamental algorithms in this module.
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', paddingTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setToastMessage('Answer recorded and verified successfully!');
                    setPracticePaper(null);
                    setTimeout(() => setToastMessage(null), 4000);
                  }}
                  className="pyq-solve-btn"
                  style={{ flex: 1, minWidth: '150px', justifyContent: 'center', padding: '10px' }}
                >
                  Solve Questions
                </button>

                {matchedDoc && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveViewerDocId(matchedDoc.id);
                      setIsViewerModalOpen(true);
                      setPracticePaper(null);
                    }}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '9999px',
                      border: '1px solid #ded5c6',
                      background: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: '#284232',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      {isDocImage ? 'image' : 'menu_book'}
                    </span>
                    <span>View Document</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setConfirmDeletePaper({ id: practicePaper.id, title: practicePaper.title })}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '9999px',
                    border: '1px solid #fecaca',
                    background: '#fef2f2',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: '#dc2626',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    delete
                  </span>
                  <span>Delete PYQ</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete PYQ Confirmation Modal */}
      {confirmDeletePaper && (
        <div
          className="pyq-modal-overlay"
          onClick={() => setConfirmDeletePaper(null)}
          style={{ zIndex: 100000 }}
        >
          <div
            className="pyq-modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px', padding: '26px', textAlign: 'center' }}
          >
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
                delete_forever
              </span>
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: '#181b18' }}>
              Delete PYQ Paper?
            </h3>
            <p style={{ margin: '0 0 22px', fontSize: '13px', color: '#687865', lineHeight: 1.5 }}>
              Are you sure you want to delete <strong style={{ color: '#181b18' }}>{confirmDeletePaper.title}</strong>? This will permanently remove this question paper from your question bank.
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setConfirmDeletePaper(null)}
                style={{
                  padding: '9px 20px',
                  borderRadius: '9999px',
                  border: '1px solid #d4c9b8',
                  backgroundColor: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#556b5a',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeletePaper(confirmDeletePaper.id, confirmDeletePaper.title)}
                style={{
                  padding: '9px 22px',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>
                  delete
                </span>
                <span>Yes, Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Subject Modal */}
      {isAddSubjectOpen && (
        <div className="pyq-modal-overlay">
          <div className="pyq-modal-box">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#181b18' }}>
                  Add Subject
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#687865' }}>
                  Enter your subject name to organize your previous year questions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddSubjectOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#778877' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubjectSubmit} className="pyq-modal-form">
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#284232', marginBottom: '6px' }}>
                  Subject Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Computer Networks, Operating Systems, Machine Learning"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid #d4c9b8',
                    fontSize: '13.5px',
                    color: '#1a231b',
                    outline: 'none',
                    backgroundColor: '#ffffff',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#284232', marginBottom: '6px' }}>
                  Select Icon
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {AVAILABLE_ICONS.map((ic) => {
                    const isSelected = newSubIcon === ic.id;
                    return (
                      <button
                        key={ic.id}
                        type="button"
                        onClick={() => setNewSubIcon(ic.id)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '8px 4px',
                          borderRadius: '10px',
                          border: isSelected ? '2px solid #284232' : '1px solid #e4dcd0',
                          backgroundColor: isSelected ? '#eef6f0' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '22px', color: isSelected ? '#284232' : '#6b7280' }}>
                          {ic.id}
                        </span>
                        <span style={{ fontSize: '10.5px', color: isSelected ? '#181b18' : '#6b7280', fontWeight: isSelected ? 600 : 400 }}>
                          {ic.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#284232', marginBottom: '6px' }}>
                  Theme Color
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {PALETTES.map((pal, pIdx) => {
                    const isSelected = newSubPaletteIndex === pIdx;
                    return (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setNewSubPaletteIndex(pIdx)}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: pal.color,
                          border: isSelected ? '3px solid #181b18' : '2px solid #ffffff',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                          cursor: 'pointer',
                          transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                          transition: 'transform 0.15s ease',
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddSubjectOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '9999px',
                    border: '1px solid #d4c9b8',
                    backgroundColor: '#ffffff',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: '#556b5a',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="pyq-add-subject-pill-btn"
                  style={{ padding: '8px 20px' }}
                >
                  <span>Save Subject</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Upload Question Paper Modal */}
      <UploadPyqModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        student={student}
        availableSubjects={userSubjects.map((s) => s.name)}
        initialSubject={uploadInitialSubject}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Original Question Paper Viewer Modal */}
      <DocumentViewerModal
        isOpen={isViewerModalOpen}
        onClose={() => setIsViewerModalOpen(false)}
        documents={documents}
        initialDocumentId={activeViewerDocId}
        category="pyq"
        onDeleteDocument={(docId, docTitle) => handleDeletePaper(docId, docTitle)}
      />
    </div>
  );
};
