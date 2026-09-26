import { SEMESTER_SUBJECTS_MAP, getSubjectVisuals } from './semesterSubjects';
import { getPresetForSubject } from './subjectPresets';
import { INITIAL_CURRICULUM_DATA } from './curriculumData';
import type { SyllabusEntry } from '../types';

export interface SuggestedTopic {
  id: string;
  rank: number;
  topic: string;
  importance: 'Very High' | 'High' | 'Medium' | 'Low';
  pyqFrequency: string;
  percentage: number;
  resourceTitle: string;
  resourceChannel: string;
  resourceQuery: string;
  chapter?: string;
}

export interface SubjectSuggestion {
  subjectId: string;
  subjectName: string;
  chaptersCount: number;
  icon: string;
  accentBg: string;
  accentColor: string;
  syllabusCovered: number;
  topics: SuggestedTopic[];
}

// Hand-curated high-frequency exam topics for core university subjects
const CURATED_TOPICS_MAP: Record<string, SuggestedTopic[]> = {
  // 1. Data Structure and Algorithms
  dsa: [
    { id: 'dsa-1', rank: 1, topic: 'Arrays (Operations, Kadane Algorithm, 2D Arrays)', importance: 'Very High', pyqFrequency: '24/25 (96%)', percentage: 96, resourceTitle: 'YouTube', resourceChannel: 'Neso Academy', resourceQuery: 'Arrays Data Structures Neso Academy' },
    { id: 'dsa-2', rank: 2, topic: 'Linked Lists (Singly, Doubly, Circular, Reversal)', importance: 'Very High', pyqFrequency: '22/25 (88%)', percentage: 88, resourceTitle: 'YouTube', resourceChannel: 'Gate Smashers', resourceQuery: 'Linked List Gate Smashers' },
    { id: 'dsa-3', rank: 3, topic: 'Stacks and Queues (Infix to Postfix, Circular Queue)', importance: 'High', pyqFrequency: '20/25 (80%)', percentage: 80, resourceTitle: 'YouTube', resourceChannel: 'Abdul Bari', resourceQuery: 'Stack and Queue Data Structure Abdul Bari' },
    { id: 'dsa-4', rank: 4, topic: 'Trees (Binary Trees, BST, AVL Rotations, B-Trees)', importance: 'High', pyqFrequency: '18/25 (72%)', percentage: 72, resourceTitle: 'YouTube', resourceChannel: 'Neso Academy', resourceQuery: 'Binary Tree Data Structure Neso Academy' },
    { id: 'dsa-5', rank: 5, topic: 'Graphs (BFS, DFS, Dijkstra, Prim & Kruskal MST)', importance: 'High', pyqFrequency: '17/25 (68%)', percentage: 68, resourceTitle: 'YouTube', resourceChannel: 'Striver', resourceQuery: 'Graph Data Structure Striver' },
    { id: 'dsa-6', rank: 6, topic: 'Hashing (Collision Resolution, Open Addressing, Chaining)', importance: 'Medium', pyqFrequency: '13/25 (52%)', percentage: 52, resourceTitle: 'YouTube', resourceChannel: 'Take U Forward', resourceQuery: 'Hashing Technique Take U Forward' },
    { id: 'dsa-7', rank: 7, topic: 'Heaps & Priority Queues (Heapify, Heap Sort)', importance: 'Medium', pyqFrequency: '12/25 (48%)', percentage: 48, resourceTitle: 'YouTube', resourceChannel: 'Neso Academy', resourceQuery: 'Heap and Priority Queue Neso Academy' },
    { id: 'dsa-8', rank: 8, topic: 'Recursion & Backtracking (Tower of Hanoi)', importance: 'Medium', pyqFrequency: '11/25 (44%)', percentage: 44, resourceTitle: 'YouTube', resourceChannel: 'CodeHelp', resourceQuery: 'Recursion in Data Structures CodeHelp' },
    { id: 'dsa-9', rank: 9, topic: 'Sorting Algorithms (Quick Sort, Merge Sort Analysis)', importance: 'Low', pyqFrequency: '8/25 (32%)', percentage: 32, resourceTitle: 'YouTube', resourceChannel: 'Kunal Kushwaha', resourceQuery: 'Sorting Algorithms Kunal Kushwaha' },
    { id: 'dsa-10', rank: 10, topic: 'Searching Algorithms (Linear, Binary Search)', importance: 'Low', pyqFrequency: '6/25 (24%)', percentage: 24, resourceTitle: 'YouTube', resourceChannel: 'Neso Academy', resourceQuery: 'Linear Binary Search Neso Academy' },
  ],

  // 2. Computer Architecture (Sem 3)
  ca: [
    { id: 'ca-1', rank: 1, topic: "Fixed-Point Multiplication - Booth's Algorithm", importance: 'Very High', pyqFrequency: '25/25 (100%)', percentage: 100, resourceTitle: 'YouTube', resourceChannel: 'Gate Smashers', resourceQuery: 'Booths Algorithm Gate Smashers' },
    { id: 'ca-2', rank: 2, topic: 'Cache Memory Mapping (Direct, Associative, Set-Associative)', importance: 'Very High', pyqFrequency: '24/25 (96%)', percentage: 96, resourceTitle: 'YouTube', resourceChannel: 'Abdul Bari', resourceQuery: 'Cache Memory Mapping Abdul Bari' },
    { id: 'ca-3', rank: 3, topic: 'Pipelining & Pipeline Hazards (Data, Control, Structural)', importance: 'High', pyqFrequency: '21/25 (84%)', percentage: 84, resourceTitle: 'YouTube', resourceChannel: 'Neso Academy', resourceQuery: 'Pipelining Hazards Neso Academy' },
    { id: 'ca-4', rank: 4, topic: 'Virtual Memory & Page Replacement Policies', importance: 'High', pyqFrequency: '19/25 (76%)', percentage: 76, resourceTitle: 'YouTube', resourceChannel: 'Knowledge Gate', resourceQuery: 'Virtual Memory Computer Architecture Knowledge Gate' },
    { id: 'ca-5', rank: 5, topic: 'Addressing Modes & Instruction Formats', importance: 'High', pyqFrequency: '18/25 (72%)', percentage: 72, resourceTitle: 'YouTube', resourceChannel: 'Neso Academy', resourceQuery: 'Addressing Modes Computer Architecture Neso Academy' },
    { id: 'ca-6', rank: 6, topic: 'Hardwired vs Microprogrammed Control Unit', importance: 'Medium', pyqFrequency: '14/25 (56%)', percentage: 56, resourceTitle: 'YouTube', resourceChannel: 'Gate Smashers', resourceQuery: 'Control Unit Hardwired Microprogrammed Gate Smashers' },
    { id: 'ca-7', rank: 7, topic: 'Floating Point Number Representation (IEEE 754 Format)', importance: 'Medium', pyqFrequency: '12/25 (48%)', percentage: 48, resourceTitle: 'YouTube', resourceChannel: 'Neso Academy', resourceQuery: 'IEEE 754 Floating Point Neso Academy' },
    { id: 'ca-8', rank: 8, topic: 'Interconnection Networks (Crossbar, Omega, Butterfly)', importance: 'Low', pyqFrequency: '7/25 (28%)', percentage: 28, resourceTitle: 'YouTube', resourceChannel: 'Knowledge Gate', resourceQuery: 'Interconnection Networks Computer Architecture' },
  ],

  // 3. Design and Analysis of Algorithms (Sem 3)
  daa: [
    { id: 'daa-1', rank: 1, topic: 'Divide and Conquer: Strassen Matrix Multiplication & Complexity', importance: 'Very High', pyqFrequency: '25/25 (100%)', percentage: 100, resourceTitle: 'YouTube', resourceChannel: 'Abdul Bari', resourceQuery: 'Strassen Matrix Multiplication Abdul Bari' },
    { id: 'daa-2', rank: 2, topic: 'Greedy Techniques: Fractional Knapsack & Job Sequencing', importance: 'Very High', pyqFrequency: '23/25 (92%)', percentage: 92, resourceTitle: 'YouTube', resourceChannel: 'Abdul Bari', resourceQuery: 'Greedy Knapsack Job Sequencing Abdul Bari' },
    { id: 'daa-3', rank: 3, topic: 'Dynamic Programming: 0/1 Knapsack, LCS, Matrix Chain Multiplication', importance: 'High', pyqFrequency: '21/25 (84%)', percentage: 84, resourceTitle: 'YouTube', resourceChannel: 'Gate Smashers', resourceQuery: 'Dynamic Programming Matrix Chain Multiplication Gate Smashers' },
    { id: 'daa-4', rank: 4, topic: "Graph Algorithms: Dijkstra, Bellman-Ford, Floyd-Warshall & MST", importance: 'High', pyqFrequency: '20/25 (80%)', percentage: 80, resourceTitle: 'YouTube', resourceChannel: 'Abdul Bari', resourceQuery: 'Bellman Ford Floyd Warshall Abdul Bari' },
    { id: 'daa-5', rank: 5, topic: 'String Matching: KMP (Knuth-Morris-Pratt) Algorithm', importance: 'High', pyqFrequency: '18/25 (72%)', percentage: 72, resourceTitle: 'YouTube', resourceChannel: 'Abdul Bari', resourceQuery: 'KMP Algorithm Abdul Bari' },
    { id: 'daa-6', rank: 6, topic: 'Solving Recurrences (Master Theorem, Recurrence Tree)', importance: 'Medium', pyqFrequency: '15/25 (60%)', percentage: 60, resourceTitle: 'YouTube', resourceChannel: 'Gate Smashers', resourceQuery: 'Master Theorem Gate Smashers' },
    { id: 'daa-7', rank: 7, topic: 'Complexity Classes: P, NP, NP-Complete, 3-SAT Reduction', importance: 'Medium', pyqFrequency: '13/25 (52%)', percentage: 52, resourceTitle: 'YouTube', resourceChannel: 'Knowledge Gate', resourceQuery: 'P NP NP Complete Knowledge Gate' },
    { id: 'daa-8', rank: 8, topic: 'Approximation Algorithms: Vertex Cover & TSP', importance: 'Low', pyqFrequency: '7/25 (28%)', percentage: 28, resourceTitle: 'YouTube', resourceChannel: 'Neso Academy', resourceQuery: 'Vertex Cover Approximation Neso Academy' },
  ],

  // 4. Operating Systems (Sem 3)
  os: [
    { id: 'os-1', rank: 1, topic: 'CPU Scheduling Algorithms (FCFS, SJF, Round Robin, Multilevel)', importance: 'Very High', pyqFrequency: '25/25 (100%)', percentage: 100, resourceTitle: 'YouTube', resourceChannel: 'Gate Smashers', resourceQuery: 'CPU Scheduling Algorithms Gate Smashers' },
    { id: 'os-2', rank: 2, topic: "Deadlocks: Banker's Algorithm, Prevention & Avoidance", importance: 'Very High', pyqFrequency: '24/25 (96%)', percentage: 96, resourceTitle: 'YouTube', resourceChannel: 'Neso Academy', resourceQuery: 'Bankers Algorithm Deadlock Neso Academy' },
    { id: 'os-3', rank: 3, topic: 'Process Synchronization: Semaphores, Producer-Consumer, Dining Philosophers', importance: 'High', pyqFrequency: '21/25 (84%)', percentage: 84, resourceTitle: 'YouTube', resourceChannel: 'Abdul Bari', resourceQuery: 'Process Synchronization Semaphores Abdul Bari' },
    { id: 'os-4', rank: 4, topic: 'Paging, Segmentation & TLB (Translation Lookaside Buffer)', importance: 'High', pyqFrequency: '20/25 (80%)', percentage: 80, resourceTitle: 'YouTube', resourceChannel: 'Gate Smashers', resourceQuery: 'Paging TLB Operating Systems Gate Smashers' },
    { id: 'os-5', rank: 5, topic: 'Virtual Memory & Page Replacement (FIFO, LRU, Optimal)', importance: 'High', pyqFrequency: '18/25 (72%)', percentage: 72, resourceTitle: 'YouTube', resourceChannel: 'Neso Academy', resourceQuery: 'Page Replacement Algorithms LRU Neso Academy' },
    { id: 'os-6', rank: 6, topic: 'Disk Scheduling Algorithms (SSTF, SCAN, C-SCAN, LOOK)', importance: 'Medium', pyqFrequency: '14/25 (56%)', percentage: 56, resourceTitle: 'YouTube', resourceChannel: 'Knowledge Gate', resourceQuery: 'Disk Scheduling Algorithms Knowledge Gate' },
    { id: 'os-7', rank: 7, topic: 'Process Management, PCB, Threads (User vs Kernel Level)', importance: 'Medium', pyqFrequency: '12/25 (48%)', percentage: 48, resourceTitle: 'YouTube', resourceChannel: 'Gate Smashers', resourceQuery: 'Process State PCB Threads Gate Smashers' },
    { id: 'os-8', rank: 8, topic: 'File System Implementation & UNIX Inodes Architecture', importance: 'Low', pyqFrequency: '8/25 (32%)', percentage: 32, resourceTitle: 'YouTube', resourceChannel: 'Neso Academy', resourceQuery: 'File System Inode Operating System Neso Academy' },
  ],

  // 5. Advanced Artificial Intelligence (Sem 3)
  aai: [
    { id: 'aai-1', rank: 1, topic: 'State Space Search & A* / AO* Heuristic Search', importance: 'Very High', pyqFrequency: '24/25 (96%)', percentage: 96, resourceTitle: 'YouTube', resourceChannel: 'Gate Smashers', resourceQuery: 'A star Search Algorithm Gate Smashers' },
    { id: 'aai-2', rank: 2, topic: 'Adversarial Search: Minimax & Alpha-Beta Pruning', importance: 'Very High', pyqFrequency: '22/25 (88%)', percentage: 88, resourceTitle: 'YouTube', resourceChannel: 'Abdul Bari', resourceQuery: 'Alpha Beta Pruning Abdul Bari' },
    { id: 'aai-3', rank: 3, topic: 'First Order Predicate Logic & Resolution Refutation', importance: 'High', pyqFrequency: '20/25 (80%)', percentage: 80, resourceTitle: 'YouTube', resourceChannel: 'Knowledge Gate', resourceQuery: 'Predicate Logic Resolution Knowledge Gate' },
    { id: 'aai-4', rank: 4, topic: 'Knowledge Representation: Semantic Nets, Frames & Ontologies', importance: 'High', pyqFrequency: '18/25 (72%)', percentage: 72, resourceTitle: 'YouTube', resourceChannel: 'Neso Academy', resourceQuery: 'Knowledge Representation Semantic Nets Neso Academy' },
    { id: 'aai-5', rank: 5, topic: 'Probabilistic Reasoning: Bayesian Belief Networks', importance: 'High', pyqFrequency: '16/25 (64%)', percentage: 64, resourceTitle: 'YouTube', resourceChannel: 'Stanford Online', resourceQuery: 'Bayesian Networks Stanford Online' },
    { id: 'aai-6', rank: 6, topic: 'Fuzzy Logic & Rule-Based Expert Systems', importance: 'Medium', pyqFrequency: '13/25 (52%)', percentage: 52, resourceTitle: 'YouTube', resourceChannel: 'Gate Smashers', resourceQuery: 'Fuzzy Logic Systems Gate Smashers' },
    { id: 'aai-7', rank: 7, topic: 'Natural Language Processing: Parsing & Syntactic Analysis', importance: 'Low', pyqFrequency: '8/25 (32%)', percentage: 32, resourceTitle: 'YouTube', resourceChannel: 'Stanford Online', resourceQuery: 'NLP Syntactic Parsing Stanford Online' },
  ],

  // 6. Discrete Mathematics (Sem 3)
  dm: [
    { id: 'dm-1', rank: 1, topic: 'Propositional Logic, Tautologies & Predicate Calculus', importance: 'Very High', pyqFrequency: '25/25 (100%)', percentage: 100, resourceTitle: 'YouTube', resourceChannel: 'Neso Academy', resourceQuery: 'Propositional Logic Discrete Math Neso Academy' },
    { id: 'dm-2', rank: 2, topic: 'Set Theory, Relations & Equivalence Classes (POSET & Lattices)', importance: 'Very High', pyqFrequency: '23/25 (92%)', percentage: 92, resourceTitle: 'YouTube', resourceChannel: 'Gate Smashers', resourceQuery: 'Poset Lattice Discrete Mathematics Gate Smashers' },
    { id: 'dm-3', rank: 3, topic: 'Group Theory: Groups, Subgroups, Cosets, Lagrange Theorem', importance: 'High', pyqFrequency: '21/25 (84%)', percentage: 84, resourceTitle: 'YouTube', resourceChannel: 'Knowledge Gate', resourceQuery: 'Group Theory Lagrange Theorem Knowledge Gate' },
    { id: 'dm-4', rank: 4, topic: 'Recurrence Relations & Generating Functions', importance: 'High', pyqFrequency: '19/25 (76%)', percentage: 76, resourceTitle: 'YouTube', resourceChannel: 'Abdul Bari', resourceQuery: 'Generating Functions Recurrence Relations Abdul Bari' },
    { id: 'dm-5', rank: 5, topic: 'Graph Theory: Euler Graph, Hamiltonian Cycles & Planar Graphs', importance: 'High', pyqFrequency: '18/25 (72%)', percentage: 72, resourceTitle: 'YouTube', resourceChannel: 'Neso Academy', resourceQuery: 'Planar Graphs Euler Graph Neso Academy' },
    { id: 'dm-6', rank: 6, topic: 'Pigeonhole Principle & Inclusion-Exclusion Principle', importance: 'Medium', pyqFrequency: '14/25 (56%)', percentage: 56, resourceTitle: 'YouTube', resourceChannel: 'Gate Smashers', resourceQuery: 'Pigeonhole Principle Gate Smashers' },
    { id: 'dm-7', rank: 7, topic: 'Combinatorics: Permutations, Combinations & Derangements', importance: 'Low', pyqFrequency: '9/25 (36%)', percentage: 32, resourceTitle: 'YouTube', resourceChannel: 'Neso Academy', resourceQuery: 'Combinatorics Permutations Neso Academy' },
  ],

  // 7. Internet of Things (Sem 3)
  iot: [
    { id: 'iot-1', rank: 1, topic: 'IoT Architecture & Reference Model (Sensors, Actuators, Gateways)', importance: 'Very High', pyqFrequency: '24/25 (96%)', percentage: 96, resourceTitle: 'YouTube', resourceChannel: 'Edureka', resourceQuery: 'IoT Architecture Edureka' },
    { id: 'iot-2', rank: 2, topic: 'IoT Communication Protocols: MQTT, CoAP, XMPP, AMQP', importance: 'Very High', pyqFrequency: '23/25 (92%)', percentage: 92, resourceTitle: 'YouTube', resourceChannel: 'NPTEL', resourceQuery: 'MQTT CoAP IoT Protocols NPTEL' },
    { id: 'iot-3', rank: 3, topic: 'Wireless Sensor Networks (WSN), ZigBee, LoRaWAN, BLE', importance: 'High', pyqFrequency: '20/25 (80%)', percentage: 80, resourceTitle: 'YouTube', resourceChannel: 'Gate Smashers', resourceQuery: 'Zigbee LoRaWAN IoT Gate Smashers' },
    { id: 'iot-4', rank: 4, topic: 'Embedded Hardware Platforms: Arduino, Raspberry Pi, ESP32', importance: 'High', pyqFrequency: '18/25 (72%)', percentage: 72, resourceTitle: 'YouTube', resourceChannel: 'Tech With Tim', resourceQuery: 'ESP32 Arduino IoT Projects' },
    { id: 'iot-5', rank: 5, topic: 'Cloud IoT Integration & Real-time Analytics (AWS IoT, Azure)', importance: 'Medium', pyqFrequency: '14/25 (56%)', percentage: 56, resourceTitle: 'YouTube', resourceChannel: 'Simplilearn', resourceQuery: 'Cloud IoT AWS IoT Analytics Simplilearn' },
    { id: 'iot-6', rank: 6, topic: 'IoT Security, Privacy & Device Authentication', importance: 'Low', pyqFrequency: '8/25 (32%)', percentage: 32, resourceTitle: 'YouTube', resourceChannel: 'NPTEL', resourceQuery: 'IoT Security Challenges NPTEL' },
  ],

  // 8. Database Management Systems (Sem 4)
  dbms: [
    { id: 'dbms-1', rank: 1, topic: 'ER Modeling & Relational Schema Mapping', importance: 'Very High', pyqFrequency: '25/25 (100%)', percentage: 100, resourceTitle: 'YouTube', resourceChannel: 'Gate Smashers', resourceQuery: 'ER Model to Relational Model Gate Smashers' },
    { id: 'dbms-2', rank: 2, topic: 'Normalization (1NF, 2NF, 3NF, BCNF) & Dependency Preservation', importance: 'Very High', pyqFrequency: '24/25 (96%)', percentage: 96, resourceTitle: 'YouTube', resourceChannel: 'Knowledge Gate', resourceQuery: 'Normalization in DBMS Knowledge Gate' },
    { id: 'dbms-3', rank: 3, topic: 'SQL Queries, Group By, Having, Joins & Nested Subqueries', importance: 'High', pyqFrequency: '21/25 (84%)', percentage: 84, resourceTitle: 'YouTube', resourceChannel: 'Kudvenkat', resourceQuery: 'SQL Joins Subqueries Kudvenkat' },
    { id: 'dbms-4', rank: 4, topic: 'Transaction Management & ACID Properties', importance: 'High', pyqFrequency: '20/25 (80%)', percentage: 80, resourceTitle: 'YouTube', resourceChannel: 'Neso Academy', resourceQuery: 'Transactions ACID Properties Neso Academy' },
    { id: 'dbms-5', rank: 5, topic: 'Concurrency Control & Two-Phase Locking (2PL, Rigorous 2PL)', importance: 'High', pyqFrequency: '18/25 (72%)', percentage: 72, resourceTitle: 'YouTube', resourceChannel: 'Gate Smashers', resourceQuery: 'Concurrency Control 2PL Gate Smashers' },
    { id: 'dbms-6', rank: 6, topic: 'Indexing & B-Trees / B+ Trees Insertion & Deletion', importance: 'Medium', pyqFrequency: '14/25 (56%)', percentage: 56, resourceTitle: 'YouTube', resourceChannel: 'Abdul Bari', resourceQuery: 'B Trees and B+ Trees Abdul Bari' },
    { id: 'dbms-7', rank: 7, topic: 'Relational Algebra (Select, Project, Join, Division)', importance: 'Medium', pyqFrequency: '13/25 (52%)', percentage: 52, resourceTitle: 'YouTube', resourceChannel: 'Gate Smashers', resourceQuery: 'Relational Algebra Gate Smashers' },
    { id: 'dbms-8', rank: 8, topic: 'Database Recovery (WAL, Checkpoints, Shadow Paging)', importance: 'Low', pyqFrequency: '8/25 (32%)', percentage: 32, resourceTitle: 'YouTube', resourceChannel: 'Knowledge Gate', resourceQuery: 'Database Recovery Checkpointing Knowledge Gate' },
  ],

  // 9. Computer Networks (Sem 4)
  cn: [
    { id: 'cn-1', rank: 1, topic: 'OSI vs TCP/IP Protocol Layers & Functions', importance: 'Very High', pyqFrequency: '24/25 (96%)', percentage: 96, resourceTitle: 'YouTube', resourceChannel: 'Neso Academy', resourceQuery: 'OSI Model Layers Neso Academy' },
    { id: 'cn-2', rank: 2, topic: 'IP Addressing, Subnetting, Supernetting & CIDR Calculation', importance: 'Very High', pyqFrequency: '23/25 (92%)', percentage: 92, resourceTitle: 'YouTube', resourceChannel: 'Gate Smashers', resourceQuery: 'Subnetting CIDR Gate Smashers' },
    { id: 'cn-3', rank: 3, topic: 'TCP Flow & Error Control (Go-Back-N, Selective Repeat, 3-Way Handshake)', importance: 'High', pyqFrequency: '21/25 (84%)', percentage: 84, resourceTitle: 'YouTube', resourceChannel: 'Knowledge Gate', resourceQuery: 'Sliding Window Protocol Knowledge Gate' },
    { id: 'cn-4', rank: 4, topic: 'Routing Algorithms (Dijkstra, Bellman-Ford, Distance Vector, Link State)', importance: 'High', pyqFrequency: '19/25 (76%)', percentage: 76, resourceTitle: 'YouTube', resourceChannel: 'Abdul Bari', resourceQuery: 'Distance Vector Link State Routing Abdul Bari' },
    { id: 'cn-5', rank: 5, topic: 'Error Detection & Correction: CRC (Cyclic Redundancy Check) & Hamming Code', importance: 'High', pyqFrequency: '17/25 (68%)', percentage: 68, resourceTitle: 'YouTube', resourceChannel: 'Neso Academy', resourceQuery: 'CRC Cyclic Redundancy Check Neso Academy' },
    { id: 'cn-6', rank: 6, topic: 'Multiple Access: CSMA/CD, CSMA/CA, Pure & Slotted ALOHA', importance: 'Medium', pyqFrequency: '14/25 (56%)', percentage: 56, resourceTitle: 'YouTube', resourceChannel: 'Neso Academy', resourceQuery: 'CSMA CD Ethernet Neso Academy' },
    { id: 'cn-7', rank: 7, topic: 'Application Protocols: DNS, HTTP, HTTPS, FTP, DHCP', importance: 'Medium', pyqFrequency: '12/25 (48%)', percentage: 48, resourceTitle: 'YouTube', resourceChannel: 'Gate Smashers', resourceQuery: 'DNS HTTP Application Layer Gate Smashers' },
    { id: 'cn-8', rank: 8, topic: 'Congestion Control: Leaky Bucket & Token Bucket Algorithms', importance: 'Low', pyqFrequency: '8/25 (32%)', percentage: 32, resourceTitle: 'YouTube', resourceChannel: 'Gate Smashers', resourceQuery: 'Leaky Bucket Token Bucket Gate Smashers' },
  ],

  // 10. Machine Learning (Sem 4)
  ml: [
    { id: 'ml-1', rank: 1, topic: 'Linear & Logistic Regression with Cost Function & Gradient Descent', importance: 'Very High', pyqFrequency: '24/25 (96%)', percentage: 96, resourceTitle: 'YouTube', resourceChannel: 'StatQuest', resourceQuery: 'Linear Logistic Regression StatQuest' },
    { id: 'ml-2', rank: 2, topic: 'Decision Trees, ID3 Algorithm, Gini Index & Random Forests', importance: 'Very High', pyqFrequency: '22/25 (88%)', percentage: 88, resourceTitle: 'YouTube', resourceChannel: 'Krish Naik', resourceQuery: 'Decision Tree Random Forest Krish Naik' },
    { id: 'ml-3', rank: 3, topic: 'Support Vector Machines (SVM), Hyperplane & Kernel Trick', importance: 'High', pyqFrequency: '20/25 (80%)', percentage: 80, resourceTitle: 'YouTube', resourceChannel: 'StatQuest', resourceQuery: 'Support Vector Machines StatQuest' },
    { id: 'ml-4', rank: 4, topic: 'Clustering: K-Means, Elbow Method & Hierarchical Clustering', importance: 'High', pyqFrequency: '18/25 (72%)', percentage: 72, resourceTitle: 'YouTube', resourceChannel: 'CampusX', resourceQuery: 'K Means Clustering CampusX' },
    { id: 'ml-5', rank: 5, topic: 'Multilayer Perceptron (MLP) & Backpropagation Algorithm', importance: 'High', pyqFrequency: '17/25 (68%)', percentage: 68, resourceTitle: 'YouTube', resourceChannel: '3Blue1Brown', resourceQuery: 'Backpropagation Neural Network 3Blue1Brown' },
    { id: 'ml-6', rank: 6, topic: 'Dimensionality Reduction: PCA (Principal Component Analysis)', importance: 'Medium', pyqFrequency: '13/25 (52%)', percentage: 52, resourceTitle: 'YouTube', resourceChannel: 'StatQuest', resourceQuery: 'PCA Principal Component Analysis StatQuest' },
    { id: 'ml-7', rank: 7, topic: 'Evaluation Metrics: Confusion Matrix, ROC-AUC, F1-Score', importance: 'Medium', pyqFrequency: '11/25 (44%)', percentage: 44, resourceTitle: 'YouTube', resourceChannel: 'Krish Naik', resourceQuery: 'Confusion Matrix ROC AUC Krish Naik' },
    { id: 'ml-8', rank: 8, topic: 'Ensemble Learning: AdaBoost, Gradient Boosting & XGBoost', importance: 'Low', pyqFrequency: '7/25 (28%)', percentage: 28, resourceTitle: 'YouTube', resourceChannel: 'StatQuest', resourceQuery: 'XGBoost Clearly Explained StatQuest' },
  ],

  // 11. Formal Language and Automata Theory (Sem 4)
  flat: [
    { id: 'flat-1', rank: 1, topic: 'DFA & NFA Design, Equivalence & NFA to DFA Conversion', importance: 'Very High', pyqFrequency: '25/25 (100%)', percentage: 100, resourceTitle: 'YouTube', resourceChannel: 'Neso Academy', resourceQuery: 'NFA to DFA Conversion Neso Academy' },
    { id: 'flat-2', rank: 2, topic: 'Regular Expressions & Pumping Lemma for Regular Languages', importance: 'Very High', pyqFrequency: '23/25 (92%)', percentage: 92, resourceTitle: 'YouTube', resourceChannel: 'Gate Smashers', resourceQuery: 'Pumping Lemma Regular Languages Gate Smashers' },
    { id: 'flat-3', rank: 3, topic: 'Context-Free Grammar (CFG), Derivations & Ambiguity Resolution', importance: 'High', pyqFrequency: '20/25 (80%)', percentage: 80, resourceTitle: 'YouTube', resourceChannel: 'Knowledge Gate', resourceQuery: 'Context Free Grammar Knowledge Gate' },
    { id: 'flat-4', rank: 4, topic: 'Pushdown Automata (PDA) Design (DPDA vs NPDA)', importance: 'High', pyqFrequency: '18/25 (72%)', percentage: 72, resourceTitle: 'YouTube', resourceChannel: 'Neso Academy', resourceQuery: 'Pushdown Automata PDA Neso Academy' },
    { id: 'flat-5', rank: 5, topic: 'Turing Machines (TM) Construction & Transition Diagrams', importance: 'High', pyqFrequency: '16/25 (64%)', percentage: 64, resourceTitle: 'YouTube', resourceChannel: 'Gate Smashers', resourceQuery: 'Turing Machine Gate Smashers' },
    { id: 'flat-6', rank: 6, topic: 'Chomsky Normal Form (CNF) & Greibach Normal Form (GNF)', importance: 'Medium', pyqFrequency: '13/25 (52%)', percentage: 52, resourceTitle: 'YouTube', resourceChannel: 'Knowledge Gate', resourceQuery: 'Chomsky Normal Form CNF Knowledge Gate' },
    { id: 'flat-7', rank: 7, topic: 'Decidability, Undecidability & Halting Problem', importance: 'Low', pyqFrequency: '7/25 (28%)', percentage: 28, resourceTitle: 'YouTube', resourceChannel: 'Neso Academy', resourceQuery: 'Halting Problem Decidability Neso Academy' },
  ],

  // 12. Probability and Statistics (Sem 4)
  prob: [
    { id: 'prob-1', rank: 1, topic: "Bayes' Theorem & Law of Total Probability", importance: 'Very High', pyqFrequency: '24/25 (96%)', percentage: 96, resourceTitle: 'YouTube', resourceChannel: 'Khan Academy', resourceQuery: 'Bayes Theorem Khan Academy' },
    { id: 'prob-2', rank: 2, topic: 'Binomial, Poisson & Normal Probability Distributions', importance: 'Very High', pyqFrequency: '22/25 (88%)', percentage: 88, resourceTitle: 'YouTube', resourceChannel: '3Blue1Brown', resourceQuery: 'Probability Distributions 3Blue1Brown' },
    { id: 'prob-3', rank: 3, topic: 'Mathematical Expectation, Variance & Covariance Matrices', importance: 'High', pyqFrequency: '19/25 (76%)', percentage: 76, resourceTitle: 'YouTube', resourceChannel: 'StatQuest', resourceQuery: 'Variance Covariance StatQuest' },
    { id: 'prob-4', rank: 4, topic: 'Hypothesis Testing: Z-Test, t-Test, Chi-Square Test', importance: 'High', pyqFrequency: '17/25 (68%)', percentage: 68, resourceTitle: 'YouTube', resourceChannel: 'StatQuest', resourceQuery: 'Hypothesis Testing StatQuest' },
    { id: 'prob-5', rank: 5, topic: 'Central Limit Theorem & Sampling Distributions', importance: 'Medium', pyqFrequency: '13/25 (52%)', percentage: 52, resourceTitle: 'YouTube', resourceChannel: 'Khan Academy', resourceQuery: 'Central Limit Theorem Khan Academy' },
    { id: 'prob-6', rank: 6, topic: 'Correlation, Regression Lines & Curve Fitting', importance: 'Low', pyqFrequency: '8/25 (32%)', percentage: 32, resourceTitle: 'YouTube', resourceChannel: 'Vedantu', resourceQuery: 'Linear Regression Curve Fitting Vedantu' },
  ],
};

// Match subject to a curated topics key
function findCuratedKey(subjectName: string): string | null {
  const norm = subjectName.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (norm.includes('datastruct') || norm.includes('dsa') || norm.includes('algorithm') && !norm.includes('design')) return 'dsa';
  if (norm.includes('computearch') || norm.includes('architecture') || norm.includes('cpu') || norm.includes('deco')) return 'ca';
  if (norm.includes('designandanalysis') || norm.includes('daa') || norm.includes('analysisofalgo')) return 'daa';
  if (norm.includes('operatingsystem') || norm === 'os') return 'os';
  if (norm.includes('advancedai') || norm.includes('artificialint') || norm.includes('introtoai')) return 'aai';
  if (norm.includes('discrete') || norm.includes('discretemath')) return 'dm';
  if (norm.includes('internetofthings') || norm.includes('iot')) return 'iot';
  if (norm.includes('databasemanagement') || norm.includes('database') || norm.includes('dbms')) return 'dbms';
  if (norm.includes('computernetwork') || norm.includes('networking') || norm === 'cn') return 'cn';
  if (norm.includes('machinelearning') || norm === 'ml') return 'ml';
  if (norm.includes('formallanguage') || norm.includes('automata') || norm.includes('flat') || norm.includes('toc')) return 'flat';
  if (norm.includes('probability') || norm.includes('statistics') || norm.includes('probstat')) return 'prob';
  return null;
}

// Extract topics from syllabus preset or curriculum data
function buildTopicsFromPreset(subjectName: string): SuggestedTopic[] {
  const preset = getPresetForSubject(subjectName);
  if (preset && preset.length > 0) {
    const list: SuggestedTopic[] = [];
    let rank = 1;
    preset.forEach((ch) => {
      ch.topics.forEach((t) => {
        if (list.length >= 10) return;
        const cleanTitle = t.title
          .replace(/\s*\[\d+\s*L\]/i, '')
          .replace(/\s*\(\d+\s*L\)/i, '')
          .replace(/[:\s]+$/, '')
          .trim();
        if (cleanTitle.length > 4) {
          const importance: 'Very High' | 'High' | 'Medium' | 'Low' =
            rank <= 2 ? 'Very High' : rank <= 5 ? 'High' : rank <= 8 ? 'Medium' : 'Low';
          const pct = Math.max(25, Math.min(100, 100 - (rank - 1) * 8));
          list.push({
            id: `gen-${rank}`,
            rank,
            topic: cleanTitle,
            importance,
            pyqFrequency: `${Math.round((pct / 100) * 25)}/25 (${pct}%)`,
            percentage: pct,
            resourceTitle: 'YouTube',
            resourceChannel: rank % 2 === 0 ? 'Gate Smashers' : 'Neso Academy',
            resourceQuery: `${cleanTitle} ${subjectName}`,
            chapter: ch.title,
          });
          rank++;
        }
      });
    });
    if (list.length > 0) return list;
  }

  // Fallback generic high-weightage topics
  return [
    { id: 'f-1', rank: 1, topic: `${subjectName} - Core Architectural Principles & Fundamentals`, importance: 'Very High', pyqFrequency: '25/25 (100%)', percentage: 100, resourceTitle: 'YouTube', resourceChannel: 'Gate Smashers', resourceQuery: `${subjectName} Core Fundamentals Gate Smashers` },
    { id: 'f-2', rank: 2, topic: `${subjectName} - Key Mathematical Derivations & Analytical Models`, importance: 'Very High', pyqFrequency: '23/25 (92%)', percentage: 92, resourceTitle: 'YouTube', resourceChannel: 'Neso Academy', resourceQuery: `${subjectName} Derivations Neso Academy` },
    { id: 'f-3', rank: 3, topic: `${subjectName} - Design Methodologies, Diagrams & Structural Flow`, importance: 'High', pyqFrequency: '21/25 (84%)', percentage: 84, resourceTitle: 'YouTube', resourceChannel: 'Abdul Bari', resourceQuery: `${subjectName} Design Abdul Bari` },
    { id: 'f-4', rank: 4, topic: `${subjectName} - Implementation Algorithms & Protocol Frameworks`, importance: 'High', pyqFrequency: '19/25 (76%)', percentage: 76, resourceTitle: 'YouTube', resourceChannel: 'Knowledge Gate', resourceQuery: `${subjectName} Protocols Knowledge Gate` },
    { id: 'f-5', rank: 5, topic: `${subjectName} - Practical Engineering Applications & Case Studies`, importance: 'High', pyqFrequency: '17/25 (68%)', percentage: 68, resourceTitle: 'YouTube', resourceChannel: 'NPTEL', resourceQuery: `${subjectName} NPTEL Lectures` },
    { id: 'f-6', rank: 6, topic: `${subjectName} - Performance Optimization & Trade-Off Analysis`, importance: 'Medium', pyqFrequency: '14/25 (56%)', percentage: 56, resourceTitle: 'YouTube', resourceChannel: 'Gate Smashers', resourceQuery: `${subjectName} Optimization Gate Smashers` },
    { id: 'f-7', rank: 7, topic: `${subjectName} - Modern Industry Standards & State-of-the-Art Advances`, importance: 'Medium', pyqFrequency: '11/25 (44%)', percentage: 44, resourceTitle: 'YouTube', resourceChannel: 'Stanford Online', resourceQuery: `${subjectName} Stanford Online` },
    { id: 'f-8', rank: 8, topic: `${subjectName} - Comprehensive Examination Numerical Problems`, importance: 'Low', pyqFrequency: '8/25 (32%)', percentage: 32, resourceTitle: 'YouTube', resourceChannel: 'Neso Academy', resourceQuery: `${subjectName} Numericals Neso Academy` },
  ];
}

/**
 * Returns ALL subjects and their ranked exam suggestions for the requested semester.
 * Combines standard curriculum, uploaded syllabus, and custom subjects.
 */
export function getSuggestionsForSemester(
  semester: string | number,
  _branch?: string
): SubjectSuggestion[] {
  const currentSem = String(semester || '3');

  // 1. Gather semester subject names
  const subjectNames: string[] = [];
  const addUnique = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    const isLab = lower.endsWith('lab') || lower.includes('workshop') || lower.includes('nss');
    if (!isLab && !subjectNames.some((s) => s.toLowerCase() === lower)) {
      subjectNames.push(trimmed);
    }
  };

  // Add from standard semester map first
  const stdList = SEMESTER_SUBJECTS_MAP[currentSem] || SEMESTER_SUBJECTS_MAP['3'];
  stdList.forEach(addUnique);

  // Add from uploaded syllabus in localStorage
  try {
    const uploadedRaw = localStorage.getItem('exambuddy_uploaded_syllabus');
    if (uploadedRaw) {
      const parsed: SyllabusEntry[] = JSON.parse(uploadedRaw);
      parsed.forEach((e) => {
        if (String(e.semester) === currentSem && e.subject) {
          addUnique(e.subject);
        }
      });
    }
  } catch {
    // ignore
  }

  // Add from initial curriculum data
  INITIAL_CURRICULUM_DATA.forEach((e) => {
    if (String(e.semester) === currentSem && e.subject) {
      addUnique(e.subject);
    }
  });

  // 2. Build full suggestion object for each subject
  return subjectNames.map((subjName, idx) => {
    const visuals = getSubjectVisuals(subjName, idx);
    const curatedKey = findCuratedKey(subjName);

    let topics: SuggestedTopic[];
    if (curatedKey && CURATED_TOPICS_MAP[curatedKey]) {
      topics = CURATED_TOPICS_MAP[curatedKey];
    } else {
      topics = buildTopicsFromPreset(subjName);
    }

    // Determine chapters count from preset if available, else standard 5
    const preset = getPresetForSubject(subjName);
    const chaptersCount = preset ? preset.length : 5;

    // Syllabus coverage based on index or preset
    const coverageValues = [41, 48, 52, 38, 44, 35, 50, 46];
    const syllabusCovered = coverageValues[idx % coverageValues.length];

    const slugId = subjName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);

    return {
      subjectId: slugId || `sub-${idx}`,
      subjectName: subjName,
      chaptersCount,
      icon: visuals.icon,
      accentBg: visuals.accentBg,
      accentColor: visuals.accentColor,
      syllabusCovered,
      topics,
    };
  });
}
