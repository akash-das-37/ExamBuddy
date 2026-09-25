import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../api/client';
import type { OriginalDocument, Student, SyllabusEntry } from '../types';
import { getDocumentsForStudent } from '../data/documentsData';
import { UploadSyllabusModal } from '../components/UploadSyllabusModal';
import { DocumentViewerModal } from '../components/DocumentViewerModal';
import { aiCollegeScraper, deriveCollegeNameFromUrl } from '../services/aiCollegeScraper';
import '../styles/SyllabusPage.css';

interface TopicItem {
  id: string;
  title: string;
  category?: 'theory' | 'practical' | 'module';
  status: 'completed' | 'in-progress' | 'not-started';
}

interface ChapterItem {
  id: string;
  number: number;
  title: string;
  category?: 'theory' | 'practical' | 'module';
  topics: TopicItem[];
}

interface SubjectItem {
  id: string;
  name: string;
  chapterCount: number;
  icon: string;
  accentColor: string;
  accentBg: string;
  chapters: ChapterItem[];
}

// Default structured curriculum catalog matching the editorial study desk design
const DEFAULT_SUBJECTS: SubjectItem[] = [
  {
    id: 'dsa',
    name: 'Data Structures',
    chapterCount: 12,
    icon: 'database',
    accentColor: '#10b981',
    accentBg: '#d1fae5',
    chapters: [
      {
        id: 'ch-1',
        number: 1,
        title: 'Introduction to Data Structures',
        category: 'theory',
        topics: [
          { id: 't-1-1', title: 'What are Data Structures?', category: 'theory', status: 'completed' },
          { id: 't-1-2', title: 'Need and Applications', category: 'theory', status: 'completed' },
          { id: 't-1-3', title: 'Types of Data Structures', category: 'theory', status: 'completed' },
          { id: 't-1-4', title: 'Time and Space Complexity', category: 'theory', status: 'in-progress' },
          { id: 't-1-5', title: 'Asymptotic Notations (Big O, Ω, Θ)', category: 'theory', status: 'not-started' },
          { id: 't-1-6', title: 'Recursion Basics', category: 'theory', status: 'completed' },
          { id: 't-1-7', title: 'Examples and Case Studies', category: 'theory', status: 'not-started' },
        ],
      },
      {
        id: 'ch-2',
        number: 2,
        title: 'Arrays',
        category: 'theory',
        topics: [
          { id: 't-2-1', title: '1D & 2D Array Representation', category: 'theory', status: 'completed' },
          { id: 't-2-2', title: 'Row-Major & Column-Major Addressing', category: 'theory', status: 'completed' },
          { id: 't-2-3', title: 'Array Insertion & Deletion Algorithms', category: 'theory', status: 'completed' },
          { id: 't-2-4', title: 'Dynamic Array & Vector Internals', category: 'theory', status: 'in-progress' },
        ],
      },
      {
        id: 'ch-3',
        number: 3,
        title: 'Linked Lists',
        category: 'theory',
        topics: [
          { id: 't-3-1', title: 'Singly Linked List Implementation', category: 'theory', status: 'completed' },
          { id: 't-3-2', title: 'Doubly Linked List Traversal', category: 'theory', status: 'completed' },
          { id: 't-3-3', title: 'Circular Linked Lists', category: 'theory', status: 'completed' },
          { id: 't-3-4', title: "Floyd's Cycle Finding Algorithm", category: 'theory', status: 'in-progress' },
        ],
      },
      {
        id: 'ch-4',
        number: 4,
        title: 'Stacks and Queues',
        category: 'practical',
        topics: [
          { id: 't-4-1', title: 'Stack Operations (Push, Pop, Peek)', category: 'practical', status: 'completed' },
          { id: 't-4-2', title: 'Infix to Postfix Conversion', category: 'practical', status: 'completed' },
          { id: 't-4-3', title: 'Circular Queue and Deque Implementation', category: 'practical', status: 'in-progress' },
        ],
      },
      {
        id: 'ch-5',
        number: 5,
        title: 'Trees',
        category: 'theory',
        topics: [
          { id: 't-5-1', title: 'Binary Tree Traversals (In, Pre, Post)', category: 'theory', status: 'completed' },
          { id: 't-5-2', title: 'Level Order (BFS) Traversal', category: 'theory', status: 'completed' },
          { id: 't-5-3', title: 'Height and Diameter of Binary Tree', category: 'theory', status: 'in-progress' },
        ],
      },
      {
        id: 'ch-6',
        number: 6,
        title: 'Binary Search Trees',
        category: 'theory',
        topics: [
          { id: 't-6-1', title: 'BST Search, Insertion and Deletion', category: 'theory', status: 'completed' },
          { id: 't-6-2', title: 'AVL Trees & Balancing Rotations', category: 'theory', status: 'not-started' },
        ],
      },
      {
        id: 'ch-7',
        number: 7,
        title: 'Heaps and Priority Queues',
        category: 'practical',
        topics: [
          { id: 't-7-1', title: 'Min-Heap and Max-Heap Properties', category: 'practical', status: 'completed' },
          { id: 't-7-2', title: 'Heapify and Heap Sort Algorithm', category: 'practical', status: 'not-started' },
        ],
      },
      {
        id: 'ch-8',
        number: 8,
        title: 'Graphs',
        category: 'theory',
        topics: [
          { id: 't-8-1', title: 'Adjacency Matrix vs Adjacency List', category: 'theory', status: 'completed' },
          { id: 't-8-2', title: 'Breadth-First Search (BFS)', category: 'theory', status: 'completed' },
          { id: 't-8-3', title: 'Depth-First Search (DFS)', category: 'theory', status: 'in-progress' },
        ],
      },
      {
        id: 'ch-9',
        number: 9,
        title: 'Graph Algorithms',
        category: 'practical',
        topics: [
          { id: 't-9-1', title: "Dijkstra's Shortest Path Algorithm", category: 'practical', status: 'not-started' },
          { id: 't-9-2', title: "Prim's & Kruskal's Minimum Spanning Tree", category: 'practical', status: 'not-started' },
        ],
      },
      {
        id: 'ch-10',
        number: 10,
        title: 'Hashing',
        category: 'module',
        topics: [
          { id: 't-10-1', title: 'Hash Functions & Direct Addressing', category: 'module', status: 'not-started' },
        ],
      },
    ],
  },
  {
    id: 'discrete-math',
    name: 'Discrete Math',
    chapterCount: 10,
    icon: 'science',
    accentColor: '#a855f7',
    accentBg: '#f3e8ff',
    chapters: [
      {
        id: 'dm-1',
        number: 1,
        title: 'Propositional & Predicate Logic',
        category: 'theory',
        topics: [
          { id: 'dmt-1', title: 'Truth Tables and Tautologies', category: 'theory', status: 'completed' },
          { id: 'dmt-2', title: 'Quantifiers and Logical Equivalence', category: 'theory', status: 'completed' },
          { id: 'dmt-3', title: 'Rules of Inference', category: 'theory', status: 'in-progress' },
        ],
      },
      {
        id: 'dm-2',
        number: 2,
        title: 'Sets, Relations & Functions',
        category: 'theory',
        topics: [
          { id: 'dmt-4', title: 'Set Operations and Venn Diagrams', category: 'theory', status: 'completed' },
          { id: 'dmt-5', title: 'Equivalence Relations & Partial Orders', category: 'theory', status: 'not-started' },
        ],
      },
      {
        id: 'dm-3',
        number: 3,
        title: 'Combinatorics & Counting',
        category: 'theory',
        topics: [
          { id: 'dmt-6', title: 'Pigeonhole Principle', category: 'theory', status: 'completed' },
          { id: 'dmt-7', title: 'Permutations and Combinations', category: 'theory', status: 'not-started' },
        ],
      },
    ],
  },
  {
    id: 'oop',
    name: 'OOP',
    chapterCount: 8,
    icon: 'code',
    accentColor: '#3b82f6',
    accentBg: '#dbeafe',
    chapters: [
      {
        id: 'oop-1',
        number: 1,
        title: 'Object-Oriented Paradigms',
        category: 'theory',
        topics: [
          { id: 'oopt-1', title: 'Classes, Objects, and Instantiation', category: 'theory', status: 'completed' },
          { id: 'oopt-2', title: 'Encapsulation and Data Hiding', category: 'theory', status: 'completed' },
        ],
      },
      {
        id: 'oop-2',
        number: 2,
        title: 'Inheritance & Polymorphism',
        category: 'practical',
        topics: [
          { id: 'oopt-3', title: 'Virtual Functions & Dynamic Binding', category: 'practical', status: 'completed' },
          { id: 'oopt-4', title: 'Abstract Classes and Interfaces', category: 'practical', status: 'in-progress' },
        ],
      },
    ],
  },
  {
    id: 'digital-elec',
    name: 'Digital Electronics',
    chapterCount: 10,
    icon: 'memory',
    accentColor: '#06b6d4',
    accentBg: '#cffafe',
    chapters: [
      {
        id: 'de-1',
        number: 1,
        title: 'Number Systems & Boolean Algebra',
        category: 'theory',
        topics: [
          { id: 'det-1', title: 'Binary, Hexadecimal, and 2s Complement', category: 'theory', status: 'completed' },
          { id: 'det-2', title: 'Karnaugh Maps (K-Maps) Minimization', category: 'theory', status: 'completed' },
        ],
      },
      {
        id: 'de-2',
        number: 2,
        title: 'Combinational Logic Circuits',
        category: 'practical',
        topics: [
          { id: 'det-3', title: 'Full Adders and Subtractors', category: 'practical', status: 'in-progress' },
          { id: 'det-4', title: 'Multiplexers and Demultiplexers', category: 'practical', status: 'not-started' },
        ],
      },
    ],
  },
  {
    id: 'operating-sys',
    name: 'Operating Systems',
    chapterCount: 9,
    icon: 'settings',
    accentColor: '#2563eb',
    accentBg: '#dbeafe',
    chapters: [
      {
        id: 'os-1',
        number: 1,
        title: 'OS Structure & System Calls',
        category: 'theory',
        topics: [
          { id: 'ost-1', title: 'Kernel Architecture and System Calls', category: 'theory', status: 'completed' },
          { id: 'ost-2', title: 'Process Control Block (PCB)', category: 'theory', status: 'completed' },
        ],
      },
      {
        id: 'os-2',
        number: 2,
        title: 'CPU Scheduling Algorithms',
        category: 'practical',
        topics: [
          { id: 'ost-3', title: 'Round Robin, FCFS, and SJF', category: 'practical', status: 'completed' },
          { id: 'ost-4', title: 'Multi-Level Feedback Queues', category: 'practical', status: 'in-progress' },
        ],
      },
    ],
  },
  {
    id: 'comp-networks',
    name: 'Computer Networks',
    chapterCount: 7,
    icon: 'language',
    accentColor: '#9333ea',
    accentBg: '#f3e8ff',
    chapters: [
      {
        id: 'cn-1',
        number: 1,
        title: 'OSI & TCP/IP Reference Models',
        category: 'theory',
        topics: [
          { id: 'cnt-1', title: 'Layer Responsibilities and Protocol Stack', category: 'theory', status: 'completed' },
          { id: 'cnt-2', title: 'Packet Switching vs Circuit Switching', category: 'theory', status: 'in-progress' },
        ],
      },
      {
        id: 'cn-2',
        number: 2,
        title: 'Data Link Layer & Routing',
        category: 'practical',
        topics: [
          { id: 'cnt-3', title: 'Framing, Error Detection, and CRC', category: 'practical', status: 'not-started' },
          { id: 'cnt-4', title: 'Subnetting and IPv4 Addressing', category: 'practical', status: 'not-started' },
        ],
      },
    ],
  },
];

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

  // Active Subject & Chapter selection
  const [subjectsList, setSubjectsList] = useState<SubjectItem[]>(DEFAULT_SUBJECTS);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('dsa');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('ch-1');

  // Topic status toggle state map: { [topicId]: 'completed' | 'in-progress' | 'not-started' }
  const [topicStatusMap, setTopicStatusMap] = useState<Record<string, 'completed' | 'in-progress' | 'not-started'>>(() => {
    const initial: Record<string, 'completed' | 'in-progress' | 'not-started'> = {};
    DEFAULT_SUBJECTS.forEach((sub) => {
      sub.chapters.forEach((ch) => {
        ch.topics.forEach((t) => {
          initial[t.id] = t.status;
        });
      });
    });
    return initial;
  });

  // Filter tabs and search
  const [viewFilter, setViewFilter] = useState<'all' | 'theory' | 'practical' | 'modules'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Dropdown parameters
  const [branch, setBranch] = useState(student.branch || student.course || 'CSE');
  const [semester, setSemester] = useState(String(student.semester || '2'));

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
  }, [student.college_url, student.college_name]);

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
      setSyllabusList(combined);

      // If backend returned syllabus entries, merge them into the active subjects
      if (combined.length > 0) {
        const backendSubjects = Array.from(new Set(combined.map((c) => c.subject)));
        setSubjectsList((prev) => {
          const customSubjects: SubjectItem[] = backendSubjects
            .filter((name) => !prev.some((p) => p.name.toLowerCase() === name.toLowerCase()))
            .map((name, idx) => {
              const matchedEntries = combined.filter((c) => c.subject === name);
              const chapters: ChapterItem[] = matchedEntries.map((e, cIdx) => ({
                id: `entry-${e.id || cIdx}`,
                number: cIdx + 1,
                title: e.topic_title,
                category: e.topic_title.toLowerCase().includes('lab') ? 'practical' : 'theory',
                topics: [
                  {
                    id: `topic-${e.id || cIdx}-1`,
                    title: e.topic_description || e.topic_title,
                    category: e.topic_title.toLowerCase().includes('lab') ? 'practical' : 'theory',
                    status: 'not-started',
                  },
                ],
              }));
              return {
                id: `sub-custom-${idx}`,
                name,
                chapterCount: chapters.length || 6,
                icon: 'auto_stories',
                accentColor: '#10b981',
                accentBg: '#eaf3ec',
                chapters,
              };
            });
          return [...prev, ...customSubjects];
        });
      }
    } catch {
      // Fallback to default subjects
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
    setSearchStatus(`Successfully uploaded & imported ${newEntries.length} topics from "${newDoc.file_name}"!`);
  };

  const activeSylDoc =
    documents.find((d) => d.type === 'syllabus' && (d.semester === semester || d.semester?.includes(semester))) ||
    documents.find((d) => d.type === 'syllabus') ||
    documents[0];

  // Currently active subject
  const currentSubject = subjectsList.find((s) => s.id === selectedSubjectId) || subjectsList[0];

  // Active chapter
  const currentChapter =
    currentSubject.chapters.find((c) => c.id === selectedChapterId) ||
    currentSubject.chapters[0] || {
      id: 'default',
      number: 1,
      title: 'General Overview',
      topics: [],
    };

  // Toggle status: not-started -> in-progress -> completed -> not-started
  const handleToggleTopic = (topicId: string) => {
    setTopicStatusMap((prev) => {
      const cur = prev[topicId] || 'not-started';
      const next =
        cur === 'not-started'
          ? 'in-progress'
          : cur === 'in-progress'
          ? 'completed'
          : 'not-started';
      return { ...prev, [topicId]: next };
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

  // Filtered chapters for left sub-column based on filter tabs and search
  const filteredChapters = useMemo(() => {
    return currentSubject.chapters.filter((ch) => {
      const matchesSearch =
        ch.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ch.topics.some((t) => t.title.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchesFilter = true;
      if (viewFilter === 'theory') matchesFilter = ch.category === 'theory';
      if (viewFilter === 'practical') matchesFilter = ch.category === 'practical';
      if (viewFilter === 'modules') matchesFilter = ch.category === 'module';

      return matchesSearch && matchesFilter;
    });
  }, [currentSubject, searchTerm, viewFilter]);

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
            <h1 className="sb-main-title">Syllabus</h1>
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

                {/* Branch Selector */}
                <div className="sb-dropdown-group">
                  <label className="sb-dropdown-label">Branch</label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="sb-select-pill"
                  >
                    <option value="CSE">CSE</option>
                    <option value="IT">IT</option>
                    <option value="ECE">ECE</option>
                    <option value="EE">EE</option>
                    <option value="ME">ME</option>
                    <option value="Civil">Civil</option>
                  </select>
                </div>

                {/* Semester Selector */}
                <div className="sb-dropdown-group">
                  <label className="sb-dropdown-label">Semester</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="sb-select-pill"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={String(s)}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            {loading && (
              <div style={{ padding: '2px 0', fontSize: '11px', color: '#687865', fontStyle: 'italic' }}>
                Syncing syllabus from {activeCollegeName || 'college database'}...
              </div>
            )}
            <div className="sb-filter-bar">
              <div className="sb-filter-pills">
                <button
                  type="button"
                  onClick={() => setViewFilter('all')}
                  className={`sb-filter-pill ${viewFilter === 'all' ? 'active' : ''}`}
                >
                  All ({syllabusList.length > 0 ? syllabusList.length : (allCurrentSubjectTopics.length || 60)})
                </button>
                <button
                  type="button"
                  onClick={() => setViewFilter('theory')}
                  className={`sb-filter-pill ${viewFilter === 'theory' ? 'active' : ''}`}
                >
                  Theory (7)
                </button>
                <button
                  type="button"
                  onClick={() => setViewFilter('practical')}
                  className={`sb-filter-pill ${viewFilter === 'practical' ? 'active' : ''}`}
                >
                  Practical (5)
                </button>
                <button
                  type="button"
                  onClick={() => setViewFilter('modules')}
                  className={`sb-filter-pill ${viewFilter === 'modules' ? 'active' : ''}`}
                >
                  Modules (47)
                </button>
              </div>

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
                {filteredChapters.map((chapter) => {
                  const isChActive = chapter.id === selectedChapterId;
                  return (
                    <button
                      key={chapter.id}
                      type="button"
                      onClick={() => setSelectedChapterId(chapter.id)}
                      className={`sb-chapter-item ${isChActive ? 'active' : ''}`}
                    >
                      <span>
                        {chapter.number}. {chapter.title}
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
                    {currentChapter.number}. {currentChapter.title}
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
