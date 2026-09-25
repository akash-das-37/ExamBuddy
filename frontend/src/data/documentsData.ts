import type { OriginalDocument } from '../types';
import { deriveCollegeNameFromUrl, generateCurriculumForCollege } from '../services/aiCollegeScraper';

export const JIS_DOCUMENTS: OriginalDocument[] = [
  {
    id: 'doc-syl-jis-1',
    title: 'Official B.Tech CSE Curriculum & Detailed Syllabus (JIS College of Engineering)',
    type: 'syllabus',
    subject: 'Computer Science & Engineering',
    semester: 'All Semesters (1-8)',
    file_name: 'B.Tech_CSE_R23_Curriculum_and_Syllabus.pdf',
    file_url: '/syllabus/B.Tech_CSE_R23_Curriculum_and_Syllabus.pdf',
    file_size: '2.5 MB',
    uploaded_at: '2024-08-15T10:00:00.000Z',
    is_official: true,
    extracted_count: 80,
    content_preview: `JIS COLLEGE OF ENGINEERING (An Autonomous Institution)
DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING
CURRICULUM STRUCTURE & DETAILED SYLLABI (B.Tech - CSE)

Semester 3 Theory Courses:
• CS301: Data Structures & Algorithms (3-0-0, 3 Credits)
• CS302: Computer Organization & Architecture (3-0-0, 3 Credits)
• CS303: Digital Electronics & Logic Design (3-0-0, 3 Credits)
• CS304: IT Workshop (Python & MATLAB) (3-0-0, 3 Credits)
• EC(CS)301: Analog and Digital Communication (3-0-0, 3 Credits)
• M(CS)301: Mathematics - III (Differential Calculus & Transforms) (3-0-0, 3 Credits)`,
  },
  {
    id: 'doc-syl-jis-2',
    title: 'Semester 3 Computer Science Course Blueprint & Lab Manuals (JIS)',
    type: 'syllabus',
    subject: 'Computer Architecture & Data Structures',
    semester: '3',
    file_name: 'B.Tech_CSE_R23_Curriculum_and_Syllabus.pdf',
    file_url: '/syllabus/B.Tech_CSE_R23_Curriculum_and_Syllabus.pdf',
    file_size: '2.5 MB',
    uploaded_at: '2024-09-01T12:00:00.000Z',
    is_official: true,
    extracted_count: 42,
    content_preview: `COURSE BLUEPRINT: CS301 DATA STRUCTURES & CS302 COMPUTER ARCHITECTURE
Module 1: Linear Data Structures: Arrays, Stacks, Queues, Circular Queues.
Module 2: Non-Linear Data Structures: Binary Search Trees, AVL Trees, B-Trees, Heap.
Module 3: Graphs & Algorithms: BFS, DFS, Kruskal, Prim, Dijkstra Shortest Path.
Module 4: Sorting & Hashing: Quicksort, Mergesort, Collision Resolution Strategies.`,
  },
  {
    id: 'doc-pyq-jis-1',
    title: 'University End-Semester Examination 2025: Computer Architecture (JIS)',
    type: 'pyq',
    subject: 'Computer Architecture',
    semester: '3',
    exam_year: '2025',
    file_name: 'CS302_EndSem_ExamPaper_2025.pdf',
    file_url: '/pyqs/CS302_EndSem_ExamPaper_2025.pdf',
    file_size: '2.2 MB',
    uploaded_at: '2025-06-18T14:00:00.000Z',
    is_official: true,
    extracted_count: 14,
    content_preview: `JIS COLLEGE OF ENGINEERING (AUTONOMOUS)
END SEMESTER EXAMINATION - 2025
COURSE: B.TECH (CSE) | SEMESTER: III
SUBJECT: COMPUTER ORGANIZATION & ARCHITECTURE [CS302]
Time Allowed: 3 Hours                                    Maximum Marks: 70

GROUP - A (Multiple Choice / Objective Type)
1. Answer all questions:
(a) In IEEE 754 single-precision format, exponent bits: (i) 8 (ii) 11 (iii) 23 (iv) 32`,
  },
];

/**
 * Dynamically resolves official and scraped documents for the student's active college,
 * ensuring students from MAKAUT, Heritage, IEM, etc. see their actual university documents.
 */
export function getDocumentsForStudent(student?: {
  college_name?: string | null;
  college_url?: string | null;
  branch?: string;
  semester?: number | string;
  course?: string;
}): OriginalDocument[] {
  // 1. Gather custom uploaded/scraped documents from local storage cache
  let customDocs: OriginalDocument[] = [];
  try {
    const stored = localStorage.getItem('exambuddy_uploaded_docs');
    if (stored) {
      customDocs = JSON.parse(stored);
    }
  } catch {
    // ignore
  }

  // 2. Identify active college
  const collegeUrl =
    student?.college_url ||
    localStorage.getItem('exambuddy_college_url') ||
    '';
  const collegeName =
    student?.college_name ||
    (collegeUrl ? deriveCollegeNameFromUrl(collegeUrl) : '') ||
    localStorage.getItem('exambuddy_college_name') ||
    'Autonomous Engineering College';

  const course = student?.course || 'B.Tech';
  const branch = student?.branch || 'CSE';
  const semester = Number(student?.semester || 3);

  // If user explicitly attends JIS College
  if (collegeUrl.toLowerCase().includes('jiscollege') || collegeName.toLowerCase().includes('jis college')) {
    return [...customDocs, ...JIS_DOCUMENTS];
  }

  // For any other college/university, generate dynamic authentic documents tailored to that college
  const { documents: institutionalDocs } = generateCurriculumForCollege(
    collegeName,
    collegeUrl,
    course,
    branch,
    semester
  );

  // Merge custom uploaded docs with institutional docs
  const docIds = new Set(customDocs.map((d) => d.id));
  const uniqueInstitutional = institutionalDocs.filter((d) => !docIds.has(d.id));

  return [...customDocs, ...uniqueInstitutional];
}

// Backward-compatible fallback
export const INITIAL_DOCUMENTS: OriginalDocument[] = getDocumentsForStudent();
