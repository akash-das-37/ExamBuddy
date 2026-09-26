import React, { useState, useMemo } from 'react';
import '../styles/ContributionGraph.css';

export interface LearnedTopicDay {
  dateStr: string; // YYYY-MM-DD
  dayOfWeek: number; // 0 (Mon) to 6 (Sun)
  month: number; // 0 to 11
  year: number;
  dayOfMonth: number;
  count: number;
  level: number; // 0, 1, 2, 3, 4
  isFuture: boolean;
  isToday: boolean;
  topics: string[];
}

interface ContributionGraphProps {
  studentSemester?: string | number;
  onNavigateTab?: (tab: string) => void;
}

// Stable deterministic hash for historical topic activity
function getHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// Generate realistic learned curriculum topics
function generateLearnedTopics(dateStr: string, count: number, isToday: boolean): string[] {
  if (count === 0) return [];
  if (isToday) {
    return [
      'Data Structures: Binary Trees & BST Search',
      'DECO: Karnaugh Map 4-Variable Minimization',
      'AI: Graph Traversal - Breadth First Search',
    ];
  }

  const sampleTopics = [
    'Data Structures: Arrays (Kadane Algorithm & 2D Arrays)',
    'Data Structures: Singly & Doubly Linked List Reversal',
    'Data Structures: Stack & Queue Infix to Postfix',
    'Data Structures: Graph Traversal (BFS & DFS Algorithms)',
    'Data Structures: Dijkstra & Prim Minimum Spanning Tree',
    'DECO: Binary, Gray Code & Logic Gates Operations',
    'DECO: Half & Full Adders, Serial & Parallel Adders',
    'DECO: Multiplexers, Demultiplexers & Decoders',
    'DECO: Flip-Flops (SR, JK, D, T) & Shift Registers',
    'Mathematics-II: Calculus - Integration by Parts',
    'Mathematics-II: Ordinary Differential Equations',
    'Engineering Chemistry: Molecular Orbital Theory',
    'Engineering Chemistry: Chemical Kinetics & Catalysis',
    'AI: Heuristic Search & A* Algorithm Formulation',
    'Constitution of India: Fundamental Rights & Preamble',
    'Design Thinking: Human-Centered Empathy Mapping',
  ];

  const hash = getHash(dateStr);
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    const topic = sampleTopics[(hash + i * 3) % sampleTopics.length];
    if (!result.includes(topic)) {
      result.push(topic);
    }
  }
  return result;
}

export const ContributionGraph: React.FC<ContributionGraphProps> = ({
  studentSemester = '2',
  onNavigateTab,
}) => {
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [selectedDay, setSelectedDay] = useState<LearnedTopicDay | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Floating hover tooltip
  const [hoveredDay, setHoveredDay] = useState<LearnedTopicDay | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Today reference: Sep 26, 2026
  const referenceDate = useMemo(() => new Date(2026, 8, 26), []);

  // Compute 53 weeks across the year (Jan 1 to Dec 31)
  const { weeks, monthLabels, totalTopicsLearned } = useMemo(() => {
    const today = referenceDate;
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Target year: currentYear (e.g. 2026)
    // Start with Monday on or right before Jan 1 of currentYear
    const jan1 = new Date(currentYear, 0, 1);
    // Find the Monday of Jan 1 week: (0 is Sun, 1 is Mon, ..., 6 is Sat)
    const jan1Day = jan1.getDay();
    const daysToPrevMonday = jan1Day === 0 ? 6 : jan1Day - 1;
    const startDate = new Date(jan1);
    startDate.setDate(jan1.getDate() - daysToPrevMonday);

    // 53 weeks = 371 days
    const totalDays = 53 * 7;
    const generatedWeeks: LearnedTopicDay[][] = [];
    let curWeek: LearnedTopicDay[] = [];
    const monthsDetected: { colIndex: number; label: string }[] = [];
    let lastMonth = -1;

    let totalCount = 0;

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);

      const y = d.getFullYear();
      const m = d.getMonth();
      const dt = d.getDate();
      // Monday = 0, Tuesday = 1, ..., Sunday = 6
      const jsDay = d.getDay();
      const dow = jsDay === 0 ? 6 : jsDay - 1;

      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(dt).padStart(2, '0')}`;

      const isFuture = d > today;
      const isToday = dateStr === todayStr;

      let count = 0;

      if (!isFuture && y === currentYear) {
        if (isToday) {
          count = 3;
        } else {
          const hash = getHash(dateStr);
          // High intensity in July, August, September 2026 (matching user screenshot)
          if (m === 8 || m === 7 || (m === 6 && dt > 10)) {
            const pattern = hash % 10;
            if (pattern > 2) {
              count = (hash % 4) + 1;
              if (pattern > 6) count += 2;
            }
          }
          // Midterm sprint in May 2026 (matching user screenshot)
          else if (m === 4) {
            const pattern = hash % 10;
            if (pattern > 4) {
              count = (hash % 3) + 1;
            }
          }
          // Spring semester topics in Feb, Mar, Apr
          else if (m >= 1 && m <= 3) {
            const pattern = hash % 10;
            if (pattern > 6) {
              count = (hash % 2) + 1;
            }
          }
          // January topics
          else if (m === 0 && hash % 6 === 0) {
            count = 1;
          }
        }
      }

      // Determine heatmap level (0 to 4)
      let level = 0;
      if (count === 1) level = 1;
      else if (count === 2 || count === 3) level = 2;
      else if (count === 4 || count === 5) level = 3;
      else if (count >= 6) level = 4;

      if (!isFuture && y === currentYear) {
        totalCount += count;
      }

      const dayObj: LearnedTopicDay = {
        dateStr,
        dayOfWeek: dow,
        month: m,
        year: y,
        dayOfMonth: dt,
        count,
        level,
        isFuture,
        isToday,
        topics: generateLearnedTopics(dateStr, count, isToday),
      };

      curWeek.push(dayObj);

      if (curWeek.length === 7) {
        const colIdx = generatedWeeks.length;
        // Month label detection: if week contains the 1st of a month
        const firstDayOfMonth = curWeek.find((item) => item.dayOfMonth >= 1 && item.dayOfMonth <= 7 && item.year === currentYear);
        if (firstDayOfMonth && firstDayOfMonth.month !== lastMonth) {
          const monthShortNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          monthsDetected.push({ colIndex: colIdx, label: monthShortNames[firstDayOfMonth.month] });
          lastMonth = firstDayOfMonth.month;
        }

        generatedWeeks.push(curWeek);
        curWeek = [];
      }
    }

    return {
      weeks: generatedWeeks,
      monthLabels: monthsDetected,
      totalTopicsLearned: Math.max(totalCount, 174), // Match 174 from screenshot
    };
  }, [referenceDate, currentYear]);

  const handleMouseEnter = (day: LearnedTopicDay, e: React.MouseEvent<HTMLDivElement>) => {
    if (day.isFuture) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredDay(day);
    setTooltipPos({
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    });
  };

  const handleMouseLeave = () => {
    setHoveredDay(null);
    setTooltipPos(null);
  };

  const handleDayClick = (day: LearnedTopicDay) => {
    if (day.isFuture) return;
    setSelectedDay((prev) => (prev?.dateStr === day.dateStr ? null : day));
  };

  return (
    <div className="cg-card">
      {/* ================= HEADER ROW ================= */}
      <div className="cg-header">
        <div className="cg-header-left">
          {/* ExamBuddy Brand Logo */}
          <div className="cg-brand-icon" title="ExamBuddy">
            <span className="material-symbols-outlined">menu_book</span>
          </div>

          <h3 className="cg-title">Learned Topics</h3>

          <span className="cg-subtitle-count">
            <strong>{totalTopicsLearned} topics</strong> learned in the last year
          </span>

          <span className="cg-streak-pill">
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
              local_fire_department
            </span>
            <span>7-day streak</span>
          </span>
        </div>

        {/* Year Navigation Controls */}
        <div className="cg-header-right">
          <div className="cg-year-nav">
            <button
              type="button"
              onClick={() => setCurrentYear((prev) => prev - 1)}
              className="cg-nav-btn"
              title="Previous Year"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                chevron_left
              </span>
            </button>
            <span className="cg-year-display">{currentYear}</span>
            <button
              type="button"
              onClick={() => setCurrentYear((prev) => prev + 1)}
              disabled={currentYear >= 2026}
              className="cg-nav-btn"
              title="Next Year"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                chevron_right
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= HEATMAP CALENDAR ================= */}
      <div className="cg-graph-scroll">
        <div className="cg-graph-body">
          {/* Months Labels along Top */}
          <div className="cg-months-track">
            {monthLabels.map((m, idx) => (
              <span
                key={`${m.label}-${idx}`}
                className="cg-month-item"
                style={{ left: `${m.colIndex * 15.5}px` }}
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* Grid: 7 Day Labels on Left + 53 Weeks */}
          <div className="cg-grid-layout">
            <div className="cg-days-column">
              <span className="cg-day-label">Mon</span>
              <span className="cg-day-label">Tue</span>
              <span className="cg-day-label">Wed</span>
              <span className="cg-day-label">Thu</span>
              <span className="cg-day-label">Fri</span>
              <span className="cg-day-label">Sat</span>
              <span className="cg-day-label">Sun</span>
            </div>

            <div className="cg-weeks-track">
              {weeks.map((week, wIdx) => (
                <div key={`week-${wIdx}`} className="cg-week-column">
                  {week.map((day) => {
                    const isSelected = selectedDay?.dateStr === day.dateStr;
                    return (
                      <div
                        key={day.dateStr}
                        onClick={() => handleDayClick(day)}
                        onMouseEnter={(e) => handleMouseEnter(day, e)}
                        onMouseLeave={handleMouseLeave}
                        className={`cg-cell ${day.isFuture ? 'future' : `lvl-${day.level}`} ${day.isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ================= FOOTER ROW ================= */}
      <div className="cg-footer">
        {/* Left: Less to More Legend */}
        <div className="cg-legend">
          <span className="cg-legend-text">Less</span>
          <span className="cg-legend-box" style={{ backgroundColor: '#ebedf0' }} />
          <span className="cg-legend-box" style={{ backgroundColor: '#bbf7d0' }} />
          <span className="cg-legend-box" style={{ backgroundColor: '#4ade80' }} />
          <span className="cg-legend-box" style={{ backgroundColor: '#22c55e' }} />
          <span className="cg-legend-box" style={{ backgroundColor: '#15803d' }} />
          <span className="cg-legend-text">More</span>
        </div>

        {/* Right: Total Count & View Detailed Report */}
        <div className="cg-footer-right">
          <span className="cg-total-text">
            Total: {totalTopicsLearned} topics
          </span>
          <span
            onClick={() => setIsReportModalOpen(true)}
            className="cg-details-link"
          >
            <span>View Detailed Report</span>
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
              arrow_forward
            </span>
          </span>
        </div>
      </div>

      {/* ================= SELECTED DAY TOPICS BREAKDOWN ================= */}
      {selectedDay && (
        <div className="cg-selected-day-panel">
          <div className="cg-panel-head">
            <div className="cg-panel-title">
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#16a34a' }}>
                check_circle
              </span>
              <span>
                {new Date(selectedDay.dateStr).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            <span className="cg-panel-badge">
              {selectedDay.count} {selectedDay.count === 1 ? 'topic learned' : 'topics learned'}
            </span>
          </div>

          {selectedDay.topics.length > 0 ? (
            <div className="cg-topics-list">
              {selectedDay.topics.map((t, idx) => (
                <div key={idx} className="cg-topic-row">
                  <span className="cg-topic-dot" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: '#6a7667', fontStyle: 'italic' }}>
              No curriculum topics recorded on this date.
            </div>
          )}
        </div>
      )}

      {/* ================= FLOATING HOVER TOOLTIP ================= */}
      {hoveredDay && tooltipPos && (
        <div
          style={{
            position: 'fixed',
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            transform: 'translate(-50%, -100%)',
            background: '#181d16',
            color: '#ffffff',
            borderRadius: '6px',
            padding: '6px 10px',
            fontSize: '11px',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
            pointerEvents: 'none',
            zIndex: 1000,
            whiteSpace: 'nowrap',
            textAlign: 'center',
          }}
        >
          <div style={{ fontWeight: 700 }}>
            {hoveredDay.count === 0
              ? 'No topics learned'
              : `${hoveredDay.count} ${hoveredDay.count === 1 ? 'topic' : 'topics'} learned`}
          </div>
          <div style={{ fontSize: '10px', color: '#a0af9d' }}>
            on{' '}
            {new Date(hoveredDay.dateStr).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        </div>
      )}

      {/* ================= DETAILED REPORT MODAL ================= */}
      {isReportModalOpen && (
        <div className="cg-modal-backdrop" onClick={() => setIsReportModalOpen(false)}>
          <div className="cg-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="cg-modal-head">
              <h4 className="cg-modal-heading">Learned Topics Annual Breakdown</h4>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="cg-close-btn"
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#556252', margin: 0, lineHeight: 1.5 }}>
              Review your cumulative curriculum coverage for Semester {studentSemester}. Every verified topic from syllabus revision, question drills, and daily goals is tracked.
            </p>

            <div className="cg-modal-stats-summary">
              <div className="cg-summary-box">
                <span className="cg-summary-val">{totalTopicsLearned}</span>
                <span className="cg-summary-lbl">Total Topics</span>
              </div>
              <div className="cg-summary-box">
                <span className="cg-summary-val" style={{ color: '#ea580c' }}>7 Days</span>
                <span className="cg-summary-lbl">Current Streak</span>
              </div>
              <div className="cg-summary-box">
                <span className="cg-summary-val" style={{ color: '#0284c7' }}>82%</span>
                <span className="cg-summary-lbl">Retention Rate</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#181d16' }}>
                Top Mastered Domains (Semester {studentSemester})
              </span>
              <div style={{ background: '#faf8f5', border: '1px solid #e7e0d3', borderRadius: '10px', padding: '10px 14px', fontSize: '12.5px', color: '#284232' }}>
                🌿 <strong>Data Structures & Algorithms:</strong> Arrays, Linked Lists, Stacks, Queues, Binary Search Trees (42 topics)
              </div>
              <div style={{ background: '#faf8f5', border: '1px solid #e7e0d3', borderRadius: '10px', padding: '10px 14px', fontSize: '12.5px', color: '#284232' }}>
                ⚡ <strong>Digital Logic & Computer Organization:</strong> K-Maps, Combinational & Sequential Circuits (36 topics)
              </div>
              <div style={{ background: '#faf8f5', border: '1px solid #e7e0d3', borderRadius: '10px', padding: '10px 14px', fontSize: '12.5px', color: '#284232' }}>
                🧠 <strong>Artificial Intelligence:</strong> Informed & Uninformed Search, Game Playing (28 topics)
              </div>
              <div style={{ background: '#faf8f5', border: '1px solid #e7e0d3', borderRadius: '10px', padding: '10px 14px', fontSize: '12.5px', color: '#284232' }}>
                📐 <strong>Engineering Mathematics-II:</strong> Linear Algebra, Calculus, Differential Equations (34 topics)
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => {
                  setIsReportModalOpen(false);
                  if (onNavigateTab) onNavigateTab('syllabus');
                }}
                style={{
                  background: '#284232',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '9px 18px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Go to Full Syllabus Blueprint
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
