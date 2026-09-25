export interface TopicItem {
  id: string;
  title: string;
  category?: 'theory' | 'practical' | 'module';
  status: 'completed' | 'in-progress' | 'not-started';
}

export interface ChapterItem {
  id: string;
  number: number;
  title: string;
  category?: 'theory' | 'practical' | 'module';
  topics: TopicItem[];
}

export const DSA_CHAPTERS: ChapterItem[] = [
  {
    id: 'ch-dsa-1',
    number: 1,
    title: 'Introduction to Data Structures & Algorithm Analysis',
    category: 'theory',
    topics: [
      { id: 't-dsa-1-1', title: 'Concepts of Data and Information, Abstract Data Type (ADT) & Data Types [1L]', category: 'theory', status: 'completed' },
      { id: 't-dsa-1-2', title: 'Classification: Primitive vs Non-Primitive, Linear vs Non-Linear Data Structures [1L]', category: 'theory', status: 'completed' },
      { id: 't-dsa-1-3', title: 'Need of Data Structures, Concept of Algorithms and Programs [1L]', category: 'theory', status: 'completed' },
      { id: 't-dsa-1-4', title: 'Different methods of representing algorithms & Algorithm Analysis [1L]', category: 'theory', status: 'in-progress' },
      { id: 't-dsa-1-5', title: 'Time and space analysis of algorithms – Asymptotic notations (Big O, Small o, Ω, ω, Θ) [2L]', category: 'theory', status: 'not-started' },
    ],
  },
  {
    id: 'ch-dsa-2',
    number: 2,
    title: 'Non-Restricted Linear Data Structure (Arrays & Linked Lists)',
    category: 'theory',
    topics: [
      { id: 't-dsa-2-1', title: 'List or Linear List: Definition, Examples & List as ADT [1L]', category: 'theory', status: 'completed' },
      { id: 't-dsa-2-2', title: 'Array Sequential Representation & Linearization of multidimensional arrays [2L]', category: 'theory', status: 'completed' },
      { id: 't-dsa-2-3', title: 'Application of arrays: Polynomial representation & Sparse Matrix using array [2L]', category: 'theory', status: 'in-progress' },
      { id: 't-dsa-2-4', title: 'Linked List: Introduction to linked representation & Singly Linked List implementation [2L]', category: 'theory', status: 'in-progress' },
      { id: 't-dsa-2-5', title: 'Doubly Linked List, Circular Linked List & Circular Doubly Linked List operations [2L]', category: 'theory', status: 'not-started' },
    ],
  },
  {
    id: 'ch-dsa-3',
    number: 3,
    title: 'Restricted Linear Data Structure (Stacks & Queues)',
    category: 'practical',
    topics: [
      { id: 't-dsa-3-1', title: 'Stack: Definition & implementations using array and linked list [1L]', category: 'practical', status: 'completed' },
      { id: 't-dsa-3-2', title: 'Applications of Stack: Infix to postfix conversion & Postfix evaluation [2L]', category: 'practical', status: 'completed' },
      { id: 't-dsa-3-3', title: 'Principles of Recursion: Use of stack, tail recursion, Tower of Hanoi [1L]', category: 'practical', status: 'in-progress' },
      { id: 't-dsa-3-4', title: 'Queue: Implementation using array (physical, linear, circular model) & linked list [1L]', category: 'practical', status: 'in-progress' },
      { id: 't-dsa-3-5', title: 'Double-Ended Queue (Deque): Definition and different variations [1L]', category: 'practical', status: 'not-started' },
    ],
  },
  {
    id: 'ch-dsa-4',
    number: 4,
    title: 'Nonlinear Data Structures (Trees & Binary Trees)',
    category: 'theory',
    topics: [
      { id: 't-dsa-4-1', title: 'Trees and Binary Tree: Basic terminologies, definitions & differences [1L]', category: 'theory', status: 'completed' },
      { id: 't-dsa-4-2', title: 'Representation of Binary Tree using arrays and linked lists [1L]', category: 'theory', status: 'completed' },
      { id: 't-dsa-4-3', title: 'Binary Tree Traversals (Pre-, In-, Post-order, Level-Order) [2L]', category: 'theory', status: 'in-progress' },
      { id: 't-dsa-4-4', title: 'Threaded Binary Tree: Definition, insertion and deletion algorithms [1L]', category: 'theory', status: 'not-started' },
      { id: 't-dsa-4-5', title: 'Binary Search Tree (BST): Definition, insertion, deletion and search algorithms [2L]', category: 'theory', status: 'not-started' },
      { id: 't-dsa-4-6', title: 'Height Balanced Binary Tree: AVL Tree definition, rotations, insertion and deletion [1L]', category: 'theory', status: 'not-started' },
      { id: 't-dsa-4-7', title: 'm-Way Search Trees: B-Tree & B+ Tree definition, insertion and deletion [1L]', category: 'theory', status: 'not-started' },
    ],
  },
  {
    id: 'ch-dsa-5',
    number: 5,
    title: 'Sorting, Searching & Hashing',
    category: 'practical',
    topics: [
      { id: 't-dsa-5-1', title: 'Searching: Linear Search and Binary Search algorithms with analysis [1L]', category: 'practical', status: 'completed' },
      { id: 't-dsa-5-2', title: 'Sorting: Bubble Sort, Selection Sort and Insertion Sort [2L]', category: 'practical', status: 'completed' },
      { id: 't-dsa-5-3', title: 'Divide & Conquer: Merge Sort and Quick Sort with complexity analysis [2L]', category: 'practical', status: 'in-progress' },
      { id: 't-dsa-5-4', title: 'Heap Sort and Radix Sort implementation [1L]', category: 'practical', status: 'not-started' },
      { id: 't-dsa-5-5', title: 'Hashing: Hash functions, collision resolution (chaining, open addressing, probing) [2L]', category: 'practical', status: 'not-started' },
    ],
  },
];

export const SUBJECT_PRESETS: Record<string, ChapterItem[]> = {
  'Data structure and Algorithms': DSA_CHAPTERS,
  'Data Structures': DSA_CHAPTERS,
  'DSA': DSA_CHAPTERS,

  'Computer Architecture': [
    {
      id: 'ca-1',
      number: 1,
      title: 'Introduction to CPU, ALU & Computer Arithmetic',
      category: 'theory',
      topics: [
        { id: 'ca-1-1', title: 'Introduction to CPU and concepts of ALU [2L]', category: 'theory', status: 'completed' },
        { id: 'ca-1-2', title: 'Instruction format and Instruction Cycle [1L]', category: 'theory', status: 'completed' },
        { id: 'ca-1-3', title: 'Addressing Modes [1L]', category: 'theory', status: 'in-progress' },
        { id: 'ca-1-4', title: "Fixed-point multiplication - Booth's algorithm [2L]", category: 'theory', status: 'in-progress' },
        { id: 'ca-1-5', title: 'Fixed-point division - Restoring and non-restoring algorithms [1L]', category: 'theory', status: 'not-started' },
        { id: 'ca-1-6', title: 'Floating-point number representation (IEEE 754 format) & arithmetic operations [1L]', category: 'theory', status: 'not-started' },
      ],
    },
    {
      id: 'ca-2',
      number: 2,
      title: 'Basic Computer Architecture & Control Unit',
      category: 'theory',
      topics: [
        { id: 'ca-2-1', title: 'Introduction to basic computer architecture [1L]', category: 'theory', status: 'completed' },
        { id: 'ca-2-2', title: 'Stored Program Concepts: Von Neumann & Harvard Architecture [1L]', category: 'theory', status: 'completed' },
        { id: 'ca-2-3', title: 'RISC vs CISC Architecture [1L]', category: 'theory', status: 'in-progress' },
        { id: 'ca-2-4', title: "Amdahl's Law [1L]", category: 'theory', status: 'in-progress' },
        { id: 'ca-2-5', title: 'Performance measurement parameters – MIPS, MFLOPS, SPEC ratings, CPI [2L]', category: 'theory', status: 'not-started' },
        { id: 'ca-2-6', title: 'Microprogrammed and Hardwired Control Unit [1L]', category: 'theory', status: 'not-started' },
      ],
    },
    {
      id: 'ca-3',
      number: 3,
      title: 'Memory Hierarchy & Cache Mapping',
      category: 'theory',
      topics: [
        { id: 'ca-3-1', title: 'Introduction to memory - RAM and ROM [1L]', category: 'theory', status: 'completed' },
        { id: 'ca-3-2', title: 'Register transfer, memory transfer & Tri-state bus buffer', category: 'theory', status: 'completed' },
        { id: 'ca-3-3', title: 'Memory Hierarchy: Secondary memory, Main Memory & Cache Memory [1L]', category: 'theory', status: 'in-progress' },
        { id: 'ca-3-4', title: 'Mapping Technique in cache memory: Direct, Full Associative and Set Associative [2L]', category: 'theory', status: 'in-progress' },
        { id: 'ca-3-5', title: 'Performance Implementation in Cache Memory [1L]', category: 'theory', status: 'not-started' },
        { id: 'ca-3-6', title: 'Virtual memory Concepts & Page replacement policies [1L]', category: 'theory', status: 'not-started' },
      ],
    },
    {
      id: 'ca-4',
      number: 4,
      title: 'Pipelining & Instruction-Level Parallelism',
      category: 'theory',
      topics: [
        { id: 'ca-4-1', title: 'Pipelining: Basic concepts, instruction and arithmetic pipeline [2L]', category: 'theory', status: 'completed' },
        { id: 'ca-4-2', title: 'Data hazards, control hazards, structural hazards & handling techniques [2L]', category: 'theory', status: 'in-progress' },
        { id: 'ca-4-3', title: 'Pipeline vs. Parallelism & Levels of parallelism [1L]', category: 'theory', status: 'in-progress' },
        { id: 'ca-4-4', title: 'Instruction-Level Parallelism: Basic Concepts & Techniques for Increasing ILP [2L]', category: 'theory', status: 'not-started' },
        { id: 'ca-4-5', title: 'Superscalar, Super Pipelined and VLIW Processor Architectures [2L]', category: 'theory', status: 'not-started' },
        { id: 'ca-4-6', title: 'Array and Vector Processors [1L]', category: 'theory', status: 'not-started' },
      ],
    },
    {
      id: 'ca-5',
      number: 5,
      title: 'Multiprocessor Architecture & Interconnection Networks',
      category: 'theory',
      topics: [
        { id: 'ca-5-1', title: 'Multiprocessor architecture: taxonomy of parallel architectures & Flynn Classification [1L]', category: 'theory', status: 'completed' },
        { id: 'ca-5-2', title: 'Centralized and Shared-memory architecture: synchronization [1L]', category: 'theory', status: 'in-progress' },
        { id: 'ca-5-3', title: 'Interconnection Networks: Omega, Baseline, Butterfly, Crossbar [2L]', category: 'theory', status: 'not-started' },
      ],
    },
  ],

  'Operating Systems': [
    {
      id: 'os-1',
      number: 1,
      title: 'Concepts of Operating System & Services',
      category: 'theory',
      topics: [
        { id: 'os-1-1', title: 'Concepts of Operating System & Evolution of Operating System [1L]', category: 'theory', status: 'completed' },
        { id: 'os-1-2', title: 'Types of Operating Systems (Batch, Multiprogrammed, Time-sharing, Distributed) [1L]', category: 'theory', status: 'completed' },
        { id: 'os-1-3', title: 'Structural overview of Operating Systems [1L]', category: 'theory', status: 'in-progress' },
        { id: 'os-1-4', title: 'Operating system services & System Calls [1L]', category: 'theory', status: 'not-started' },
      ],
    },
    {
      id: 'os-2',
      number: 2,
      title: 'Processes, Threads & CPU Scheduling',
      category: 'theory',
      topics: [
        { id: 'os-2-1', title: 'Concept of processes, transition of process states & Process Control Block (PCB) [2L]', category: 'theory', status: 'completed' },
        { id: 'os-2-2', title: 'Process scheduling, co-operating processes, independent process, suspended process [1L]', category: 'theory', status: 'completed' },
        { id: 'os-2-3', title: 'Threads: overview, benefits of threads, user and kernel level threads [1L]', category: 'theory', status: 'in-progress' },
        { id: 'os-2-4', title: 'CPU scheduling: Scheduling criteria, preemptive & non-preemptive scheduling [1L]', category: 'theory', status: 'in-progress' },
        { id: 'os-2-5', title: 'Scheduling algorithms (FCFS, SJF, SRTF, RR, priority, multilevel queue & feedback queue) [2L]', category: 'theory', status: 'not-started' },
        { id: 'os-2-6', title: 'Real Time scheduling: Rate Monotonic (RM) and Earliest Deadline First (EDF) [1L]', category: 'theory', status: 'not-started' },
      ],
    },
    {
      id: 'os-3',
      number: 3,
      title: 'Inter-process Communication & Synchronization',
      category: 'theory',
      topics: [
        { id: 'os-3-1', title: 'Inter-process Communication: background & critical section problem [2L]', category: 'theory', status: 'completed' },
        { id: 'os-3-2', title: "Synchronization hardware & Peterson's Solution [1L]", category: 'theory', status: 'in-progress' },
        { id: 'os-3-3', title: 'The Producer Consumer Problem & Semaphores [2L]', category: 'theory', status: 'in-progress' },
        { id: 'os-3-4', title: "Classical Problems of synchronization: Reader's & Writer Problem, Dining Philosopher Problem [2L]", category: 'theory', status: 'not-started' },
        { id: 'os-3-5', title: 'Monitors and high-level synchronization constructs [1L]', category: 'theory', status: 'not-started' },
      ],
    },
    {
      id: 'os-4',
      number: 4,
      title: 'Deadlocks: Prevention, Avoidance & Recovery',
      category: 'theory',
      topics: [
        { id: 'os-4-1', title: 'Deadlocks: Definition, Necessary and sufficient condition for deadlock [1L]', category: 'theory', status: 'completed' },
        { id: 'os-4-2', title: 'Methods for handling deadlocks: deadlock prevention [1L]', category: 'theory', status: 'in-progress' },
        { id: 'os-4-3', title: "Deadlock avoidance: Banker's algorithm [1L]", category: 'theory', status: 'not-started' },
        { id: 'os-4-4', title: 'Deadlock detection and recovery from deadlock [1L]', category: 'theory', status: 'not-started' },
      ],
    },
    {
      id: 'os-5',
      number: 5,
      title: 'Memory Management & Virtual Memory',
      category: 'theory',
      topics: [
        { id: 'os-5-1', title: 'Background, logical vs. physical address space, swapping, contiguous memory allocation [2L]', category: 'theory', status: 'completed' },
        { id: 'os-5-2', title: 'Paging, Segmentation and Translation Lookaside Buffer (TLB) [2L]', category: 'theory', status: 'in-progress' },
        { id: 'os-5-3', title: 'Virtual Memory: background & demand paging [1L]', category: 'theory', status: 'in-progress' },
        { id: 'os-5-4', title: 'Page replacement algorithms (FCFS, LRU, Optimal) [1L]', category: 'theory', status: 'not-started' },
        { id: 'os-5-5', title: 'Thrashing and Working Set Model [1L]', category: 'theory', status: 'not-started' },
      ],
    },
    {
      id: 'os-6',
      number: 6,
      title: 'Storage, Disk Management & File Systems',
      category: 'theory',
      topics: [
        { id: 'os-6-1', title: 'I/O Hardware: I/O devices, polling, interrupts, DMA, caching, buffering, blocking/non-blocking [2L]', category: 'theory', status: 'completed' },
        { id: 'os-6-2', title: 'Disk structure & disk scheduling (FCFS, SSTF, SCAN, C-SCAN, LOOK, C-LOOK) [1L]', category: 'theory', status: 'in-progress' },
        { id: 'os-6-3', title: 'Disk reliability, disk formatting, boot block, bad blocks [1L]', category: 'theory', status: 'not-started' },
        { id: 'os-6-4', title: 'File: File concept, access methods, directory structure, file system structure [1L]', category: 'theory', status: 'not-started' },
        { id: 'os-6-5', title: 'UNIX file structure & allocation methods (contiguous, linked, indexed) [1L]', category: 'theory', status: 'not-started' },
        { id: 'os-6-6', title: 'Free-space management (bit vector) [1L]', category: 'theory', status: 'not-started' },
      ],
    },
  ],

  'Design and Analysis of Algorithms': [
    {
      id: 'daa-1',
      number: 1,
      title: 'Algorithm Development & Complexity Analysis',
      category: 'theory',
      topics: [
        { id: 'daa-1-1', title: 'Stages of algorithm development for solving problems: Describing, technique identification & design [2L]', category: 'theory', status: 'completed' },
        { id: 'daa-1-2', title: 'Time and Space Complexity, Different Asymptotic notations – their mathematical significance [2L]', category: 'theory', status: 'completed' },
        { id: 'daa-1-3', title: 'Solving Recurrences: Substitution Method & Recurrence Tree Method [1L]', category: 'theory', status: 'in-progress' },
        { id: 'daa-1-4', title: 'Master Theorem (Statement and Applications) [1L]', category: 'theory', status: 'not-started' },
      ],
    },
    {
      id: 'daa-2',
      number: 2,
      title: 'Algorithm Design Techniques',
      category: 'theory',
      topics: [
        { id: 'daa-2-1', title: 'Brute force techniques – Traveling Salesman Problem (TSP) [2L]', category: 'theory', status: 'completed' },
        { id: 'daa-2-2', title: 'Divide and Conquer: Matrix multiplication (Strassen algorithm) [3L]', category: 'theory', status: 'completed' },
        { id: 'daa-2-3', title: 'Greedy techniques: Fractional Knapsack problem [2L]', category: 'theory', status: 'in-progress' },
        { id: 'daa-2-4', title: 'Job Sequencing with Deadline & Graph Coloring [3L]', category: 'theory', status: 'not-started' },
        { id: 'daa-2-5', title: "Finding Minimum Cost Spanning Trees (Prim's & Kruskal's Algorithms) [2L]", category: 'theory', status: 'not-started' },
      ],
    },
    {
      id: 'daa-3',
      number: 3,
      title: 'String Matching Algorithms',
      category: 'theory',
      topics: [
        { id: 'daa-3-1', title: 'String matching problem: Different techniques – Naive algorithm with complexity [1L]', category: 'theory', status: 'completed' },
        { id: 'daa-3-2', title: 'Knuth, Morris, Pratt (KMP) algorithm with complexity analysis [2L]', category: 'theory', status: 'in-progress' },
      ],
    },
    {
      id: 'daa-4',
      number: 4,
      title: 'Graph Algorithms & Network Flows',
      category: 'theory',
      topics: [
        { id: 'daa-4-1', title: "Single Source Shortest Path: Dijkstra's Algorithm & Bellman-Ford Algorithm [2L]", category: 'theory', status: 'completed' },
        { id: 'daa-4-2', title: 'All pair shortest path – Floyd-Warshall Algorithm [1L]', category: 'theory', status: 'in-progress' },
        { id: 'daa-4-3', title: 'Network Flows, Maximum Flows – Ford-Fulkerson Algorithm [1L]', category: 'theory', status: 'not-started' },
        { id: 'daa-4-4', title: 'Push Re-label Algorithm [1L]', category: 'theory', status: 'not-started' },
      ],
    },
    {
      id: 'daa-5',
      number: 5,
      title: 'Complexity Classes & NP-Completeness',
      category: 'theory',
      topics: [
        { id: 'daa-5-1', title: 'Complexity Classes: The Class P and The Class NP [2L]', category: 'theory', status: 'completed' },
        { id: 'daa-5-2', title: 'Reducibility and NP-completeness – SAT (without proof) & 3-SAT [3L]', category: 'theory', status: 'in-progress' },
        { id: 'daa-5-3', title: 'Vertex Cover, Independent Set & Maximum Clique Problems [2L]', category: 'theory', status: 'not-started' },
        { id: 'daa-5-4', title: 'Clique Decision problem and reduction of NP completeness [1L]', category: 'theory', status: 'not-started' },
        { id: 'daa-5-5', title: 'Overview of Approximation and Randomized Algorithms, Recent Trends [2L]', category: 'theory', status: 'not-started' },
      ],
    },
  ],

  'Advanced Artificial Intelligence': [
    {
      id: 'aai-1',
      number: 1,
      title: 'Basics of AI & Intelligent Agents',
      category: 'theory',
      topics: [
        { id: 'aai-1-1', title: 'Overview of Artificial Intelligence – Problems of AI, AI technique, Tic-Tac-Toe problem [2L]', category: 'theory', status: 'completed' },
        { id: 'aai-1-2', title: 'Intelligent Agents: Agents & environment, nature of environment, structure of agents [2L]', category: 'theory', status: 'completed' },
        { id: 'aai-1-3', title: 'Goal-based agents, utility based agents, learning agents [1L]', category: 'theory', status: 'in-progress' },
        { id: 'aai-1-4', title: 'Learning: Forms of learning, inductive learning, learning decision trees, explanation based learning [1L]', category: 'theory', status: 'not-started' },
      ],
    },
    {
      id: 'aai-2',
      number: 2,
      title: 'Different Types of Searching Algorithms',
      category: 'theory',
      topics: [
        { id: 'aai-2-1', title: 'Problem Solving: Problems, Problem Space & search (Defining problem as state space search) [3L]', category: 'theory', status: 'completed' },
        { id: 'aai-2-2', title: 'Production systems & Issues in the design of search programs [3L]', category: 'theory', status: 'in-progress' },
        { id: 'aai-2-3', title: 'Constraint satisfaction problems & Heuristics [3L]', category: 'theory', status: 'in-progress' },
        { id: 'aai-2-4', title: 'Informed vs Uninformed Search Techniques [3L]', category: 'theory', status: 'not-started' },
        { id: 'aai-2-5', title: 'Adversarial Search & Game Playing [2L]', category: 'theory', status: 'not-started' },
      ],
    },
    {
      id: 'aai-3',
      number: 3,
      title: 'Knowledge & Reasoning',
      category: 'theory',
      topics: [
        { id: 'aai-3-1', title: 'Knowledge representation issues, representation & mapping, approaches to knowledge representation [2L]', category: 'theory', status: 'completed' },
        { id: 'aai-3-2', title: 'Using predicate logic: Simple facts, instant & ISA relationship, computable functions & predicates [3L]', category: 'theory', status: 'in-progress' },
        { id: 'aai-3-3', title: 'Resolution refutation and natural deduction [2L]', category: 'theory', status: 'in-progress' },
        { id: 'aai-3-4', title: 'Representing knowledge using rules: Procedural vs declarative, forward vs backward reasoning, matching [3L]', category: 'theory', status: 'not-started' },
        { id: 'aai-3-5', title: 'Probabilistic reasoning: Representing knowledge in uncertain domains, semantics [2L]', category: 'theory', status: 'not-started' },
      ],
    },
    {
      id: 'aai-4',
      number: 4,
      title: 'Different Fields of AI & Python Implementations',
      category: 'theory',
      topics: [
        { id: 'aai-4-1', title: 'Natural Language Processing: Syntactic processing, semantic analysis [1L]', category: 'theory', status: 'completed' },
        { id: 'aai-4-2', title: 'Discourse and pragmatic processing in NLP [1L]', category: 'theory', status: 'in-progress' },
        { id: 'aai-4-3', title: 'Expert Systems: Representing and using domain knowledge, expert system shells, knowledge acquisition [1L]', category: 'theory', status: 'not-started' },
        { id: 'aai-4-4', title: 'Basic knowledge of programming language like Python for AI applications [1L]', category: 'theory', status: 'not-started' },
      ],
    },
  ],

  'Introduction to Artificial Intelligence': [
    {
      id: 'iai-1',
      number: 1,
      title: 'Introduction to Artificial Intelligence',
      category: 'theory',
      topics: [
        { id: 'iai-1-1', title: 'Why AI, Definition of AI, Goals of AI & History and evolution of AI [1L]', category: 'theory', status: 'completed' },
        { id: 'iai-1-2', title: 'Types of AI: Narrow AI, General AI & Super AI [1L]', category: 'theory', status: 'completed' },
        { id: 'iai-1-3', title: 'Turing Test & Current state of AI systems [1L]', category: 'theory', status: 'in-progress' },
      ],
    },
    {
      id: 'iai-2',
      number: 2,
      title: 'Intelligent Agents and Logic-Based Thinking',
      category: 'theory',
      topics: [
        { id: 'iai-2-1', title: 'Intelligent systems, Agents and environments [2L]', category: 'theory', status: 'completed' },
        { id: 'iai-2-2', title: 'Decision making using rules and logic [2L]', category: 'theory', status: 'in-progress' },
        { id: 'iai-2-3', title: 'Symbolic AI & Expert Systems Architecture [2L]', category: 'theory', status: 'in-progress' },
        { id: 'iai-2-4', title: 'Agent architectures: Reactive, Model-based, Goal-based and Utility-based [2L]', category: 'theory', status: 'not-started' },
      ],
    },
    {
      id: 'iai-3',
      number: 3,
      title: 'Overview of AI Branches and Perception',
      category: 'theory',
      topics: [
        { id: 'iai-3-1', title: 'Machine learning and deep learning foundations [2L]', category: 'theory', status: 'completed' },
        { id: 'iai-3-2', title: 'Natural language processing & Speech recognition [2L]', category: 'theory', status: 'in-progress' },
        { id: 'iai-3-3', title: 'Computer vision and image understanding [2L]', category: 'theory', status: 'not-started' },
        { id: 'iai-3-4', title: 'Robotics, Sensors & Autonomous Navigation [2L]', category: 'theory', status: 'not-started' },
      ],
    },
    {
      id: 'iai-4',
      number: 4,
      title: 'Basics of Machine Learning',
      category: 'theory',
      topics: [
        { id: 'iai-4-1', title: 'What is machine learning: AI vs ML [2L]', category: 'theory', status: 'completed' },
        { id: 'iai-4-2', title: 'Types of learning: supervised, unsupervised & reinforcement learning [2L]', category: 'theory', status: 'in-progress' },
        { id: 'iai-4-3', title: 'Concept of dataset: Training, Validation and Test data [2L]', category: 'theory', status: 'not-started' },
      ],
    },
    {
      id: 'iai-5',
      number: 5,
      title: 'Applications and Ethics of AI',
      category: 'theory',
      topics: [
        { id: 'iai-5-1', title: 'AI in robotics and automation [1L]', category: 'theory', status: 'completed' },
        { id: 'iai-5-2', title: 'AI-enabled smart applications: Healthcare, Agriculture, Industry 4.0 [2L]', category: 'theory', status: 'in-progress' },
        { id: 'iai-5-3', title: 'Ethics in AI: Bias, Fairness, Transparency, Privacy and Safety [2L]', category: 'theory', status: 'not-started' },
      ],
    },
  ],

  'Internet of Things': [
    {
      id: 'iot-1',
      number: 1,
      title: 'Fundamentals of IoT',
      category: 'theory',
      topics: [
        { id: 'iot-1-1', title: 'The Internet of Things, Time for Convergence, Towards the IoT Universe [2L]', category: 'theory', status: 'completed' },
        { id: 'iot-1-2', title: 'Internet of Things Vision, IoT Strategic Research and Innovation Directions [2L]', category: 'theory', status: 'completed' },
        { id: 'iot-1-3', title: 'IoT Applications, Future Internet Technologies, Infrastructure [1L]', category: 'theory', status: 'in-progress' },
        { id: 'iot-1-4', title: 'Networks and Communication, Design challenges, Development challenges, Security challenges [2L]', category: 'theory', status: 'not-started' },
      ],
    },
    {
      id: 'iot-2',
      number: 2,
      title: 'Wireless Sensor Network & Communication Aspects',
      category: 'theory',
      topics: [
        { id: 'iot-2-1', title: 'Wireless Sensor Network (WSN) Architecture & Communication aspects [2L]', category: 'theory', status: 'completed' },
        { id: 'iot-2-2', title: 'Wireless medium access issues, MAC protocol [2L]', category: 'theory', status: 'in-progress' },
        { id: 'iot-2-3', title: 'Routing protocols for Wireless Sensor Networks [1L]', category: 'theory', status: 'not-started' },
        { id: 'iot-2-4', title: 'Sensor deployment & Node discovery, Data aggregation & dissemination [1L]', category: 'theory', status: 'not-started' },
      ],
    },
    {
      id: 'iot-3',
      number: 3,
      title: 'IoT and M2M Perspectives & Architecture',
      category: 'theory',
      topics: [
        { id: 'iot-3-1', title: 'IoT and M2M Basic Perspective: Introduction, Definitions, M2M Value Chains, IoT Value Chains [2L]', category: 'theory', status: 'completed' },
        { id: 'iot-3-2', title: 'An emerging industrial structure for IoT, International driven global value chain [2L]', category: 'theory', status: 'in-progress' },
        { id: 'iot-3-3', title: 'M2M to IoT Architectural Overview: Building an architecture, Main design principles [2L]', category: 'theory', status: 'not-started' },
        { id: 'iot-3-4', title: 'IoT architecture outline, standards considerations [1L]', category: 'theory', status: 'not-started' },
      ],
    },
    {
      id: 'iot-4',
      number: 4,
      title: 'IoT Architecture Reference Model',
      category: 'theory',
      topics: [
        { id: 'iot-4-1', title: 'Architecture Reference Model: Introduction, Reference Model and architecture [2L]', category: 'theory', status: 'completed' },
        { id: 'iot-4-2', title: 'IoT Reference Architecture Introduction, Functional View [2L]', category: 'theory', status: 'in-progress' },
        { id: 'iot-4-3', title: 'Information View, Deployment and Operational View [2L]', category: 'theory', status: 'not-started' },
        { id: 'iot-4-4', title: 'Other Relevant architectural views [1L]', category: 'theory', status: 'not-started' },
      ],
    },
    {
      id: 'iot-5',
      number: 5,
      title: 'IoT Applications for Value Creations',
      category: 'practical',
      topics: [
        { id: 'iot-5-1', title: 'Introduction to Arduino and Raspberry Pi [1L]', category: 'practical', status: 'completed' },
        { id: 'iot-5-2', title: 'Cloud Computing, Fog Computing, Connected Vehicles [1L]', category: 'practical', status: 'in-progress' },
        { id: 'iot-5-3', title: 'Data Aggregation for the IoT in Smart Cities [1L]', category: 'practical', status: 'in-progress' },
        { id: 'iot-5-4', title: 'IoT applications for industry: Future Factory Concepts, Brownfield IoT, Smart Objects [1L]', category: 'practical', status: 'not-started' },
        { id: 'iot-5-5', title: 'Value Creation from Big Data, IoT in healthcare, smart home Management [1L]', category: 'practical', status: 'not-started' },
      ],
    },
    {
      id: 'iot-6',
      number: 6,
      title: 'IoT Privacy, Security and Governance',
      category: 'theory',
      topics: [
        { id: 'iot-6-1', title: 'Internet of Things Privacy, Security and Governance Introduction [1L]', category: 'theory', status: 'completed' },
        { id: 'iot-6-2', title: 'Overview of Governance, Privacy and Security Issues [1L]', category: 'theory', status: 'in-progress' },
        { id: 'iot-6-3', title: 'Trust in IoT-Data Platforms for Smart Cities, First Steps Towards a Secure Platform, Smartie Approach [1L]', category: 'theory', status: 'not-started' },
        { id: 'iot-6-4', title: 'Data Aggregation and Security for the IoT in smart cities [1L]', category: 'theory', status: 'not-started' },
      ],
    },
  ],

  'Discrete Mathematics': [
    {
      id: 'dm-1',
      number: 1,
      title: 'Set Theory, Posets, Lattices & Combinatorics',
      category: 'theory',
      topics: [
        { id: 'dm-1-1', title: 'Relation: Types of Relations, Properties of Binary Relation, Equivalence Relation [2L]', category: 'theory', status: 'completed' },
        { id: 'dm-1-2', title: 'Partial Ordering Relation and Posets, Lattices [2L]', category: 'theory', status: 'completed' },
        { id: 'dm-1-3', title: 'Combinatorics: Principle of Inclusion Exclusion, Pigeon Hole Principle [2L]', category: 'theory', status: 'in-progress' },
        { id: 'dm-1-4', title: 'Generating functions & Recurrence relations: Formulation of counting problems [3L]', category: 'theory', status: 'not-started' },
      ],
    },
    {
      id: 'dm-2',
      number: 2,
      title: 'Propositional Logic',
      category: 'theory',
      topics: [
        { id: 'dm-2-1', title: 'Basics of Boolean Logic, Idea of Propositional Logic, well-formed formula, Logical Connectives [1L]', category: 'theory', status: 'completed' },
        { id: 'dm-2-2', title: 'Truth tables, Tautology, Contradiction, Algebra of proposition, Logical Equivalence [2L]', category: 'theory', status: 'in-progress' },
        { id: 'dm-2-3', title: 'Normal Forms: Disjunctive Normal Forms (DNF) and Conjunctive Normal Forms (CNF) [2L]', category: 'theory', status: 'not-started' },
      ],
    },
    {
      id: 'dm-3',
      number: 3,
      title: 'Number Theory',
      category: 'theory',
      topics: [
        { id: 'dm-3-1', title: 'Well-Ordering Principle, Divisibility theory and properties of Divisibility [1L]', category: 'theory', status: 'completed' },
        { id: 'dm-3-2', title: 'Fundamental theorem of Arithmetic, Prime and Composite Numbers [1L]', category: 'theory', status: 'in-progress' },
        { id: 'dm-3-3', title: 'Greatest Common Divisor and Euclidean Algorithm [1L]', category: 'theory', status: 'not-started' },
        { id: 'dm-3-4', title: 'Congruence, Residue Classes [1L]', category: 'theory', status: 'not-started' },
      ],
    },
    {
      id: 'dm-4',
      number: 4,
      title: 'Algebraic Structures',
      category: 'theory',
      topics: [
        { id: 'dm-4-1', title: 'Concepts of Groups, Subgroups and Order, Cyclic Groups, Cosets [2L]', category: 'theory', status: 'completed' },
        { id: 'dm-4-2', title: "Lagrange's theorem, Normal Subgroups, Permutation Groups and Symmetric Groups [3L]", category: 'theory', status: 'in-progress' },
        { id: 'dm-4-3', title: 'Definition of Ring and Field [3L]', category: 'theory', status: 'not-started' },
      ],
    },
    {
      id: 'dm-5',
      number: 5,
      title: 'Graph Theory & Trees',
      category: 'theory',
      topics: [
        { id: 'dm-5-1', title: 'Graph theory, Digraphs, Weighted Graph, Walk, Path, Circuit, Connected & Disconnected Graph [2L]', category: 'theory', status: 'completed' },
        { id: 'dm-5-2', title: 'Bipartite Graph, Complement of a Graph, Regular Graph, Complete Graph [1L]', category: 'theory', status: 'in-progress' },
        { id: 'dm-5-3', title: 'Adjacency and Incidence matrices of a graph, Dijkstra’s algorithm [2L]', category: 'theory', status: 'in-progress' },
        { id: 'dm-5-4', title: 'Tree, Binary Tree, Theorems on Tree (statement only) [1L]', category: 'theory', status: 'not-started' },
        { id: 'dm-5-5', title: 'Spanning Tree, Minimal Spanning Tree (Kruskal’s Algorithm, Prim’s Algorithm) [2L]', category: 'theory', status: 'not-started' },
      ],
    },
  ],

  'Digital Logic and Computer Organization': [
    {
      id: 'dl-1',
      number: 1,
      title: 'Number Systems, Boolean Algebra, and Logic Simplification',
      category: 'theory',
      topics: [
        { id: 'dl-1-1', title: 'Binary, BCD, ASCII, EBCDIC, Gray Code & conversions [1L]', category: 'theory', status: 'completed' },
        { id: 'dl-1-2', title: 'Boolean Algebra – Laws, Theorems [1L]', category: 'theory', status: 'completed' },
        { id: 'dl-1-3', title: 'Boolean Functions, Minterm & Maxterm, SOP & POS Forms [2L]', category: 'theory', status: 'in-progress' },
        { id: 'dl-1-4', title: 'Karnaugh Map (up to 4-variable), Algebraic Simplification [2L]', category: 'theory', status: 'not-started' },
      ],
    },
    {
      id: 'dl-2',
      number: 2,
      title: 'Combinational Circuits',
      category: 'theory',
      topics: [
        { id: 'dl-2-1', title: 'Half & Full Adder/Subtractor, Serial & Parallel Adders, CLA Adder [2L]', category: 'theory', status: 'completed' },
        { id: 'dl-2-2', title: 'Parity Generator & Checker, Magnitude Comparator [1L]', category: 'theory', status: 'in-progress' },
        { id: 'dl-2-3', title: 'Encoders, Priority Encoders & Decoders (3-to-8 Decoder) [1L]', category: 'theory', status: 'in-progress' },
        { id: 'dl-2-4', title: 'Multiplexers & Demultiplexers Implementation and Logic Synthesis [2L]', category: 'theory', status: 'not-started' },
      ],
    },
    {
      id: 'dl-3',
      number: 3,
      title: 'Sequential Circuits & Registers',
      category: 'theory',
      topics: [
        { id: 'dl-3-1', title: 'Flip-Flops: SR, JK, Master-Slave JK, D, T; Characteristic & Excitation Tables [2L]', category: 'theory', status: 'completed' },
        { id: 'dl-3-2', title: 'Registers: SISO, SIPO, PISO, PIPO & Universal Shift Registers [2L]', category: 'theory', status: 'in-progress' },
        { id: 'dl-3-3', title: 'Asynchronous (Ripple) and Synchronous Binary Counters [2L]', category: 'theory', status: 'not-started' },
      ],
    },
    {
      id: 'dl-4',
      number: 4,
      title: 'Data Representation & Arithmetic Operations',
      category: 'theory',
      topics: [
        { id: 'dl-4-1', title: 'Integer Arithmetic (Add, Subtract), Booth’s Multiplication Algorithm [2L]', category: 'theory', status: 'completed' },
        { id: 'dl-4-2', title: 'Restoring and Non-Restoring Division Algorithms [1L]', category: 'theory', status: 'in-progress' },
        { id: 'dl-4-3', title: 'Floating-Point Representation (IEEE 754 Standard) & Operations [2L]', category: 'theory', status: 'not-started' },
      ],
    },
    {
      id: 'dl-5',
      number: 5,
      title: 'CPU and Control Unit Organization',
      category: 'theory',
      topics: [
        { id: 'dl-5-1', title: 'Register Transfer Language (RTL), Bus Architecture, Micro-operations [1L]', category: 'theory', status: 'completed' },
        { id: 'dl-5-2', title: 'ALSU Design, Accumulator Architecture & General Register Organization [2L]', category: 'theory', status: 'in-progress' },
        { id: 'dl-5-3', title: 'Instruction Format, Addressing Modes & Instruction Cycle [2L]', category: 'theory', status: 'not-started' },
        { id: 'dl-5-4', title: 'Control Unit: Hardwired Control vs Microprogrammed Control [1L]', category: 'theory', status: 'not-started' },
      ],
    },
    {
      id: 'dl-6',
      number: 6,
      title: 'Memory & I/O Organization',
      category: 'theory',
      topics: [
        { id: 'dl-6-1', title: 'RAM, ROM Types, Memory Hierarchy: Cache, Main, Secondary [1L]', category: 'theory', status: 'completed' },
        { id: 'dl-6-2', title: 'Cache Mapping: Direct, Fully Associative, Set-Associative & Replacement Policies [2L]', category: 'theory', status: 'in-progress' },
        { id: 'dl-6-3', title: 'Virtual Memory, Paging, Page Fault & Address Translation [2L]', category: 'theory', status: 'not-started' },
        { id: 'dl-6-4', title: 'I/O Organization: Programmed I/O, Interrupt-Driven I/O & DMA Controller [2L]', category: 'theory', status: 'not-started' },
      ],
    },
  ],

  'Engineering Mathematics–II': [
    {
      id: 'm2-1',
      number: 1,
      title: 'Ordinary Differential Equations of Higher Order',
      category: 'theory',
      topics: [
        { id: 'm2-1-1', title: 'Linear ODE with Constant Coefficients [2L]', category: 'theory', status: 'completed' },
        { id: 'm2-1-2', title: 'Cauchy-Euler Equations & Method of Variation of Parameters [2L]', category: 'theory', status: 'in-progress' },
        { id: 'm2-1-3', title: 'Applications in Mechanical & Electrical Vibrations [1L]', category: 'theory', status: 'not-started' },
      ],
    },
    {
      id: 'm2-2',
      number: 2,
      title: 'Linear Algebra, Matrices & Vector Spaces',
      category: 'theory',
      topics: [
        { id: 'm2-2-1', title: 'Eigenvalues and Eigenvectors of Real Matrices [2L]', category: 'theory', status: 'completed' },
        { id: 'm2-2-2', title: 'Cayley-Hamilton Theorem & Matrix Diagonalization [2L]', category: 'theory', status: 'not-started' },
        { id: 'm2-2-3', title: 'Orthogonal Matrices & Quadratic Forms [1L]', category: 'theory', status: 'not-started' },
      ],
    },
    {
      id: 'm2-3',
      number: 3,
      title: 'Functions of Several Variables & Partial Differentiation',
      category: 'theory',
      topics: [
        { id: 'm2-3-1', title: 'Limits, Continuity and Partial Derivatives [2L]', category: 'theory', status: 'completed' },
        { id: 'm2-3-2', title: "Euler's Theorem on Homogeneous Functions [1L]", category: 'theory', status: 'not-started' },
        { id: 'm2-3-3', title: 'Maxima and Minima & Lagrange Multipliers [2L]', category: 'theory', status: 'not-started' },
      ],
    },
    {
      id: 'm2-4',
      number: 4,
      title: 'Multiple Integrals & Vector Calculus',
      category: 'theory',
      topics: [
        { id: 'm2-4-1', title: 'Double and Triple Integrals (Cartesian & Polar) [2L]', category: 'theory', status: 'completed' },
        { id: 'm2-4-2', title: 'Gradient, Divergence and Curl of Vector Fields [2L]', category: 'theory', status: 'in-progress' },
        { id: 'm2-4-3', title: "Green's, Gauss Divergence & Stokes' Theorems [2L]", category: 'theory', status: 'not-started' },
      ],
    },
  ],

  'Engineering Chemistry': [
    {
      id: 'ch-chem-1',
      number: 1,
      title: 'Atomic & Molecular Structure',
      category: 'theory',
      topics: [
        { id: 'ch-chem-1-1', title: 'Molecular Orbital Theory of Diatomic Molecules (O2, N2, CO) [2L]', category: 'theory', status: 'completed' },
        { id: 'ch-chem-1-2', title: 'Band Theory of Solids & Semiconductors [2L]', category: 'theory', status: 'not-started' },
      ],
    },
    {
      id: 'ch-chem-2',
      number: 2,
      title: 'Spectroscopic Techniques & Applications',
      category: 'theory',
      topics: [
        { id: 'ch-chem-2-1', title: 'Principles of UV-Visible & IR Spectroscopy [2L]', category: 'theory', status: 'completed' },
        { id: 'ch-chem-2-2', title: 'NMR Spectroscopy & Magnetic Resonance Imaging [2L]', category: 'theory', status: 'not-started' },
      ],
    },
    {
      id: 'ch-chem-3',
      number: 3,
      title: 'Thermodynamics, Electrochemistry & Corrosion',
      category: 'theory',
      topics: [
        { id: 'ch-chem-3-1', title: 'Free Energy, Entropy & Chemical Equilibria [2L]', category: 'theory', status: 'completed' },
        { id: 'ch-chem-3-2', title: 'Nernst Equation & Electrochemical Cells [2L]', category: 'theory', status: 'in-progress' },
        { id: 'ch-chem-3-3', title: 'Corrosion Mechanisms & Cathodic Protection [1L]', category: 'theory', status: 'not-started' },
      ],
    },
    {
      id: 'ch-chem-4',
      number: 4,
      title: 'Polymers & Smart Nanomaterials',
      category: 'theory',
      topics: [
        { id: 'ch-chem-4-1', title: 'Conducting Polymers & Polymer Composites [2L]', category: 'theory', status: 'completed' },
        { id: 'ch-chem-4-2', title: 'Carbon Nanotubes & Graphene Applications [1L]', category: 'theory', status: 'not-started' },
      ],
    },
  ],

  'Constitution of India & Professional Ethics': [
    {
      id: 'const-1',
      number: 1,
      title: 'History & Philosophical Foundations of Constitution',
      category: 'theory',
      topics: [
        { id: 'const-1-1', title: 'Historical Background & Drafting of Indian Constitution [2L]', category: 'theory', status: 'completed' },
        { id: 'const-1-2', title: 'Preamble: Sovereign, Socialist, Secular, Democratic, Republic [1L]', category: 'theory', status: 'completed' },
        { id: 'const-1-3', title: 'Salient Features & Citizenship Provisions [1L]', category: 'theory', status: 'in-progress' },
      ],
    },
    {
      id: 'const-2',
      number: 2,
      title: 'Fundamental Rights & Directive Principles (DPSP)',
      category: 'theory',
      topics: [
        { id: 'const-2-1', title: 'Fundamental Rights (Articles 14 to 32) & Reasonable Restrictions [2L]', category: 'theory', status: 'completed' },
        { id: 'const-2-2', title: 'Constitutional Remedies & Writs (Habeas Corpus, Mandamus, Quo-Warranto) [1L]', category: 'theory', status: 'in-progress' },
        { id: 'const-2-3', title: 'Directive Principles of State Policy & Fundamental Duties [1L]', category: 'theory', status: 'not-started' },
      ],
    },
    {
      id: 'const-3',
      number: 3,
      title: 'Union & State Executive and Judiciary',
      category: 'theory',
      topics: [
        { id: 'const-3-1', title: 'President, Prime Minister, Council of Ministers & Parliament [2L]', category: 'theory', status: 'completed' },
        { id: 'const-3-2', title: 'Supreme Court of India, High Courts & Judicial Review [1L]', category: 'theory', status: 'in-progress' },
        { id: 'const-3-3', title: 'Emergency Provisions & Constitutional Amendments (Article 368) [1L]', category: 'theory', status: 'not-started' },
      ],
    },
    {
      id: 'const-4',
      number: 4,
      title: 'Engineering & Professional Ethics',
      category: 'theory',
      topics: [
        { id: 'const-4-1', title: 'Professional Responsibilities, Integrity & Conflict of Interest [1L]', category: 'theory', status: 'completed' },
        { id: 'const-4-2', title: 'Intellectual Property Rights, Cyber Ethics & Environmental Stewardship [1L]', category: 'theory', status: 'in-progress' },
        { id: 'const-4-3', title: 'Whistleblowing & Global Ethical Dilemmas in Technology [1L]', category: 'theory', status: 'not-started' },
      ],
    },
  ],

  'Design Thinking & Innovation': [
    {
      id: 'dt-1',
      number: 1,
      title: 'Foundations of Design Thinking',
      category: 'theory',
      topics: [
        { id: 'dt-1-1', title: 'Design Mindsets & Human-Centered Design Cycle [2L]', category: 'theory', status: 'completed' },
        { id: 'dt-1-2', title: 'Empathy Mapping & User Need Discovery [2L]', category: 'theory', status: 'not-started' },
      ],
    },
    {
      id: 'dt-2',
      number: 2,
      title: 'Problem Framing & Creative Ideation',
      category: 'practical',
      topics: [
        { id: 'dt-2-1', title: 'POV Statements & How-Might-We Questions [2L]', category: 'practical', status: 'completed' },
        { id: 'dt-2-2', title: 'Brainstorming, SCAMPER & Concept Selection [2L]', category: 'practical', status: 'in-progress' },
      ],
    },
    {
      id: 'dt-3',
      number: 3,
      title: 'Rapid Prototyping & Field Validation',
      category: 'practical',
      topics: [
        { id: 'dt-3-1', title: 'Low-Fidelity Physical & Digital Prototypes [2L]', category: 'practical', status: 'in-progress' },
        { id: 'dt-3-2', title: 'Usability Testing & Iterative Feedback Loops [2L]', category: 'practical', status: 'not-started' },
      ],
    },
  ],
};

// Fuzzy matcher for subject presets
export function getPresetForSubject(subjectName: string): ChapterItem[] | null {
  const norm = subjectName.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const [key, preset] of Object.entries(SUBJECT_PRESETS)) {
    const keyNorm = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (norm === keyNorm || norm.includes(keyNorm) || keyNorm.includes(norm)) {
      return preset;
    }
  }
  return null;
}
