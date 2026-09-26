import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../api/client';
import type { OriginalDocument, Student, SyllabusEntry } from '../types';
import { getDocumentsForStudent } from '../data/documentsData';
import { INITIAL_CURRICULUM_DATA } from '../data/curriculumData';
import { getPresetForSubject, DSA_CHAPTERS, type ChapterItem, type TopicItem } from '../data/subjectPresets';
import { UploadSyllabusModal } from '../components/UploadSyllabusModal';
import { DocumentViewerModal } from '../components/DocumentViewerModal';
import { aiCollegeScraper, deriveCollegeNameFromUrl } from '../services/aiCollegeScraper';
import '../styles/SyllabusPage.css';

interface SubjectItem {
  id: string;
  name: string;
  chapterCount: number;
  icon: string;
  accentColor: string;
  accentBg: string;
  chapters: ChapterItem[];
}

// Helper to format semester ordinal suffix: 1 -> 1st, 2 -> 2nd, 3 -> 3rd, 4 -> 4th
function formatSemesterLabel(sem: string | number): string {
  const s = parseInt(String(sem), 10);
  if (s === 1) return '1st';
  if (s === 2) return '2nd';
  if (s === 3) return '3rd';
  if (s >= 4 && s <= 8) return `${s}th`;
  return `${sem}th`;
}

// Visual icons and color themes for different curriculum subject domains
function getSubjectStyling(name: string): { icon: string; accentColor: string; accentBg: string } {
  const s = name.toLowerCase();
  if (s.includes('data structure') || s.includes('algorithm')) {
    return { icon: 'database', accentColor: '#10b981', accentBg: '#d1fae5' };
  }
  if (s.includes('artificial intelligence') || s.includes('ai') || s.includes('machine learning') || s.includes('deep learning')) {
    return { icon: 'psychology', accentColor: '#8b5cf6', accentBg: '#ede9fe' };
  }
  if (s.includes('digital logic') || s.includes('computer organization') || s.includes('architecture') || s.includes('hardware')) {
    return { icon: 'memory', accentColor: '#06b6d4', accentBg: '#cffafe' };
  }
  if (s.includes('math') || s.includes('discrete') || s.includes('probability') || s.includes('statistics')) {
    return { icon: 'calculate', accentColor: '#f59e0b', accentBg: '#fef3c7' };
  }
  if (s.includes('chemistry') || s.includes('physics') || s.includes('science')) {
    return { icon: 'science', accentColor: '#ec4899', accentBg: '#fce7f3' };
  }
  if (s.includes('constitution') || s.includes('ethics') || s.includes('law')) {
    return { icon: 'gavel', accentColor: '#6366f1', accentBg: '#e0e7ff' };
  }
  if (s.includes('design thinking') || s.includes('innovation') || s.includes('workshop')) {
    return { icon: 'lightbulb', accentColor: '#f97316', accentBg: '#ffedd5' };
  }
  if (s.includes('operating system') || s.includes('os')) {
    return { icon: 'settings', accentColor: '#2563eb', accentBg: '#dbeafe' };
  }
  if (s.includes('network') || s.includes('web') || s.includes('internet')) {
    return { icon: 'language', accentColor: '#9333ea', accentBg: '#f3e8ff' };
  }
  if (s.includes('database') || s.includes('dbms')) {
    return { icon: 'storage', accentColor: '#14b8a6', accentBg: '#ccfbf1' };
  }
  if (s.includes('oop') || s.includes('programming') || s.includes('java') || s.includes('python')) {
    return { icon: 'code', accentColor: '#3b82f6', accentBg: '#dbeafe' };
  }
  if (s.includes('lab') || s.includes('practical')) {
    return { icon: 'biotech', accentColor: '#059669', accentBg: '#d1fae5' };
  }
  return { icon: 'auto_stories', accentColor: '#284232', accentBg: '#eaf4eb' };
}

function cleanBoilerplate(text: string): string {
  return text
    .replace(/R\d+\s*\([^)]*\)\s*Department:[^•\n\r]*/gi, '')
    .replace(/Curriculum Structure & Syllabus[^•\n\r]*/gi, '')
    .replace(/\(Effective from \d{4}-\d{2}[^)]*\)/gi, '')
    .replace(/\bCO\s+PO\b/gi, '')
    .replace(/Category:\s*(Theory|Practical)[^•\n\r]*/gi, '')
    .replace(/Credits:\s*[\d\.]+/gi, '')
    .replace(/Contact Hours:[^•\n\r]*/gi, '')
    .replace(/Officially approved curriculum[^•\n\r]*/gi, '')
    .replace(/^\[[A-Za-z0-9_-]+\]\s*/, '')
    .replace(/\s*\(\d+\s*L\)/i, '')
    .replace(/\s*\[\d+\s*L\]/i, '')
    .replace(/[:\s]+$/, '')
    .trim();
}

// Convert SyllabusEntry records for a subject into structured ChapterItems and TopicItems
function buildChaptersFromSubjectEntries(subjectName: string, entries: SyllabusEntry[]): ChapterItem[] {
  // First check if we have a pristine curated preset for this subject
  const preset = getPresetForSubject(subjectName);
  if (preset) {
    return preset;
  }

  const moduleEntries = entries.filter(
    (e) => !e.topic_title.toLowerCase().includes('course blueprint')
  );
  const targetEntries = moduleEntries.length > 0 ? moduleEntries : entries;

  // Deduplicate entries by normalized title to prevent repeating modules
  const seenTitles = new Set<string>();
  const dedupedEntries = targetEntries.filter((e) => {
    const norm = e.topic_title.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seenTitles.has(norm)) return false;
    seenTitles.add(norm);
    return true;
  });

  return dedupedEntries.map((e, idx) => {
    let rawTitle = e.topic_title
      .replace(/^\[[A-Za-z0-9_-]+\]\s*/, '')
      .replace(/\s*\(\d+\s*L\)/i, '')
      .replace(/\s*\[\d+\s*L\]/i, '')
      .replace(/[:\s]+$/, '')
      .trim();

    // If title is bare like "Module 1" or "Module I", enrich it from the first line of the description
    if (/^Module\s+([0-9IVX]+|One|Two|Three|Four|Five|Six)\b/i.test(rawTitle) && rawTitle.length < 15) {
      const cleanedD = cleanBoilerplate(e.topic_description || '');
      const match = cleanedD.match(/^([A-Za-z0-9\s,\/&-]{4,45})[:\.\-•]/);
      if (match && match[1] && !match[1].toLowerCase().includes('category') && !match[1].toLowerCase().includes('module')) {
        rawTitle = `${rawTitle}: ${match[1].trim()}`;
      }
    }

    const isLab = subjectName.toLowerCase().includes('lab') || e.topic_title.toLowerCase().includes('lab');
    const cleanedDesc = cleanBoilerplate(e.topic_description || '');

    let subtopics: TopicItem[] = [];
    if (cleanedDesc) {
      let splitLines = cleanedDesc
        .split(/[•;\n]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 4 && !s.toLowerCase().startsWith('category:') && !s.toLowerCase().startsWith('credits:'));

      if (splitLines.length <= 1) {
        splitLines = cleanedDesc
          .split(/\.\s+(?=[A-Z0-9])/)
          .map((s) => s.replace(/\.$/, '').trim())
          .filter((s) => s.length > 4);
      }

      if (splitLines.length <= 1) {
        const commaSplit = cleanedDesc.split(/,\s+/).map((s) => s.trim()).filter((s) => s.length > 4);
        if (commaSplit.length >= 3) {
          splitLines = commaSplit;
        }
      }

      if (splitLines.length >= 2) {
        subtopics = splitLines.map((line, sIdx) => ({
          id: `t-${e.id || idx}-${sIdx + 1}`,
          title: line.replace(/^\d+[\.\)]\s*/, '').replace(/\s*\[\d+\s*L\]/i, '').replace(/[:\s]+$/, '').trim(),
          category: isLab ? 'practical' : 'theory',
          status: 'not-started',
        }));
      }
    }

    if (subtopics.length === 0) {
      subtopics = [
        {
          id: `t-${e.id || idx}-1`,
          title: cleanedDesc || `${rawTitle} - Fundamental Concepts & Architecture`,
          category: isLab ? 'practical' : 'theory',
          status: 'not-started',
        },
        {
          id: `t-${e.id || idx}-2`,
          title: `${rawTitle} - Applied Implementation & Analysis`,
          category: isLab ? 'practical' : 'theory',
          status: 'not-started',
        },
      ];
    }

    return {
      id: `ch-${e.id || idx}`,
      number: idx + 1,
      title: rawTitle || `Module ${idx + 1}`,
      category: isLab ? 'practical' : 'theory',
      topics: subtopics,
    };
  });
}

// Build subject list strictly filtered to the given semester
function buildSemesterSubjects(
  targetSem: string,
  targetBranch: string,
  allEntries: SyllabusEntry[]
): SubjectItem[] {
  const semStr = String(targetSem);
  const branchLower = targetBranch ? targetBranch.toLowerCase() : '';

  // Filter all entries that strictly belong to this semester (and match course/branch if present)
  const matching = allEntries.filter(
    (e) =>
      String(e.semester) === semStr &&
      (!branchLower || !e.course || e.course.toLowerCase() === branchLower)
  );

  const uniqueSubjectNames = Array.from(
    new Set(matching.map((e) => e.subject).filter(Boolean))
  );

  if (uniqueSubjectNames.length > 0) {
    return uniqueSubjectNames.map((name, idx) => {
      const entriesForSubj = matching.filter((e) => e.subject === name);
      const styling = getSubjectStyling(name);
      const chapters = buildChaptersFromSubjectEntries(name, entriesForSubj);
      return {
        id: `sub-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${idx}`,
        name,
        chapterCount: chapters.length,
        icon: styling.icon,
        accentColor: styling.accentColor,
        accentBg: styling.accentBg,
        chapters,
      };
    });
  }

  // Fallback defaults per semester if database is empty for this semester
  const fallbackBySem: Record<string, string[]> = {
    '1': [
      'Mathematics–I (Calculus & Linear Algebra)',
      'Engineering Physics',
      'Basic Electrical Engineering',
      'Programming for Problem Solving (C)',
      'Engineering Graphics & Design',
    ],
    '2': [
      'Data structure and Algorithms',
      'Introduction to Artificial Intelligence',
      'Digital Logic and Computer Organization',
      'Engineering Mathematics–II',
      'Engineering Chemistry',
      'Constitution of India & Professional Ethics',
      'Design Thinking & Innovation',
    ],
    '3': [
      'Computer Architecture',
      'Design and Analysis of Algorithms',
      'Operating Systems',
      'Advanced Artificial Intelligence',
      'Internet of Things',
      'Discrete Mathematics',
    ],
    '4': [
      'Database Management Systems',
      'Computer Networks',
      'Machine Learning',
      'Formal Language and Automata Theory',
      'Probability and Statistics',
    ],
    '5': [
      'Software Engineering',
      'Compiler Design',
      'Microprocessors & Microcontrollers',
      'Information Theory & Coding',
      'Cloud Computing',
    ],
    '6': [
      'Web and Internet Technology',
      'Deep Learning',
      'Image Processing',
      'Cloud Computing',
      'Big Data and Data Analytics',
      'Natural Language Processing',
    ],
    '7': [
      'Distributed Systems',
      'Internet of Things (IoT)',
      'Cyber Security & Cryptography',
      'High Performance Computing',
    ],
    '8': [
      'Quantum Computing',
      'Neural Networks & Deep Learning',
      'Capstone System Design',
    ],
  };

  const subjectNames = fallbackBySem[semStr] || fallbackBySem['2'];
  return subjectNames.map((name, idx) => {
    const styling = getSubjectStyling(name);
    const chapters = buildChaptersFromSubjectEntries(name, []);
    return {
      id: `sub-fb-${idx}`,
      name,
      chapterCount: chapters.length,
      icon: styling.icon,
      accentColor: styling.accentColor,
      accentBg: styling.accentBg,
      chapters,
    };
  });
}

interface SyllabusPageProps {
  student: Student;
}

export const SyllabusPage: React.FC<SyllabusPageProps> = ({ student }) => {
  const initialBranch = student.branch || student.course || 'CSE';
  const initialSem = String(student.semester || '2');

  const [branch, setBranch] = useState(initialBranch);
  const [semester, setSemester] = useState(initialSem);

  const [_syllabusList, setSyllabusList] = useState<SyllabusEntry[]>([]);
  const [documents, setDocuments] = useState<OriginalDocument[]>(() =>
    getDocumentsForStudent(student)
  );

  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string | null>(null);

  // Active Subject & Chapter selection strictly for this semester
  const [subjectsList, setSubjectsList] = useState<SubjectItem[]>(() =>
    buildSemesterSubjects(initialSem, initialBranch, INITIAL_CURRICULUM_DATA)
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(() => {
    const initialList = buildSemesterSubjects(initialSem, initialBranch, INITIAL_CURRICULUM_DATA);
    return initialList.length > 0 ? initialList[0].id : '';
  });
  const [selectedChapterId, setSelectedChapterId] = useState<string>(() => {
    const initialList = buildSemesterSubjects(initialSem, initialBranch, INITIAL_CURRICULUM_DATA);
    return initialList[0]?.chapters[0]?.id || '';
  });

  // Topic status toggle state map
  const [topicStatusMap, setTopicStatusMap] = useState<Record<string, 'completed' | 'in-progress' | 'not-started'>>(() => {
    try {
      const stored = localStorage.getItem('exambuddy_topic_statuses');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    const initial: Record<string, 'completed' | 'in-progress' | 'not-started'> = {};
    const initialList = buildSemesterSubjects(initialSem, initialBranch, INITIAL_CURRICULUM_DATA);
    initialList.forEach((sub) => {
      sub.chapters.forEach((ch) => {
        ch.topics.forEach((t) => {
          initial[t.id] = t.status;
        });
      });
    });
    return initial;
  });

  // Search term
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);
  const [activeViewerDocId, setActiveViewerDocId] = useState<string | undefined>(undefined);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Priority: student.college_url > localStorage > empty
  const initialCollegeUrl = student.college_url || localStorage.getItem('exambuddy_college_url') || '';
  const initialCollegeName = deriveCollegeNameFromUrl(initialCollegeUrl, student.college_name);
  const [activeCollegeName, setActiveCollegeName] = useState<string>(initialCollegeName);

  // Sync state whenever student updates
  useEffect(() => {
    const curUrl = student.college_url || localStorage.getItem('exambuddy_college_url') || '';
    if (curUrl) {
      const derived = deriveCollegeNameFromUrl(curUrl, student.college_name);
      setActiveCollegeName(derived);
    }
    setDocuments(getDocumentsForStudent(student));

    const curBranch = student.branch || student.course || 'CSE';
    const curSem = String(student.semester || '2');
    setBranch(curBranch);
    setSemester(curSem);
  }, [student.college_url, student.college_name, student.branch, student.course, student.semester]);

  // Handle subject selection navigation from Dashboard
  useEffect(() => {
    try {
      const navSubj = sessionStorage.getItem('exambuddy_selected_subject');
      if (navSubj && subjectsList.length > 0) {
        sessionStorage.removeItem('exambuddy_selected_subject');
        const cleanNav = navSubj.toLowerCase().replace(/[^a-z0-9]/g, '');
        const match = subjectsList.find((s) => {
          const sNorm = s.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          return sNorm === cleanNav || sNorm.includes(cleanNav) || cleanNav.includes(sNorm);
        });
        if (match) {
          setSelectedSubjectId(match.id);
          if (match.chapters.length > 0) {
            setSelectedChapterId(match.chapters[0].id);
          }
        }
      }
    } catch {
      // ignore
    }
  }, [subjectsList]);

  const loadData = async (targetCourse = branch, targetSem = semester) => {
    setLoading(true);
    try {
      const data = await api.getSyllabus(
        student.college_id,
        targetCourse,
        targetSem
      );

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

      // Deduplicate with INITIAL_CURRICULUM_DATA by signature so entries never duplicate
      const existingSignatures = new Set(
        combined.map((e) => `${(e.subject || '').trim().toLowerCase()}:::${(e.topic_title || '').trim().toLowerCase()}`)
      );

      const missingInitials = INITIAL_CURRICULUM_DATA.filter((e) => {
        if (String(e.semester) !== String(targetSem)) return false;
        const sig = `${(e.subject || '').trim().toLowerCase()}:::${(e.topic_title || '').trim().toLowerCase()}`;
        return !existingSignatures.has(sig);
      });

      const allEntries = [...combined, ...missingInitials];
      setSyllabusList(allEntries);

      // Rebuild the subjects list strictly for this semester!
      const semesterSubjects = buildSemesterSubjects(targetSem, targetCourse, allEntries);
      if (semesterSubjects.length > 0) {
        setSubjectsList(semesterSubjects);
        setSelectedSubjectId((prevId) => {
          const exists = semesterSubjects.some((s) => s.id === prevId);
          return exists ? prevId : semesterSubjects[0].id;
        });
        setSelectedChapterId((prevChId) => {
          const curSub = semesterSubjects.find((s) => s.id === selectedSubjectId) || semesterSubjects[0];
          const exists = curSub.chapters.some((c) => c.id === prevChId);
          return exists ? prevChId : (curSub.chapters[0]?.id || '');
        });
      }
    } catch {
      const fallbackList = buildSemesterSubjects(targetSem, targetCourse, INITIAL_CURRICULUM_DATA);
      setSubjectsList(fallbackList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(branch, semester);
  }, [semester, branch]);

  const handleDiscoverSyllabus = async () => {
    setSearching(true);
    setSearchStatus('Connecting to college portal & searching curriculum blueprints...');
    try {
      const rawTarget = student.college_url || localStorage.getItem('exambuddy_college_url') || '';
      if (rawTarget) {
        await aiCollegeScraper.scrapeAndSyncCollege({
          collegeUrl: rawTarget,
          collegeName: activeCollegeName,
          course: student.course || 'B.Tech',
          branch,
          semester: Number(semester),
        }).catch(() => null);
      }

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
    } catch (err: unknown) {
      setSearchStatus(`Search failed: ${err instanceof Error ? err.message : 'Could not find syllabus PDF for this course/semester.'}`);
    } finally {
      setSearching(false);
    }
  };

  const handleUploadSuccess = (newEntries: SyllabusEntry[], newDoc: OriginalDocument) => {
    setSyllabusList((prev) => [...newEntries, ...prev]);
    setDocuments((prev) => [newDoc, ...prev]);
    setActionMessage(`Successfully uploaded & imported ${newEntries.length} topics from "${newDoc.file_name}" into database!`);
    loadData(branch, semester);
  };

  const activeSylDoc =
    documents.find((d) => d.type === 'syllabus' && (d.semester === semester || d.semester?.includes(semester))) ||
    documents.find((d) => d.type === 'syllabus') ||
    documents[0];

  // Currently active subject
  const currentSubject: SubjectItem =
    subjectsList.find((s) => s.id === selectedSubjectId) ||
    subjectsList[0] || {
      id: 'sub-dsa',
      name: 'Data structure and Algorithms',
      chapterCount: DSA_CHAPTERS.length,
      icon: 'database',
      accentColor: '#10b981',
      accentBg: '#d1fae5',
      chapters: DSA_CHAPTERS,
    };

  // Active chapter
  const currentChapter: ChapterItem =
    currentSubject.chapters?.find((c) => c.id === selectedChapterId) ||
    currentSubject.chapters?.[0] || {
      id: 'default',
      number: 1,
      title: 'General Overview',
      topics: [],
    };

  // Toggle status: not-started -> in-progress -> completed -> not-started
  const handleToggleTopic = (topicId: string) => {
    setTopicStatusMap((prev) => {
      const cur = prev[topicId] || 'not-started';
      const next: 'completed' | 'in-progress' | 'not-started' =
        cur === 'not-started'
          ? 'in-progress'
          : cur === 'in-progress'
          ? 'completed'
          : 'not-started';
      const updated: Record<string, 'completed' | 'in-progress' | 'not-started'> = {
        ...prev,
        [topicId]: next,
      };
      try {
        localStorage.setItem('exambuddy_topic_statuses', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Mark all topics in current chapter as completed
  const handleMarkChapterCompleted = () => {
    if (!currentChapter) return;
    setTopicStatusMap((prev) => {
      const updated = { ...prev };
      currentChapter.topics.forEach((t) => {
        updated[t.id] = 'completed';
      });
      try {
        localStorage.setItem('exambuddy_topic_statuses', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
    setActionMessage(`All topics in "${currentChapter.title}" marked as completed!`);
    setTimeout(() => setActionMessage(null), 3500);
  };

  // Quick Action: Download Full Syllabus
  const handleDownloadFullSyllabus = () => {
    const url = activeSylDoc?.file_url || '/syllabus/B.Tech_CSE_R23_Curriculum_and_Syllabus.pdf';
    window.open(url, '_blank');
  };

  // Quick Action: Create Plan
  const handleCreatePlan = () => {
    setActionMessage(`AI Study Plan generated: 14 days allocated for ${currentSubject.name}! Check Study Report for milestones.`);
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Quick Action: Set Goal
  const handleSetGoal = () => {
    setActionMessage(`Weekly Goal Set: Complete 5 topics in ${currentSubject.name} by this Sunday!`);
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Calculate subject progress and donut chart counts
  const allCurrentSubjectTopics = useMemo(() => {
    const list: TopicItem[] = [];
    currentSubject.chapters.forEach((ch) => {
      ch.topics.forEach((t) => {
        list.push({ ...t, status: topicStatusMap[t.id] || t.status });
      });
    });
    return list;
  }, [currentSubject, topicStatusMap]);

  // If this subject is Data Structures and has 30 topics represented, use real counts
  const completedCount = allCurrentSubjectTopics.filter((t) => t.status === 'completed').length;
  const inProgressCount = allCurrentSubjectTopics.filter((t) => t.status === 'in-progress').length;
  const notStartedCount = allCurrentSubjectTopics.filter((t) => t.status === 'not-started').length;
  const totalCount = allCurrentSubjectTopics.length || 30;

  const subjectProgressPercent = Math.round((completedCount / totalCount) * 100);

  // Active chapter progress
  const chapterTopicsWithStatus = useMemo(() => {
    return currentChapter.topics.map((t) => ({
      ...t,
      status: topicStatusMap[t.id] || t.status,
    }));
  }, [currentChapter, topicStatusMap]);

  const chapterCompleted = chapterTopicsWithStatus.filter((t) => t.status === 'completed').length;
  const chapterProgressPercent = chapterTopicsWithStatus.length
    ? Math.round((chapterCompleted / chapterTopicsWithStatus.length) * 100)
    : 0;

  // Filtered chapters for left sub-column based on search
  const filteredChapters = useMemo(() => {
    const seenTitles = new Set<string>();
    return currentSubject.chapters.filter((ch) => {
      // Deduplicate by clean title so same module never repeats
      const norm = ch.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (seenTitles.has(norm)) return false;
      seenTitles.add(norm);

      return (
        ch.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ch.topics.some((t) => t.title.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
  }, [currentSubject, searchTerm]);

  // Donut SVG circumference math (r = 38, C = 2 * PI * 38 ≈ 238.76)
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const completedRatio = completedCount / totalCount;
  const inProgressRatio = inProgressCount / totalCount;

  const completedStroke = completedRatio * circumference;
  const inProgressStroke = inProgressRatio * circumference;

  return (
    <div className="sb-page-container">
      {/* Botanical Corner Leaf Watermark */}
      <div className="sb-leaf-watermark">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', opacity: 0.35 }}>
          <path d="M20 180 C 40 140, 80 110, 150 90 C 130 110, 90 150, 60 170 Z" fill="#284232" opacity="0.3" />
          <path d="M50 140 C 70 100, 120 70, 180 50 C 160 80, 120 120, 80 140 Z" fill="#284232" opacity="0.25" />
          <path d="M10 190 Q 70 130 160 80" stroke="#284232" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
        </svg>
      </div>

      <div className="sb-content-wrap">
        {/* ================= HEADER SECTION ================= */}
        <div className="sb-header-row">
          <div className="sb-title-group">
            <div className="sb-title-with-badge">
              <h1 className="sb-main-title">Syllabus</h1>
              <span className="sb-header-sem-tag">{branch} {formatSemesterLabel(semester)} sem syllabus</span>
            </div>
            <p className="sb-subtitle">Know what to study. Plan better. Stay on track.</p>
          </div>

          <div className="sb-header-actions">
            <button
              type="button"
              onClick={() => {
                setActiveViewerDocId(activeSylDoc?.id);
                setIsViewerModalOpen(true);
              }}
              className="sb-btn-outline"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#284232' }}>
                menu_book
              </span>
              <span>View Original Regulations</span>
            </button>

            <a
              href={activeSylDoc?.file_url || '/syllabus/B.Tech_CSE_R23_Curriculum_and_Syllabus.pdf'}
              target="_blank"
              rel="noreferrer"
              className="sb-btn-outline"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#284232' }}>
                open_in_new
              </span>
              <span>Open PDF</span>
            </a>

            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="sb-btn-primary"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                upload_file
              </span>
              <span>Upload Syllabus</span>
            </button>
          </div>
        </div>

        {/* Secondary Sub-Header: Badges & Portal Auto-Discovery */}
        <div className="sb-sub-header-row">
          <div className="sb-curriculum-badge">
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#284232' }}>
              description
            </span>
            <span style={{ fontWeight: 600 }}>Automated Curriculum Search</span>
            <span style={{ color: '#687865', margin: '0 4px' }}>•</span>
            <span>{activeCollegeName ? `${activeCollegeName} • ` : ''}{branch} • Semester {semester}</span>
          </div>

          <button
            type="button"
            onClick={handleDiscoverSyllabus}
            disabled={searching}
            className="sb-auto-discover-btn"
          >
            {searching ? (
              <>
                <div style={{ width: '14px', height: '14px', border: '2px solid #284232', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <span>Extracting Portal Data...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#284232' }}>
                  travel_explore
                </span>
                <span>Auto-Discover from Portal</span>
              </>
            )}
          </button>
        </div>

        {/* Live Search or Action Notification Banner */}
        {(searchStatus || actionMessage) && (
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
              <span>{actionMessage || searchStatus}</span>
            </div>
            <button
              onClick={() => {
                setSearchStatus(null);
                setActionMessage(null);
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#556b5a' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
            </button>
          </div>
        )}

        {/* ================= SUBJECT CARDS CAROUSEL ================= */}
        <div className="sb-subjects-slider">
          {subjectsList.map((subject) => {
            const isActive = subject.id === selectedSubjectId;
            return (
              <div
                key={subject.id}
                onClick={() => {
                  setSelectedSubjectId(subject.id);
                  if (subject.chapters.length > 0) {
                    setSelectedChapterId(subject.chapters[0].id);
                  }
                }}
                className={`sb-subject-card ${isActive ? 'active' : ''}`}
              >
                <div
                  className="sb-subj-icon-box"
                  style={{
                    backgroundColor: subject.accentBg,
                    color: subject.accentColor,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    {subject.icon}
                  </span>
                </div>
                <div className="sb-subj-text">
                  <span className="sb-subj-name">{subject.name}</span>
                  <span className="sb-subj-chapters">{subject.chapterCount} Chapters</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ================= MAIN 2-COLUMN WORKSPACE ================= */}
        <div className="sb-main-grid">
          {/* Left Wide Card: Subject Syllabus & Topic Explorer */}
          <div className="sb-main-card">
            {/* Subject Headbar inside Left Card */}
            <div className="sb-subject-headbar">
              <div className="sb-subject-title-box">
                <h2 className="sb-subject-headline">{currentSubject.name} Syllabus</h2>
                <p className="sb-subject-desc">
                  Complete syllabus with topics and progress tracking.
                </p>
              </div>

              <div className="sb-subject-controls">
                {/* Overall Progress Bar */}
                <div className="sb-progress-group">
                  <div className="sb-progress-label-row">
                    <span>Overall Progress</span>
                    <span style={{ fontWeight: 700, color: '#181d16' }}>{subjectProgressPercent}%</span>
                  </div>
                  <div className="sb-progress-track">
                    <div
                      className="sb-progress-bar-fill"
                      style={{ width: `${subjectProgressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Dynamic Semester Badge */}
                <div className="sb-sem-badge-pill">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#284232' }}>
                    school
                  </span>
                  <span>{branch} {formatSemesterLabel(semester)} sem syllabus</span>
                </div>
              </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            {loading && (
              <div style={{ padding: '2px 0', fontSize: '11px', color: '#687865', fontStyle: 'italic' }}>
                Syncing syllabus from {activeCollegeName || 'college database'}...
              </div>
            )}
            {/* Search Bar */}
            <div className="sb-filter-bar" style={{ justifyContent: 'flex-end', borderBottom: 'none', paddingBottom: '4px' }}>
              <div className="sb-search-box">
                <span className="material-symbols-outlined sb-search-icon" style={{ fontSize: '18px' }}>
                  search
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search topics, modules..."
                  className="sb-search-input"
                />
              </div>
            </div>

            {/* Split Sub-Columns: Chapters & Topics */}
            <div className="sb-split-columns">
              {/* Left Sub-Column: Chapters List */}
              <div className="sb-chapters-list">
                {filteredChapters.map((chapter, cIdx) => {
                  const isChActive = chapter.id === selectedChapterId;
                  const cleanTitle = chapter.title.replace(/^\d+[\.\)]\s*/, '').replace(/[:\s]+$/, '');
                  return (
                    <button
                      key={chapter.id || `ch-${cIdx}`}
                      type="button"
                      onClick={() => setSelectedChapterId(chapter.id)}
                      className={`sb-chapter-item ${isChActive ? 'active' : ''}`}
                    >
                      <span>
                        {cIdx + 1}. {cleanTitle}
                      </span>
                      {isChActive && (
                        <span className="material-symbols-outlined sb-chapter-chevron">
                          chevron_right
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Right Sub-Column: Topics Checklist */}
              <div className="sb-topics-panel">
                <div className="sb-topics-header">
                  <h3 className="sb-topics-chapter-title">
                    {filteredChapters.findIndex((c) => c.id === currentChapter.id) !== -1
                      ? `${filteredChapters.findIndex((c) => c.id === currentChapter.id) + 1}. `
                      : ''}
                    {currentChapter.title.replace(/^\d+[\.\)]\s*/, '').replace(/[:\s]+$/, '')}
                  </h3>
                  <span className="sb-topics-progress-badge">
                    Progress: {chapterProgressPercent}%
                  </span>
                </div>

                <div className="sb-topics-list">
                  {chapterTopicsWithStatus.map((topic) => {
                    const isCompleted = topic.status === 'completed';
                    const isInProgress = topic.status === 'in-progress';

                    return (
                      <div key={topic.id} className="sb-topic-row">
                        <div className="sb-topic-left">
                          <button
                            type="button"
                            onClick={() => handleToggleTopic(topic.id)}
                            className="sb-topic-status-btn"
                            title="Click to toggle: Not Started → In Progress → Completed"
                          >
                            {isCompleted ? (
                              <span
                                className="material-symbols-outlined"
                                style={{
                                  fontSize: '22px',
                                  color: '#284232',
                                  fontVariationSettings: "'FILL' 1",
                                }}
                              >
                                check_circle
                              </span>
                            ) : isInProgress ? (
                              <span
                                className="material-symbols-outlined"
                                style={{ fontSize: '22px', color: '#16a34a' }}
                              >
                                adjust
                              </span>
                            ) : (
                              <span
                                className="material-symbols-outlined"
                                style={{ fontSize: '22px', color: '#c4baa9' }}
                              >
                                radio_button_unchecked
                              </span>
                            )}
                          </button>

                          <span className={`sb-topic-title ${isCompleted ? 'completed' : ''}`}>
                            {topic.title}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setActionMessage(`Playing topic concept walkthrough for "${topic.title}"`);
                            setTimeout(() => setActionMessage(null), 3000);
                          }}
                          className="sb-topic-play-btn"
                          title="Watch video explanation"
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{
                              fontSize: '20px',
                              fontVariationSettings: "'FILL' 1",
                            }}
                          >
                            play_arrow
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 3 Stacked Cards */}
          <div className="sb-sidebar-cards">
            {/* Card 1: Subject Overview Donut */}
            <div className="sb-overview-card">
              <h3 className="sb-card-title">Subject Overview</h3>

              <div className="sb-donut-wrap">
                <div className="sb-donut-chart">
                  <svg viewBox="0 0 104 104">
                    {/* Background circle track */}
                    <circle
                      cx="52"
                      cy="52"
                      r={radius}
                      fill="transparent"
                      strokeWidth="10"
                      className="sb-donut-arc-bg"
                    />

                    {/* Completed arc (dark green) */}
                    <circle
                      cx="52"
                      cy="52"
                      r={radius}
                      fill="transparent"
                      strokeWidth="10"
                      strokeDasharray={`${completedStroke} ${circumference}`}
                      strokeDashoffset="0"
                      strokeLinecap="round"
                      className="sb-donut-arc-completed"
                    />

                    {/* In-Progress arc (sage/light green) */}
                    <circle
                      cx="52"
                      cy="52"
                      r={radius}
                      fill="transparent"
                      strokeWidth="10"
                      strokeDasharray={`${inProgressStroke} ${circumference}`}
                      strokeDashoffset={`-${completedStroke}`}
                      strokeLinecap="round"
                      className="sb-donut-arc-progress"
                    />
                  </svg>

                  <div className="sb-donut-center-text">
                    {subjectProgressPercent}%
                  </div>
                </div>

                <div className="sb-donut-legend">
                  <div className="sb-legend-item">
                    <span className="sb-legend-label">
                      <span className="sb-legend-dot" style={{ backgroundColor: '#284232' }} />
                      Completed
                    </span>
                    <span className="sb-legend-val">{completedCount}</span>
                  </div>

                  <div className="sb-legend-item">
                    <span className="sb-legend-label">
                      <span className="sb-legend-dot" style={{ backgroundColor: '#7ba384' }} />
                      In Progress
                    </span>
                    <span className="sb-legend-val">{inProgressCount}</span>
                  </div>

                  <div className="sb-legend-item">
                    <span className="sb-legend-label">
                      <span className="sb-legend-dot" style={{ backgroundColor: '#cdc5b7' }} />
                      Not Started
                    </span>
                    <span className="sb-legend-val">{notStartedCount}</span>
                  </div>

                  <div className="sb-legend-divider" />

                  <div className="sb-legend-item">
                    <span className="sb-legend-label" style={{ fontWeight: 600, color: '#191c19' }}>
                      Total Topics
                    </span>
                    <span className="sb-legend-val">{totalCount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Quick Actions */}
            <div className="sb-actions-card">
              <h3 className="sb-card-title">Quick Actions</h3>

              <div className="sb-actions-grid">
                {/* Tile 1: Download Full Syllabus */}
                <button
                  type="button"
                  onClick={handleDownloadFullSyllabus}
                  className="sb-action-tile tile-red"
                >
                  <div className="sb-action-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      picture_as_pdf
                    </span>
                  </div>
                  <span className="sb-action-label">Download Full Syllabus</span>
                </button>

                {/* Tile 2: Mark as Completed */}
                <button
                  type="button"
                  onClick={handleMarkChapterCompleted}
                  className="sb-action-tile tile-blue"
                >
                  <div className="sb-action-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      done_all
                    </span>
                  </div>
                  <span className="sb-action-label">Mark as Completed</span>
                </button>

                {/* Tile 3: Create Plan */}
                <button
                  type="button"
                  onClick={handleCreatePlan}
                  className="sb-action-tile tile-amber"
                >
                  <div className="sb-action-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      calendar_month
                    </span>
                  </div>
                  <span className="sb-action-label">Create Plan</span>
                </button>

                {/* Tile 4: Set Goal */}
                <button
                  type="button"
                  onClick={handleSetGoal}
                  className="sb-action-tile tile-purple"
                >
                  <div className="sb-action-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      track_changes
                    </span>
                  </div>
                  <span className="sb-action-label">Set Goal</span>
                </button>
              </div>
            </div>

            {/* Card 3: Inspirational Quote Card with Botanical Leaf */}
            <div className="sb-quote-card">
              <span className="sb-quote-mark">“</span>
              <p className="sb-quote-text">
                A clear syllabus today, a brighter tomorrow.
              </p>

              <svg
                className="sb-quote-leaves"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 90 C 30 70, 60 50, 95 20 C 80 40, 50 70, 20 85 Z"
                  fill="#33593e"
                  opacity="0.85"
                />
                <path
                  d="M40 60 C 55 45, 80 35, 95 10 C 85 25, 60 45, 45 55 Z"
                  fill="#477353"
                  opacity="0.85"
                />
                <path
                  d="M50 75 C 65 65, 85 55, 98 35 C 88 50, 70 70, 55 72 Z"
                  fill="#5c8a68"
                  opacity="0.85"
                />
                <path
                  d="M2 98 Q 45 65 95 15"
                  stroke="#233e2b"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

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
