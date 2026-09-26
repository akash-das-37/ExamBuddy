import React, { useState, useMemo } from 'react';
import type { College, Notice, Student, SyllabusEntry } from '../types';
import { getSubjectsForSemester, getSubjectVisuals } from '../data/semesterSubjects';
import { getPresetForSubject } from '../data/subjectPresets';
import { INITIAL_CURRICULUM_DATA } from '../data/curriculumData';
import '../styles/Dashboard.css';

interface DashboardProps {
  student: Student;
  college: College | null;
  notices: Notice[];
  totalTopics: number;
  totalPYQs: number;
  onNavigateTab: (tab: string) => void;
  onTriggerScrape: () => void;
  onToggleNotifications: (enabled: boolean) => void;
  isScraping: boolean;
}

interface PlanTask {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
}

interface SubjectOverview {
  id: string;
  name: string;
  completedChapters: number;
  totalChapters: number;
  icon: string;
  accentBg: string;
  accentColor: string;
  barColor: string;
}

interface UpcomingMilestone {
  id: string;
  day: string;
  month: string;
  title: string;
  subtitle: string;
  color: 'red' | 'blue' | 'green' | 'purple';
}

export const Dashboard: React.FC<DashboardProps> = ({
  student,
  college: _college,
  notices: _notices,
  totalTopics: _totalTopics,
  totalPYQs: _totalPYQs,
  onNavigateTab,
  onTriggerScrape: _onTriggerScrape,
  onToggleNotifications: _onToggleNotifications,
  isScraping: _isScraping,
}) => {
  // Dynamically compute subjects strictly for the student's active semester
  const subjects = useMemo<SubjectOverview[]>(() => {
    const sem = String(student?.semester || '2');

    // 1. User uploaded / scraped syllabus entries for this semester
    const semSubjectsFromUpload: string[] = [];
    try {
      const sylRaw = localStorage.getItem('exambuddy_uploaded_syllabus');
      if (sylRaw) {
        const parsed: SyllabusEntry[] = JSON.parse(sylRaw);
        parsed.forEach((entry) => {
          if (entry.subject && String(entry.semester) === sem) {
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

    // 2. Initial curriculum data entries for this semester
    const semSubjectsFromData: string[] = [];
    INITIAL_CURRICULUM_DATA.forEach((entry) => {
      if (String(entry.semester) === sem && entry.subject) {
        const norm = entry.subject.trim();
        const lower = norm.toLowerCase();
        const isLab = lower.endsWith('lab') || lower.includes('workshop') || lower.includes('nss') || lower.includes('activities');
        if (!isLab && !semSubjectsFromData.includes(norm)) {
          semSubjectsFromData.push(norm);
        }
      }
    });

    // 3. Fallback standard semester subjects from curated curriculum
    const fallbackList = getSubjectsForSemester(sem, student?.branch);

    // Merge in priority order
    const subjectNames: string[] = [];
    const addUnique = (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      if (!subjectNames.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
        subjectNames.push(trimmed);
      }
    };

    if (semSubjectsFromUpload.length > 0) {
      semSubjectsFromUpload.forEach(addUnique);
    } else if (semSubjectsFromData.length > 0) {
      semSubjectsFromData.forEach(addUnique);
    } else {
      fallbackList.forEach(addUnique);
    }
    fallbackList.forEach(addUnique);

    // 4. Stored custom subjects from user if any
    try {
      const userSubjsRaw = localStorage.getItem('exambuddy_user_subjects');
      if (userSubjsRaw) {
        const customSubjs = JSON.parse(userSubjsRaw);
        if (Array.isArray(customSubjs)) {
          customSubjs.forEach((cs: { name?: string }) => {
            if (cs.name) addUnique(cs.name);
          });
        }
      }
    } catch {
      // ignore
    }

    // 5. Stored topic statuses for dynamic progress calculation
    let storedStatuses: Record<string, string> = {};
    try {
      const st = localStorage.getItem('exambuddy_topic_statuses');
      if (st) storedStatuses = JSON.parse(st);
    } catch {
      // ignore
    }

    // Curated vibrant bar colors matching the botanical theme
    const BAR_COLORS = ['#16a34a', '#0284c7', '#7c3aed', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#14b8a6'];

    return subjectNames.map((name, idx) => {
      const visuals = getSubjectVisuals(name, idx);
      const preset = getPresetForSubject(name);

      let totalChapters = 5;
      let completedChapters = 3;

      if (preset && preset.length > 0) {
        totalChapters = preset.length;
        let completedTopics = 0;
        let totalTopics = 0;
        preset.forEach((ch) => {
          ch.topics.forEach((t) => {
            totalTopics++;
            const st = storedStatuses[t.id] || t.status;
            if (st === 'completed') completedTopics++;
          });
        });

        if (totalTopics > 0) {
          completedChapters = Math.round((completedTopics / totalTopics) * totalChapters);
          if (completedChapters === 0 && completedTopics > 0) completedChapters = 1;
        } else {
          completedChapters = Math.max(1, Math.round(totalChapters * 0.6));
        }
      } else {
        const defaults = [
          { comp: 4, tot: 6 },
          { comp: 3, tot: 5 },
          { comp: 4, tot: 6 },
          { comp: 3, tot: 5 },
          { comp: 3, tot: 5 },
          { comp: 2, tot: 4 },
          { comp: 2, tot: 3 },
        ];
        const d = defaults[idx % defaults.length];
        completedChapters = d.comp;
        totalChapters = d.tot;
      }

      return {
        id: `sub-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${idx}`,
        name,
        completedChapters,
        totalChapters,
        icon: visuals.icon,
        accentBg: visuals.accentBg,
        accentColor: visuals.accentColor,
        barColor: BAR_COLORS[idx % BAR_COLORS.length],
      };
    });
  }, [student?.semester, student?.branch]);

  // Dynamically compute upcoming milestones
  const upcomingMilestones = useMemo<UpcomingMilestone[]>(() => {
    const sem = String(student?.semester || '2');
    return [
      {
        id: 'up-1',
        day: '25',
        month: 'Sep',
        title: sem === '2' ? 'DECO Lab File Submission' : 'Lab File Submission & Viva',
        subtitle: 'Assignment Deadline',
        color: 'red',
      },
      {
        id: 'up-2',
        day: '28',
        month: 'Sep',
        title: 'Tech Talk: Career Opportunities in AI',
        subtitle: 'College Event',
        color: 'blue',
      },
      {
        id: 'up-3',
        day: '02',
        month: 'Oct',
        title: 'Gandhi Jayanti',
        subtitle: 'College Holiday',
        color: 'green',
      },
      {
        id: 'up-4',
        day: '10',
        month: 'Oct',
        title: `Semester ${sem} Exams Begin`,
        subtitle: 'Examination',
        color: 'purple',
      },
    ];
  }, [student?.semester]);

  // Tasks state for Today's Plan - 6 out of 6 tasks directly on screen
  const [tasks, setTasks] = useState<PlanTask[]>([
    {
      id: 't-1',
      title: 'Study DECO – Logic Gates',
      duration: '2 hrs',
      completed: true,
    },
    {
      id: 't-2',
      title: 'Solve PYQs – Mathematics',
      duration: '1 hr',
      completed: true,
    },
    {
      id: 't-3',
      title: 'Revise Notes – Data Structures',
      duration: '1 hr',
      completed: true,
    },
    {
      id: 't-4',
      title: 'Practice Graph Algorithms – Dijkstra & Prim\'s',
      duration: '1.5 hrs',
      completed: false,
    },
    {
      id: 't-5',
      title: 'Review Chemistry – Chemical Bonding',
      duration: '1 hr',
      completed: false,
    },
    {
      id: 't-6',
      title: 'Attempt Mock Quiz & Formula Drill',
      duration: '45 mins',
      completed: false,
    },
  ]);

  // Total daily goal tasks (6)
  const totalGoalTasks = tasks.length;
  const completedTaskCount = tasks.filter((t) => t.completed).length;
  const isAllCompleted = completedTaskCount === totalGoalTasks && totalGoalTasks > 0;

  // Donut Gauge math (r = 36, C = 2 * PI * 36 ≈ 226.19)
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const gaugeRatio = completedTaskCount / totalGoalTasks;
  const strokeOffset = circumference - gaugeRatio * circumference;

  // Modals state
  const [isTipsModalOpen, setIsTipsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  const displayName = student.name ? student.name.split(' ')[0] : 'Ari';

  return (
    <div className="db-page-container">
      {/* Botanical Corner Leaf Watermark */}
      <div className="db-leaf-watermark">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
          <path d="M20 180 C 40 140, 80 110, 150 90 C 130 110, 90 150, 60 170 Z" fill="#284232" opacity="0.3" />
          <path d="M50 140 C 70 100, 120 70, 180 50 C 160 80, 120 120, 80 140 Z" fill="#284232" opacity="0.25" />
          <path d="M10 190 Q 70 130 160 80" stroke="#284232" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
        </svg>
      </div>

      <div className="db-content-wrap">
        {/* ================= TOP HEADER & QUOTE ROW ================= */}
        <div className="db-top-row">
          <div className="db-title-group">
            <h1 className="db-main-title">
              <span>Welcome back, {displayName}!</span>
            </h1>
            <p className="db-subtitle">
              Let&apos;s keep going. Small steps today, big results tomorrow.
            </p>
          </div>

          {/* Inspirational Quote Card on top right */}
          <div className="db-quote-card">
            <span className="db-quote-mark">“</span>
            <p className="db-quote-text">
              Consistency today builds a better you tomorrow.
            </p>

            <svg
              className="db-quote-leaves"
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

        {/* Action / Toast Notification */}
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
        <div className="db-main-grid">
          {/* Left Column: Today's Plan, Your Subjects, Quick Access */}
          <div className="db-left-col">
            {/* Section 1: Today's Plan */}
            <div className="db-plan-card">
              <div className="db-plan-header">
                <div className="db-plan-head-left">
                  <div className="db-plan-icon">
                    <span className="material-symbols-outlined">calendar_today</span>
                  </div>
                  <div className="db-plan-title-box">
                    <h2 className="db-plan-title">Today&apos;s Plan</h2>
                    <span className="db-plan-date">
                      {new Date().toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        weekday: 'long',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="db-plan-content">
                {/* Tasks List */}
                <div className="db-plan-tasks">
                  {tasks.map((task, idx) => (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className={`db-task-item ${task.completed || idx === 0 ? 'active' : ''}`}
                    >
                      <button type="button" className="db-task-check">
                        {task.completed ? (
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: '20px', color: '#284232', fontVariationSettings: "'FILL' 1" }}
                          >
                            check_circle
                          </span>
                        ) : (
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: '20px', color: '#284232' }}
                          >
                            radio_button_unchecked
                          </span>
                        )}
                      </button>

                      <span className={`db-task-title ${task.completed ? 'completed' : ''}`}>
                        {task.title} ({task.duration})
                      </span>
                    </div>
                  ))}
                </div>

                {/* Donut Gauge Chart */}
                <div className="db-plan-gauge-wrap">
                  <div className="db-plan-gauge">
                    <svg className="db-gauge-track-svg" viewBox="0 0 96 96">
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
                        stroke={isAllCompleted ? '#16a34a' : '#284232'}
                        strokeWidth="10"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeOffset}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.4s ease' }}
                      />
                    </svg>
                    <div className="db-plan-gauge-center">
                      {isAllCompleted ? (
                        <div className="db-gauge-tick-wrap" key="completed-tick" title="All tasks completed!">
                          <svg
                            className="db-gauge-checkmark"
                            viewBox="0 0 52 52"
                            aria-label="All tasks completed"
                          >
                            <path
                              className="db-gauge-checkmark-check"
                              fill="none"
                              d="M 14 25.25 L 22.5 33.75 L 38 18.25"
                            />
                          </svg>
                        </div>
                      ) : (
                        <span>
                          {completedTaskCount}/{totalGoalTasks}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="db-plan-gauge-label">
                    {isAllCompleted ? 'All Completed!' : 'Tasks Completed'}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Your Subjects */}
            <div>
              <div className="db-section-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 className="db-section-title">Your Subjects</h3>
                  <span
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: '#284232',
                      background: '#eaf4eb',
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      border: '1px solid #c8decb',
                    }}
                  >
                    Semester {student?.semester || '2'}
                  </span>
                </div>
                <span
                  onClick={() => onNavigateTab('syllabus')}
                  className="db-view-all-link"
                >
                  <span>View All</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                    arrow_forward
                  </span>
                </span>
              </div>

              <div className="db-subjects-grid">
                {subjects.map((sub) => {
                  const percent = Math.round((sub.completedChapters / sub.totalChapters) * 100);
                  return (
                    <div
                      key={sub.id}
                      onClick={() => {
                        try {
                          sessionStorage.setItem('exambuddy_selected_subject', sub.name);
                        } catch {
                          // ignore
                        }
                        onNavigateTab('syllabus');
                      }}
                      className="db-subject-card"
                      title={`${sub.name} – Click to explore syllabus`}
                    >
                      <div className="db-subject-head">
                        <div
                          className="db-subject-icon"
                          style={{
                            backgroundColor: sub.accentBg,
                            color: sub.accentColor,
                          }}
                        >
                          <span className="material-symbols-outlined">{sub.icon}</span>
                        </div>
                        <span className="material-symbols-outlined db-subject-arrow">
                          chevron_right
                        </span>
                      </div>

                      <div className="db-subject-name" title={sub.name}>{sub.name}</div>

                      <div className="db-subject-track">
                        <div
                          className="db-subject-fill"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: sub.barColor,
                          }}
                        />
                      </div>

                      <div className="db-subject-count">
                        {sub.completedChapters} / {sub.totalChapters} Chapters
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Quick Access */}
            <div>
              <div className="db-section-header">
                <h3 className="db-section-title" style={{ fontSize: '18px' }}>
                  Quick Access
                </h3>
              </div>

              <div className="db-access-grid">
                {/* 1. Syllabus */}
                <div
                  onClick={() => onNavigateTab('syllabus')}
                  className="db-access-card"
                >
                  <div className="db-access-left">
                    <div
                      className="db-access-icon"
                      style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}
                    >
                      <span className="material-symbols-outlined">menu_book</span>
                    </div>
                    <div className="db-access-info">
                      <span className="db-access-title">Syllabus</span>
                      <span className="db-access-sub">View full syllabus</span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined db-access-arrow">
                    chevron_right
                  </span>
                </div>

                {/* 2. PYQ */}
                <div
                  onClick={() => onNavigateTab('pyqs')}
                  className="db-access-card"
                >
                  <div className="db-access-left">
                    <div
                      className="db-access-icon"
                      style={{ backgroundColor: '#fee2e2', color: '#ef4444' }}
                    >
                      <span className="material-symbols-outlined">description</span>
                    </div>
                    <div className="db-access-info">
                      <span className="db-access-title">PYQ</span>
                      <span className="db-access-sub">Practice questions</span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined db-access-arrow">
                    chevron_right
                  </span>
                </div>

                {/* 3. Notes */}
                <div
                  onClick={() => {
                    setToastMessage('Notes Archive: 24 lecture notes & formula sheets loaded.');
                    setTimeout(() => setToastMessage(null), 3000);
                  }}
                  className="db-access-card"
                >
                  <div className="db-access-left">
                    <div
                      className="db-access-icon"
                      style={{ backgroundColor: '#dbeafe', color: '#2563eb' }}
                    >
                      <span className="material-symbols-outlined">article</span>
                    </div>
                    <div className="db-access-info">
                      <span className="db-access-title">Notes</span>
                      <span className="db-access-sub">Your saved notes</span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined db-access-arrow">
                    chevron_right
                  </span>
                </div>

                {/* 4. Suggestions */}
                <div
                  onClick={() => onNavigateTab('suggestions')}
                  className="db-access-card"
                  style={{ cursor: 'pointer' }}
                >
                  <div className="db-access-left">
                    <div
                      className="db-access-icon"
                      style={{ backgroundColor: '#f3e8ff', color: '#9333ea' }}
                    >
                      <span className="material-symbols-outlined">tips_and_updates</span>
                    </div>
                    <div className="db-access-info">
                      <span className="db-access-title">Suggestions</span>
                      <span className="db-access-sub">High-weightage topics</span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined db-access-arrow">
                    chevron_right
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Upcoming & Study Stats */}
          <div className="db-sidebar-cards">
            {/* Card 1: Upcoming */}
            <div className="db-upcoming-card">
              <div className="db-card-headrow">
                <h3 className="db-card-title">Upcoming</h3>
                <span
                  onClick={() => onNavigateTab('notices')}
                  className="db-view-all-link"
                >
                  <span>View All</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                    arrow_forward
                  </span>
                </span>
              </div>

              <div className="db-upcoming-list">
                {upcomingMilestones.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onNavigateTab('notices')}
                    className="db-upcoming-item"
                  >
                    <div className="db-upcoming-left">
                      <div className="db-date-badge">
                        <span className={`db-date-num ${item.color}`}>{item.day}</span>
                        <span className={`db-date-month ${item.color}`}>{item.month}</span>
                      </div>
                      <div className="db-upcoming-info">
                        <span className="db-upcoming-title">{item.title}</span>
                        <span className="db-upcoming-sub">{item.subtitle}</span>
                      </div>
                    </div>

                    <span className="material-symbols-outlined db-upcoming-arrow">
                      chevron_right
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2: Study Stats */}
            <div className="db-stats-card">
              <div className="db-card-headrow">
                <h3 className="db-card-title">Study Stats</h3>
                <span
                  onClick={() => onNavigateTab('study-report')}
                  className="db-view-all-link"
                >
                  <span>View Details</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                    arrow_forward
                  </span>
                </span>
              </div>

              <div className="db-stats-grid">
                {/* Stat 1: 12 hrs This Week */}
                <div className="db-stat-tile">
                  <div
                    className="db-stat-icon"
                    style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}
                  >
                    <span className="material-symbols-outlined">schedule</span>
                  </div>
                  <div className="db-stat-info">
                    <span className="db-stat-val">12 hrs</span>
                    <span className="db-stat-sub">This Week</span>
                  </div>
                </div>

                {/* Stat 2: 68% Syllabus Covered */}
                <div className="db-stat-tile">
                  <div
                    className="db-stat-icon"
                    style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}
                  >
                    <span className="material-symbols-outlined">bar_chart</span>
                  </div>
                  <div className="db-stat-info">
                    <span className="db-stat-val">68%</span>
                    <span className="db-stat-sub">Syllabus Covered</span>
                  </div>
                </div>

                {/* Stat 3: 18 PYQs Solved */}
                <div className="db-stat-tile">
                  <div
                    className="db-stat-icon"
                    style={{ backgroundColor: '#dbeafe', color: '#2563eb' }}
                  >
                    <span className="material-symbols-outlined">calendar_month</span>
                  </div>
                  <div className="db-stat-info">
                    <span className="db-stat-val">18</span>
                    <span className="db-stat-sub">PYQs Solved</span>
                  </div>
                </div>

                {/* Stat 4: 3 / 6 Today's Tasks */}
                <div className="db-stat-tile">
                  <div
                    className="db-stat-icon"
                    style={{ backgroundColor: '#fee2e2', color: '#ef4444' }}
                  >
                    <span className="material-symbols-outlined">track_changes</span>
                  </div>
                  <div className="db-stat-info">
                    <span className="db-stat-val">{completedTaskCount} / {totalGoalTasks}</span>
                    <span className="db-stat-sub">Today&apos;s Tasks</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Study Suggestions Modal */}
      {isTipsModalOpen && (
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
              maxWidth: '560px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: '#284232' }}>
                  AI Study Copilot
                </span>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', fontWeight: 700, margin: '2px 0 0', color: '#181d16' }}>
                  Exam Preparation Suggestions
                </h3>
              </div>
              <button
                onClick={() => setIsTipsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#687865' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ background: '#faf8f5', padding: '14px', borderRadius: '14px', border: '1px solid #eee8de', fontSize: '13px', lineHeight: 1.5, color: '#293226' }}>
                <strong style={{ color: '#181d16' }}>💡 Focus on High-Yield Chapters:</strong> In DECO, Logic Gates and K-Maps carry 35% of midterm marks. Allocate 2 hours before Friday.
              </div>
              <div style={{ background: '#faf8f5', padding: '14px', borderRadius: '14px', border: '1px solid #eee8de', fontSize: '13px', lineHeight: 1.5, color: '#293226' }}>
                <strong style={{ color: '#181d16' }}>🎯 Mathematics PYQ Trend:</strong> Calculus integration by parts and differential equations appeared in 4 out of the last 5 exam papers.
              </div>
              <div style={{ background: '#faf8f5', padding: '14px', borderRadius: '14px', border: '1px solid #eee8de', fontSize: '13px', lineHeight: 1.5, color: '#293226' }}>
                <strong style={{ color: '#181d16' }}>⏱️ Active Recall Strategy:</strong> After reading Linked Lists, practice writing reversal without looking at reference implementations.
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsTipsModalOpen(false);
                onNavigateTab('study-report');
              }}
              style={{
                background: '#284232',
                color: '#ffffff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '9999px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                marginTop: '4px',
              }}
            >
              Open Full AI Study Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
