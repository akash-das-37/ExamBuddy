import type { OriginalDocument } from '../types';

export const INITIAL_DOCUMENTS: OriginalDocument[] = [
  // Official Syllabus Documents
  {
    id: 'doc-syl-official-1',
    title: 'Official B.Tech CSE Curriculum & Detailed Syllabus (Regulations R23/R25)',
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
• M(CS)301: Mathematics - III (Differential Calculus & Transforms) (3-0-0, 3 Credits)

Detailed Modular Outlines:
Module 1: Basic Computer Organization, Instruction Formats, Addressing Modes.
Module 2: Computer Arithmetic, Fixed-point (Booth's multiplication), Restoring and Non-restoring division, IEEE 754 Floating-point.
Module 3: Memory Organization, Cache memory hierarchy, Mapping techniques (Direct, Associative, Set-Associative), Virtual memory.
Module 4: CPU Pipelining, Instruction hazard detection, Branch prediction strategies, Superscalar execution.`,
  },
  {
    id: 'doc-syl-official-2',
    title: 'Semester 3 Computer Science Course Blueprint & Lab Manuals',
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
Module 4: Sorting & Hashing: Quicksort, Mergesort, Collision Resolution Strategies.
Laboratory Experiments: Implementation of memory management and ALU data paths.`,
  },
  {
    id: 'doc-syl-official-3',
    title: 'Semester 2 Foundation Curriculum & Programming Blueprint',
    type: 'syllabus',
    subject: 'Data Structures & Artificial Intelligence Foundations',
    semester: '2',
    file_name: 'syllabus_CSE_2.pdf',
    file_url: '/syllabus/syllabus_CSE_2.pdf',
    file_size: '2.2 MB',
    uploaded_at: '2024-01-20T09:30:00.000Z',
    is_official: true,
    extracted_count: 55,
    content_preview: `SEMESTER 2 FOUNDATION CURRICULUM
Course Code: CS201 - Data Structures and Algorithms
Course Code: CS202 - Introduction to Artificial Intelligence
Course Code: CH201 - Engineering Chemistry
Course Code: M201 - Mathematics II
Total Credits: 21.0 | Evaluation: 30% Continuous Assessment, 70% Semester End Exam.`,
  },
  {
    id: 'doc-syl-official-6',
    title: 'Semester 6 Advanced Computer Science & Engineering Curriculum',
    type: 'syllabus',
    subject: 'Computer Science & Engineering',
    semester: '6',
    file_name: 'syllabus_CSE_6.pdf',
    file_url: '/syllabus/syllabus_CSE_6.pdf',
    file_size: '2.1 MB',
    uploaded_at: '2024-01-20T09:30:00.000Z',
    is_official: true,
    extracted_count: 48,
    content_preview: `SEMESTER 6 CURRICULUM
Course Code: CS601 - Software Engineering
Course Code: CS602 - Computer Networks
Course Code: CS603 - Compiler Design
Total Credits: 22.0`,
  },

  // Official PYQ Question Paper Documents
  {
    id: 'doc-pyq-official-1',
    title: 'University End-Semester Examination 2025: Computer Organization & Architecture',
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
Answer all questions. Each question carries 1 mark. [10 x 1 = 10]
1. (a) In IEEE 754 single-precision format, the number of bits allocated to the exponent is:
       (i) 8   (ii) 11   (iii) 23   (iv) 32
   (b) Which hazard arises when two instructions access the same register in out-of-order execution?
       (i) RAW  (ii) WAR  (iii) WAW  (iv) Both (ii) and (iii)
   (c) Direct mapped cache is a special case of set-associative cache with set size equal to:
       (i) 1    (ii) 2    (iii) 4    (iv) Cache size

GROUP - B (Short Answer Questions)
Answer any three questions. Each question carries 5 marks. [3 x 5 = 15]
2. Derive the speedup equation using Amdahl's Law when 40% of the program execution time is strictly serial and cannot be parallelized.
3. Differentiate between Hardwired Control Unit and Microprogrammed Control Unit in terms of speed, cost, and instruction set flexibility.
4. Draw and describe the Booth's multiplication algorithm flowchart for signed 2's complement binary numbers.

GROUP - C (Long Answer / Analytical Questions)
Answer any three questions. Each question carries 15 marks. [3 x 15 = 45]
5. (a) Multiply (+13) and (-6) using Booth's multiplication algorithm step-by-step with proper registers (A, Q, Q-1, M). [10]
   (b) Explain restoring vs non-restoring division with a numeric example. [5]
6. (a) A system has a 64 KB cache with 64-byte block size and a 32-bit physical address. Calculate the number of bits in Tag, Index, and Offset fields for:
       (i) Direct Mapped Cache
       (ii) 4-Way Set Associative Cache [10]
   (b) Explain write-through vs write-back cache policies and dirty bit usage. [5]
7. (a) Explain 5-stage RISC instruction pipeline (IF, ID, EX, MEM, WB) and describe how data forwarding resolves RAW dependencies. [10]
   (b) Explain delayed branching and branch prediction buffers. [5]`,
  },
  {
    id: 'doc-pyq-official-2',
    title: 'University End-Semester Examination 2024: Design & Analysis of Algorithms',
    type: 'pyq',
    subject: 'Design and Analysis of Algorithms',
    semester: '3',
    exam_year: '2024',
    file_name: 'CS301_EndSem_ExamPaper_2024.pdf',
    file_url: '/pyqs/CS301_EndSem_ExamPaper_2024.pdf',
    file_size: '2.5 MB',
    uploaded_at: '2024-06-20T14:00:00.000Z',
    is_official: true,
    extracted_count: 12,
    content_preview: `JIS COLLEGE OF ENGINEERING (AUTONOMOUS)
END SEMESTER EXAMINATION - 2024
COURSE: B.TECH (CSE) | SEMESTER: III
SUBJECT: DESIGN & ANALYSIS OF ALGORITHMS [CS301]
Time Allowed: 3 Hours                                    Maximum Marks: 70

GROUP - A (Short Conceptual Questions)
1. Define Big-O, Big-Omega, and Big-Theta notations with mathematical bounds. [5]
2. State the Master Theorem conditions and solve: T(n) = 3T(n/4) + n log n. [5]

GROUP - B (Core Analytical Questions)
3. Write Dijkstra's Single Source Shortest Path algorithm. Trace on given weighted graph and analyze its time complexity using min-heap. [10]
4. Solve 0/1 Knapsack problem using Dynamic Programming table for weights [2, 3, 4, 5] and values [3, 4, 5, 6] with capacity W = 8. [10]
5. Explain Bellman-Ford algorithm and how it detects negative weight cycles. [10]
6. Prove that Vertex Cover problem is NP-Complete by reducing from 3-SAT. [10]`,
  },
  {
    id: 'doc-pyq-official-3',
    title: 'University End-Semester Examination 2024: Mathematics - III',
    type: 'pyq',
    subject: 'Mathematics',
    semester: '3',
    exam_year: '2024',
    file_name: 'MCS301_EndSem_ExamPaper_2024.pdf',
    file_url: 'https://www.jiscollege.ac.in/pdf/academic/Curriculum-and-Syllabus-B.Tech-CSE.pdf',
    file_size: '790 KB',
    uploaded_at: '2024-06-22T14:00:00.000Z',
    is_official: true,
    extracted_count: 10,
    content_preview: `JIS COLLEGE OF ENGINEERING (AUTONOMOUS)
END SEMESTER EXAMINATION - 2024
COURSE: B.TECH | SEMESTER: III
SUBJECT: MATHEMATICS - III [M(CS)301]
Time Allowed: 3 Hours                                    Maximum Marks: 70

GROUP - A: Transform Calculus (Laplace & Fourier Transforms)
1. Find Laplace Transform of f(t) = t^2 * e^(-3t) * sin(2t). [8]
2. State and prove the Convolution Theorem for Fourier Transforms. [7]

GROUP - B: Probability & Numerical Methods
3. Fit a binomial distribution to the following experimental observations. [10]
4. Solve dy/dx = x + y with y(0) = 1 using Runge-Kutta 4th Order method at x = 0.2 (h = 0.1). [10]`,
  },
];
