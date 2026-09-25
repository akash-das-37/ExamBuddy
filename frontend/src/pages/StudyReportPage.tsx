import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Student, StudyReportResponse } from '../types';
import '../styles/StudyReportPage.css';

interface StudyReportPageProps {
  student: Student;
  onNavigateTab?: (tab: string) => void;
}

interface SubjectProgressItem {
  id: string;
  name: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  progressPercent: number;
  totalChapters: number;
  completedChapters: number;
  totalPYQs: number;
  solvedPYQs: number;
  readinessScore: number;
}

interface ActivityItem {
  id: string;
  title: string;
  timeAgo: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  nodeColor: string;
  category: 'pyq' | 'chapter' | 'notes' | 'test';
}

interface GoalItem {
  id: string;
  title: string;
  subtitle: string;
  current: number;
  target: number;
  unit: string;
  percent: number;
}

export const StudyReportPage: React.FC<StudyReportPageProps> = ({
  student,
  onNavigateTab,
}) => {
  // Time filter state for Study Time chart
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'semester'>('week');

  // Interactive Modals State
  const [activeModal, setActiveModal] = useState<
    'subjects' | 'weekly_perf' | 'recent_activity' | 'goals' | null
  >(null);

  // Hover states for tooltips
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);

  // AI Backend Integration state
  const [selectedSubject, setSelectedSubject] = useState('Computer Networks');
  const [aiReport, setAiReport] = useState<StudyReportResponse | null>(null);
  const [isRecomputing, setIsRecomputing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Load backend AI importance data if student desires deep dive
  const fetchAiReport = async (subj: string) => {
    try {
      setAiError(null);
      const data = await api.getMyStudyReport(subj);
      setAiReport(data);
    } catch {
      // Backend may be offline or empty, fallback gracefully
      setAiReport(null);
    }
  };

  useEffect(() => {
    fetchAiReport(selectedSubject);
  }, [selectedSubject]);

  const handleRecomputeScores = async () => {
    setIsRecomputing(true);
    setAiError(null);
    try {
      await api.computeImportance(student.college_id, selectedSubject);
      await fetchAiReport(selectedSubject);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAiError(err.message);
      } else {
        setAiError('Failed to compute importance scores');
      }
    } finally {
      setIsRecomputing(false);
    }
  };

  // 1. Study Time Chart Data
  const studyTimeData = {
    week: [
      { label: 'Mon', hours: 3.2 },
      { label: 'Tue', hours: 5.4 },
      { label: 'Wed', hours: 3.5 },
      { label: 'Thu', hours: 3.5 },
      { label: 'Fri', hours: 5.9 },
      { label: 'Sat', hours: 4.1 },
      { label: 'Sun', hours: 3.2 },
    ],
    month: [
      { label: 'W1', hours: 14.5 },
      { label: 'W2', hours: 16.8 },
      { label: 'W3', hours: 13.2 },
      { label: 'W4', hours: 19.4 },
    ],
    semester: [
      { label: 'M1', hours: 48.0 },
      { label: 'M2', hours: 62.5 },
      { label: 'M3', hours: 54.0 },
      { label: 'M4', hours: 68.2 },
    ],
  };

  const currentStudyTime = studyTimeData[timeFilter];
  const maxStudyScale = timeFilter === 'week' ? 8 : timeFilter === 'month' ? 24 : 80;

  // 2. Subject-wise Progress Data
  const subjectsData: SubjectProgressItem[] = [
    {
      id: 'sub-1',
      name: 'Mathematics',
      icon: 'calculate',
      iconBg: '#fee2e2',
      iconColor: '#ef4444',
      progressPercent: 75,
      totalChapters: 8,
      completedChapters: 6,
      totalPYQs: 45,
      solvedPYQs: 34,
      readinessScore: 82,
    },
    {
      id: 'sub-2',
      name: 'Physics',
      icon: 'cyclone',
      iconBg: '#f3e8ff',
      iconColor: '#a855f7',
      progressPercent: 62,
      totalChapters: 10,
      completedChapters: 6,
      totalPYQs: 50,
      solvedPYQs: 31,
      readinessScore: 71,
    },
    {
      id: 'sub-3',
      name: 'Chemistry',
      icon: 'science',
      iconBg: '#ffedd5',
      iconColor: '#f97316',
      progressPercent: 48,
      totalChapters: 8,
      completedChapters: 4,
      totalPYQs: 40,
      solvedPYQs: 19,
      readinessScore: 59,
    },
    {
      id: 'sub-4',
      name: 'DECO',
      icon: 'memory',
      iconBg: '#e0f2fe',
      iconColor: '#0284c7',
      progressPercent: 66,
      totalChapters: 6,
      completedChapters: 4,
      totalPYQs: 35,
      solvedPYQs: 23,
      readinessScore: 76,
    },
    {
      id: 'sub-5',
      name: 'DSA',
      icon: 'database',
      iconBg: '#dcfce7',
      iconColor: '#16a34a',
      progressPercent: 58,
      totalChapters: 12,
      completedChapters: 7,
      totalPYQs: 60,
      solvedPYQs: 35,
      readinessScore: 68,
    },
    {
      id: 'sub-6',
      name: 'AI',
      icon: 'psychology',
      iconBg: '#ede9fe',
      iconColor: '#8b5cf6',
      progressPercent: 40,
      totalChapters: 7,
      completedChapters: 3,
      totalPYQs: 30,
      solvedPYQs: 12,
      readinessScore: 52,
    },
  ];

  // 3. Focus Distribution Data (Donut Chart)
  const focusDistribution = [
    { name: 'Mathematics', percent: 28, color: '#284232' },
    { name: 'Physics', percent: 22, color: '#8b5cf6' },
    { name: 'Chemistry', percent: 18, color: '#f97316' },
    { name: 'DECO', percent: 15, color: '#0ea5e9' },
    { name: 'DSA', percent: 10, color: '#86efac' },
    { name: 'AI', percent: 7, color: '#cfc6b6' },
  ];

  // Donut geometry (r = 36, C = 2 * Math.PI * 36 ≈ 226.195)
  const donutRadius = 36;
  const donutCircumference = 2 * Math.PI * donutRadius;

  // 4. Weekly Performance Spline Curve Data
  const weeklyPerfPoints = [
    { day: 'Mon', val: 32 },
    { day: 'Tue', val: 55 },
    { day: 'Wed', val: 48 },
    { day: 'Thu', val: 52 },
    { day: 'Fri', val: 76 },
    { day: 'Sat', val: 50 },
    { day: 'Sun', val: 78 },
  ];

  // Mathematical cubic spline curve generator for 320x150 canvas
  const splineCoords = weeklyPerfPoints.map((pt, i) => {
    const x = 12 + i * 49.33;
    const y = 132 - (pt.val / 100) * 114;
    return { x, y, day: pt.day, val: pt.val };
  });

  const generateSplinePath = () => {
    if (splineCoords.length === 0) return '';
    let d = `M ${splineCoords[0].x} ${splineCoords[0].y}`;
    for (let i = 0; i < splineCoords.length - 1; i++) {
      const curr = splineCoords[i];
      const next = splineCoords[i + 1];
      const midX = (curr.x + next.x) / 2;
      d += ` C ${midX} ${curr.y}, ${midX} ${next.y}, ${next.x} ${next.y}`;
    }
    return d;
  };

  const linePath = generateSplinePath();
  const areaPath = `${linePath} L ${splineCoords[splineCoords.length - 1].x} 132 L ${splineCoords[0].x} 132 Z`;

  // 5. Recent Activity Timeline Data
  const activities: ActivityItem[] = [
    {
      id: 'act-1',
      title: 'Solved 5 PYQs (DECO)',
      timeAgo: '2 hours ago',
      icon: 'description',
      iconBg: '#fee2e2',
      iconColor: '#ef4444',
      nodeColor: '#ef4444',
      category: 'pyq',
    },
    {
      id: 'act-2',
      title: 'Completed Chapter: Arrays (DSA)',
      timeAgo: '4 hours ago',
      icon: 'menu_book',
      iconBg: '#dcfce7',
      iconColor: '#16a34a',
      nodeColor: '#16a34a',
      category: 'chapter',
    },
    {
      id: 'act-3',
      title: 'Added notes: Logic Gates',
      timeAgo: '6 hours ago',
      icon: 'chat_bubble',
      iconBg: '#f3e8ff',
      iconColor: '#a855f7',
      nodeColor: '#a855f7',
      category: 'notes',
    },
    {
      id: 'act-4',
      title: 'Finished mock test (Mathematics)',
      timeAgo: '1 day ago',
      icon: 'track_changes',
      iconBg: '#ffedd5',
      iconColor: '#f97316',
      nodeColor: '#f97316',
      category: 'test',
    },
  ];

  // 6. Goals Data with Circular Gauges
  const [goals, setGoals] = useState<GoalItem[]>([
    {
      id: 'goal-1',
      title: '12 / 20 hrs',
      subtitle: 'Weekly Study Goal',
      current: 12,
      target: 20,
      unit: 'hrs',
      percent: 60,
    },
    {
      id: 'goal-2',
      title: '8 / 10 topics',
      subtitle: 'Chapter Completion Goal',
      current: 8,
      target: 10,
      unit: 'topics',
      percent: 80,
    },
    {
      id: 'goal-3',
      title: '18 / 30 PYQs',
      subtitle: 'PYQ Practice Goal',
      current: 18,
      target: 30,
      unit: 'PYQs',
      percent: 60,
    },
  ]);

  const goalRadius = 20;
  const goalCircumference = 2 * Math.PI * goalRadius;

  return (
    <div className="sr-page-container">
      {/* Botanical Corner Watermarks */}
      <div className="sr-leaf-watermark-bottom">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
          <path d="M20 180 C 40 140, 80 110, 150 90 C 130 110, 90 150, 60 170 Z" fill="#284232" opacity="0.3" />
          <path d="M50 140 C 70 100, 120 70, 180 50 C 160 80, 120 120, 80 140 Z" fill="#284232" opacity="0.25" />
          <path d="M10 190 Q 70 130 160 80" stroke="#284232" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
        </svg>
      </div>

      <div className="sr-leaf-watermark-top">
        <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
          <path d="M140 20 C 100 40, 70 80, 50 140 C 80 120, 120 80, 140 50 Z" fill="#284232" opacity="0.25" />
          <path d="M110 50 C 70 70, 40 110, 20 150 C 50 130, 90 100, 110 70 Z" fill="#284232" opacity="0.2" />
        </svg>
      </div>

      <div className="sr-content-wrap">
        {/* ================= TOP HEADER & QUOTE ROW ================= */}
        <div className="sr-top-row">
          <div className="sr-title-group">
            <h1 className="sr-main-title">Study Report</h1>
            <p className="sr-subtitle">
              Track your progress, stay consistent and improve every day.
            </p>
          </div>

          {/* Inspirational Quote Card on top right */}
          <div className="sr-quote-card">
            <span className="sr-quote-mark">“</span>
            <p className="sr-quote-text">
              Progress today,
              <br />
              better results tomorrow.
            </p>

            <svg
              className="sr-quote-leaves"
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

        {/* ================= 4 TOP METRIC CARDS ================= */}
        <div className="sr-metrics-grid">
          {/* Card 1: Total Study Time */}
          <div className="sr-metric-card sr-metric-green">
            <div className="sr-metric-icon-wrap sr-icon-green">
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                schedule
              </span>
            </div>
            <div className="sr-metric-info">
              <span className="sr-metric-val">12 hrs</span>
              <span className="sr-metric-label">Total Study Time</span>
              <span className="sr-metric-trend">
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                  trending_up
                </span>
                +18% from last week
              </span>
            </div>
          </div>

          {/* Card 2: Topics Completed */}
          <div className="sr-metric-card sr-metric-blue">
            <div className="sr-metric-icon-wrap sr-icon-blue">
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                check_circle
              </span>
            </div>
            <div className="sr-metric-info">
              <span className="sr-metric-val">28</span>
              <span className="sr-metric-label">Topics Completed</span>
              <span className="sr-metric-trend">
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                  trending_up
                </span>
                +12% from last week
              </span>
            </div>
          </div>

          {/* Card 3: PYQs Solved */}
          <div className="sr-metric-card sr-metric-peach">
            <div className="sr-metric-icon-wrap sr-icon-peach">
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                track_changes
              </span>
            </div>
            <div className="sr-metric-info">
              <span className="sr-metric-val">18 / 25</span>
              <span className="sr-metric-label">PYQs Solved</span>
              <span className="sr-metric-trend">
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                  trending_up
                </span>
                +6% from last week
              </span>
            </div>
          </div>

          {/* Card 4: Overall Progress */}
          <div className="sr-metric-card sr-metric-purple">
            <div className="sr-metric-icon-wrap sr-icon-purple">
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                bar_chart
              </span>
            </div>
            <div className="sr-metric-info">
              <span className="sr-metric-val">68%</span>
              <span className="sr-metric-label">Overall Progress</span>
              <span className="sr-metric-trend">
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                  trending_up
                </span>
                +10% from last week
              </span>
            </div>
          </div>
        </div>

        {/* ================= MAIN 2-COLUMN GRID ================= */}
        <div className="sr-main-grid">
          {/* ================= LEFT COLUMN ================= */}
          <div className="sr-left-column">
            {/* ROW 1: Study Time & Subject-wise Progress */}
            <div className="sr-left-row">
              {/* Card 1: Study Time */}
              <div className="sr-card">
                <div className="sr-card-header">
                  <h3 className="sr-card-title">Study Time</h3>
                  <div className="sr-filter-tabs">
                    <button
                      type="button"
                      onClick={() => setTimeFilter('week')}
                      className={`sr-filter-tab ${timeFilter === 'week' ? 'active' : ''}`}
                    >
                      This Week
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeFilter('month')}
                      className={`sr-filter-tab ${timeFilter === 'month' ? 'active' : ''}`}
                    >
                      This Month
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeFilter('semester')}
                      className={`sr-filter-tab ${timeFilter === 'semester' ? 'active' : ''}`}
                    >
                      This Semester
                    </button>
                  </div>
                </div>

                <div className="sr-bar-chart-container">
                  {/* Y-Axis */}
                  <div className="sr-bar-y-axis">
                    <span>{timeFilter === 'week' ? '8h' : timeFilter === 'month' ? '24h' : '80h'}</span>
                    <span>{timeFilter === 'week' ? '6h' : timeFilter === 'month' ? '18h' : '60h'}</span>
                    <span>{timeFilter === 'week' ? '4h' : timeFilter === 'month' ? '12h' : '40h'}</span>
                    <span>{timeFilter === 'week' ? '2h' : timeFilter === 'month' ? '6h' : '20h'}</span>
                    <span>0h</span>
                  </div>

                  {/* Plot Area */}
                  <div className="sr-bar-plot-area">
                    {/* Horizontal grid lines */}
                    <div className="sr-bar-grid-lines">
                      <div className="sr-bar-grid-line" />
                      <div className="sr-bar-grid-line" />
                      <div className="sr-bar-grid-line" />
                      <div className="sr-bar-grid-line" />
                      <div className="sr-bar-grid-line" />
                    </div>

                    {/* Bars */}
                    <div className="sr-bars-wrap">
                      {currentStudyTime.map((item, idx) => {
                        const heightPercent = Math.min(100, (item.hours / maxStudyScale) * 100);
                        return (
                          <div
                            key={item.label}
                            className="sr-bar-col"
                            onMouseEnter={() => setHoveredBar(idx)}
                            onMouseLeave={() => setHoveredBar(null)}
                          >
                            <div
                              className="sr-bar-fill"
                              style={{ height: `${heightPercent}%` }}
                            />
                            {hoveredBar === idx && (
                              <div className="sr-bar-tooltip">
                                {item.label}: {item.hours} hrs
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* X-Axis labels */}
                    <div className="sr-bar-x-axis">
                      {currentStudyTime.map((item) => (
                        <span key={item.label}>{item.label}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Subject-wise Progress */}
              <div className="sr-card">
                <div className="sr-card-header">
                  <h3 className="sr-card-title">Subject-wise Progress</h3>
                  <button
                    type="button"
                    onClick={() => setActiveModal('subjects')}
                    className="sr-card-link"
                  >
                    <span>View All</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      arrow_forward
                    </span>
                  </button>
                </div>

                <div className="sr-subjects-list">
                  {subjectsData.map((sub) => (
                    <div
                      key={sub.id}
                      className="sr-subject-row"
                      onClick={() => onNavigateTab && onNavigateTab('syllabus')}
                      style={{ cursor: onNavigateTab ? 'pointer' : 'default' }}
                      title={`Click to view syllabus for ${sub.name}`}
                    >
                      <div
                        className="sr-sub-icon-badge"
                        style={{ backgroundColor: sub.iconBg, color: sub.iconColor }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                          {sub.icon}
                        </span>
                      </div>
                      <span className="sr-sub-name">{sub.name}</span>
                      <div className="sr-sub-track">
                        <div
                          className="sr-sub-fill"
                          style={{ width: `${sub.progressPercent}%` }}
                        />
                      </div>
                      <span className="sr-sub-percent">{sub.progressPercent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ROW 2: Focus Distribution & Weekly Performance */}
            <div className="sr-left-row">
              {/* Card 3: Focus Distribution (Donut Chart) */}
              <div className="sr-card">
                <div className="sr-card-header">
                  <h3 className="sr-card-title">Focus Distribution</h3>
                </div>

                <div className="sr-focus-wrap">
                  {/* SVG Donut Chart */}
                  <div className="sr-donut-container">
                    <svg className="sr-donut-svg" viewBox="0 0 96 96">
                      {/* Background circle track */}
                      <circle
                        cx="48"
                        cy="48"
                        r={donutRadius}
                        fill="transparent"
                        stroke="#ede8dc"
                        strokeWidth="14"
                      />

                      {/* Colored arcs */}
                      {focusDistribution.reduce(
                        (acc, item, idx) => {
                          const strokeLen = (item.percent / 100) * donutCircumference;
                          const strokeOffset = -acc.accumulatedOffset;
                          acc.accumulatedOffset += strokeLen;
                          const isHovered = hoveredSlice === idx;

                          acc.elements.push(
                            <circle
                              key={item.name}
                              cx="48"
                              cy="48"
                              r={donutRadius}
                              fill="transparent"
                              stroke={item.color}
                              strokeWidth={isHovered ? 16 : 14}
                              strokeDasharray={`${strokeLen} ${donutCircumference - strokeLen}`}
                              strokeDashoffset={strokeOffset}
                              style={{
                                transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                                opacity: hoveredSlice === null || isHovered ? 1 : 0.6,
                                cursor: 'pointer',
                              }}
                              onMouseEnter={() => setHoveredSlice(idx)}
                              onMouseLeave={() => setHoveredSlice(null)}
                            />
                          );
                          return acc;
                        },
                        { elements: [] as React.ReactNode[], accumulatedOffset: 0 }
                      ).elements}
                    </svg>

                    <div className="sr-donut-center">12 hrs</div>
                  </div>

                  {/* Legend */}
                  <div className="sr-donut-legend">
                    {focusDistribution.map((item, idx) => (
                      <div
                        key={item.name}
                        className="sr-legend-item"
                        onMouseEnter={() => setHoveredSlice(idx)}
                        onMouseLeave={() => setHoveredSlice(null)}
                        style={{
                          cursor: 'pointer',
                          opacity: hoveredSlice === null || hoveredSlice === idx ? 1 : 0.5,
                          transition: 'opacity 0.2s ease',
                        }}
                      >
                        <div className="sr-legend-left">
                          <span
                            className="sr-legend-dot"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="sr-legend-name">{item.name}</span>
                        </div>
                        <span className="sr-legend-val">{item.percent}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 4: Weekly Performance (Spline Area Curve) */}
              <div className="sr-card">
                <div className="sr-card-header">
                  <h3 className="sr-card-title">Weekly Performance</h3>
                  <button
                    type="button"
                    onClick={() => setActiveModal('weekly_perf')}
                    className="sr-card-link"
                  >
                    <span>View Details</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      arrow_forward
                    </span>
                  </button>
                </div>

                <div className="sr-perf-chart-wrap">
                  {/* Y-Axis */}
                  <div className="sr-perf-y-axis">
                    <span>100%</span>
                    <span>75%</span>
                    <span>50%</span>
                    <span>25%</span>
                    <span>0%</span>
                  </div>

                  {/* SVG Spline Plot Area */}
                  <div className="sr-perf-svg-area">
                    <svg className="sr-perf-svg" viewBox="0 0 320 150">
                      <defs>
                        <linearGradient id="srPerfGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#284232" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#284232" stopOpacity="0.02" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Grid lines */}
                      <line x1="8" y1="18" x2="312" y2="18" stroke="#eae5d8" strokeWidth="1" />
                      <line x1="8" y1="46.5" x2="312" y2="46.5" stroke="#eae5d8" strokeWidth="1" />
                      <line x1="8" y1="75" x2="312" y2="75" stroke="#eae5d8" strokeWidth="1" />
                      <line x1="8" y1="103.5" x2="312" y2="103.5" stroke="#eae5d8" strokeWidth="1" />
                      <line x1="8" y1="132" x2="312" y2="132" stroke="#eae5d8" strokeWidth="1" />

                      {/* Area Fill */}
                      <path d={areaPath} fill="url(#srPerfGrad)" />

                      {/* Curved Spline Stroke */}
                      <path
                        d={linePath}
                        fill="none"
                        stroke="#284232"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />

                      {/* Data Point Markers */}
                      {splineCoords.map((pt, idx) => (
                        <g key={pt.day}>
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={hoveredPoint === idx ? 6 : 4}
                            className="sr-perf-point"
                            onMouseEnter={() => setHoveredPoint(idx)}
                            onMouseLeave={() => setHoveredPoint(null)}
                          />
                          {hoveredPoint === idx && (
                            <g>
                              <rect
                                x={pt.x - 30}
                                y={pt.y - 30}
                                width="60"
                                height="22"
                                rx="5"
                                fill="#191c19"
                              />
                              <text
                                x={pt.x}
                                y={pt.y - 15}
                                textAnchor="middle"
                                fill="#ffffff"
                                fontSize="11"
                                fontWeight="600"
                              >
                                {pt.val}%
                              </text>
                            </g>
                          )}
                        </g>
                      ))}
                    </svg>

                    {/* X-Axis */}
                    <div className="sr-perf-x-axis">
                      {weeklyPerfPoints.map((p) => (
                        <span key={p.day}>{p.day}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN ================= */}
          <div className="sr-right-column">
            {/* Card 5: Recent Activity */}
            <div className="sr-card">
              <div className="sr-card-header">
                <h3 className="sr-card-title">Recent Activity</h3>
                <button
                  type="button"
                  onClick={() => setActiveModal('recent_activity')}
                  className="sr-card-link"
                >
                  <span>View All</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    arrow_forward
                  </span>
                </button>
              </div>

              <div className="sr-activity-timeline">
                {activities.map((act) => (
                  <div key={act.id} className="sr-activity-item">
                    <span
                      className="sr-activity-node"
                      style={{ borderColor: act.nodeColor }}
                    />
                    <div
                      className="sr-activity-icon"
                      style={{ backgroundColor: act.iconBg, color: act.iconColor }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                        {act.icon}
                      </span>
                    </div>
                    <div className="sr-activity-content">
                      <span className="sr-activity-title">{act.title}</span>
                      <span className="sr-activity-time">{act.timeAgo}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 6: Goals */}
            <div className="sr-card">
              <div className="sr-card-header">
                <h3 className="sr-card-title">Goals</h3>
                <button
                  type="button"
                  onClick={() => setActiveModal('goals')}
                  className="sr-card-link"
                >
                  <span>Manage</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    arrow_forward
                  </span>
                </button>
              </div>

              <div className="sr-goals-list">
                {goals.map((goal) => {
                  const strokeOffset =
                    goalCircumference - (goal.percent / 100) * goalCircumference;
                  return (
                    <div key={goal.id} className="sr-goal-item">
                      {/* Circular Gauge */}
                      <div className="sr-goal-gauge">
                        <svg viewBox="0 0 48 48">
                          <circle
                            cx="24"
                            cy="24"
                            r={goalRadius}
                            fill="transparent"
                            stroke="#ede8dc"
                            strokeWidth="5"
                          />
                          <circle
                            cx="24"
                            cy="24"
                            r={goalRadius}
                            fill="transparent"
                            stroke="#284232"
                            strokeWidth="5"
                            strokeDasharray={goalCircumference}
                            strokeDashoffset={strokeOffset}
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                          />
                        </svg>
                        <div className="sr-goal-gauge-center">
                          {Math.round(goal.percent)}%
                        </div>
                      </div>

                      <div className="sr-goal-info">
                        <span className="sr-goal-title">
                          {Math.round(goal.current)} / {Math.round(goal.target)} {goal.unit}
                        </span>
                        <span className="sr-goal-subtitle">{goal.subtitle}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MODAL 1: SUBJECT-WISE FULL BREAKDOWN ================= */}
      {activeModal === 'subjects' && (
        <div className="sr-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="sr-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="sr-modal-header">
              <h3 className="sr-modal-title">Subject-wise Detailed Breakdown</h3>
              <button
                type="button"
                className="sr-modal-close"
                onClick={() => setActiveModal(null)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  close
                </span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '13px', color: '#555f53', margin: 0 }}>
                Comprehensive progress, PYQ mastery, and exam readiness scores for {student.course} - Sem {student.semester}.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {subjectsData.map((sub) => (
                  <div
                    key={sub.id}
                    style={{
                      background: '#faf7f0',
                      border: '1px solid #e9e4d6',
                      borderRadius: '16px',
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '14px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        className="sr-sub-icon-badge"
                        style={{ backgroundColor: sub.iconBg, color: sub.iconColor }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                          {sub.icon}
                        </span>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#191c19' }}>
                          {sub.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#616e5e' }}>
                          {sub.completedChapters}/{sub.totalChapters} Chapters • {sub.solvedPYQs}/{sub.totalPYQs} PYQs Solved
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: '16px', color: '#284232' }}>
                        {sub.readinessScore}%
                      </div>
                      <div style={{ fontSize: '11px', color: '#7a8877' }}>Exam Readiness</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Recompute Section */}
              <div
                style={{
                  marginTop: '10px',
                  padding: '16px',
                  borderRadius: '16px',
                  background: '#f2f7f3',
                  border: '1px solid #d7e8db',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1f3e27' }}>
                      AI Exam Question Recency Engine
                    </div>
                    <div style={{ fontSize: '12px', color: '#526b58' }}>
                      Analyze curriculum modules and recalculate question frequency weights.
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: '1px solid #c5dec9',
                        fontSize: '12px',
                        background: '#ffffff',
                        color: '#1f3e27',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {subjectsData.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={handleRecomputeScores}
                      disabled={isRecomputing}
                      style={{
                        background: '#284232',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '7px 14px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span
                        className={`material-symbols-outlined ${isRecomputing ? 'animate-spin' : ''}`}
                        style={{ fontSize: '16px' }}
                      >
                        calculate
                      </span>
                      {isRecomputing ? 'Scoring...' : 'Recalculate'}
                    </button>
                  </div>
                </div>

                {aiReport && (
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #d7e8db',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      fontSize: '12px',
                      color: '#284232',
                    }}
                  >
                    <strong>{aiReport.subject} Strategy:</strong> {aiReport.suggested_revision_strategy || 'Prioritize high-weight recurring modules.'}
                  </div>
                )}
              </div>

              {aiError && (
                <div style={{ color: '#dc2626', fontSize: '12px' }}>{aiError}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: WEEKLY PERFORMANCE DETAILS ================= */}
      {activeModal === 'weekly_perf' && (
        <div className="sr-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="sr-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="sr-modal-header">
              <h3 className="sr-modal-title">Weekly Performance Report</h3>
              <button
                type="button"
                className="sr-modal-close"
                onClick={() => setActiveModal(null)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  close
                </span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px',
                  textAlign: 'center',
                }}
              >
                <div style={{ background: '#f5f2e9', padding: '14px', borderRadius: '14px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#284232' }}>56.8%</div>
                  <div style={{ fontSize: '11px', color: '#616e5e', fontWeight: 600 }}>Avg Weekly Score</div>
                </div>
                <div style={{ background: '#f5f2e9', padding: '14px', borderRadius: '14px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#284232' }}>28.8 hrs</div>
                  <div style={{ fontSize: '11px', color: '#616e5e', fontWeight: 600 }}>Total Study Time</div>
                </div>
                <div style={{ background: '#f5f2e9', padding: '14px', borderRadius: '14px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#284232' }}>7 Days</div>
                  <div style={{ fontSize: '11px', color: '#616e5e', fontWeight: 600 }}>Current Streak 🔥</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {weeklyPerfPoints.map((pt) => (
                  <div
                    key={pt.day}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: '#ffffff',
                      border: '1px solid #ebe5d8',
                      borderRadius: '12px',
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '13px', color: '#191c19' }}>
                      {pt.day === 'Mon'
                        ? 'Monday'
                        : pt.day === 'Tue'
                        ? 'Tuesday'
                        : pt.day === 'Wed'
                        ? 'Wednesday'
                        : pt.day === 'Thu'
                        ? 'Thursday'
                        : pt.day === 'Fri'
                        ? 'Friday'
                        : pt.day === 'Sat'
                        ? 'Saturday'
                        : 'Sunday'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '120px',
                          height: '8px',
                          background: '#ebe5d8',
                          borderRadius: '4px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${pt.val}%`,
                            height: '100%',
                            background: '#284232',
                            borderRadius: '4px',
                          }}
                        />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: '#284232', width: '38px', textAlign: 'right' }}>
                        {pt.val}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: RECENT ACTIVITY FULL LOG ================= */}
      {activeModal === 'recent_activity' && (
        <div className="sr-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="sr-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="sr-modal-header">
              <h3 className="sr-modal-title">Activity History</h3>
              <button
                type="button"
                className="sr-modal-close"
                onClick={() => setActiveModal(null)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  close
                </span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {activities.map((act) => (
                <div
                  key={act.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    background: '#faf7f0',
                    border: '1px solid #ebe5d8',
                  }}
                >
                  <div
                    className="sr-activity-icon"
                    style={{ backgroundColor: act.iconBg, color: act.iconColor }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                      {act.icon}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#191c19' }}>
                      {act.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#7a8877' }}>{act.timeAgo}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: MANAGE GOALS ================= */}
      {activeModal === 'goals' && (
        <div className="sr-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="sr-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="sr-modal-header">
              <h3 className="sr-modal-title">Manage Study Goals</h3>
              <button
                type="button"
                className="sr-modal-close"
                onClick={() => setActiveModal(null)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  close
                </span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <p style={{ fontSize: '13px', color: '#555f53', margin: 0 }}>
                Adjust your weekly and semester study targets to keep your momentum going strong.
              </p>

              {goals.map((goal, idx) => (
                <div
                  key={goal.id}
                  style={{
                    background: '#fbf9f5',
                    border: '1px solid #ebe5d8',
                    borderRadius: '16px',
                    padding: '16px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#191c19' }}>
                      {goal.subtitle}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#284232' }}>
                      {Math.round(goal.current)} / {Math.round(goal.target)} {goal.unit}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <input
                      type="range"
                      min={idx === 0 ? 5 : idx === 1 ? 2 : 10}
                      max={idx === 0 ? 50 : idx === 1 ? 25 : 60}
                      step={1}
                      value={Math.round(goal.target)}
                      onChange={(e) => {
                        const newTarget = Math.max(1, Math.round(Number(e.target.value)));
                        setGoals((prev) =>
                          prev.map((g, i) =>
                            i === idx
                              ? {
                                  ...g,
                                  current: Math.round(g.current),
                                  target: newTarget,
                                  title: `${Math.round(g.current)} / ${newTarget} ${g.unit}`,
                                  percent: Math.min(100, Math.round((Math.round(g.current) / newTarget) * 100)),
                                }
                              : g
                          )
                        );
                      }}
                      style={{
                        flex: 1,
                        accentColor: '#284232',
                        cursor: 'pointer',
                      }}
                    />
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#191c19',
                        minWidth: '58px',
                        textAlign: 'right',
                        background: '#f0ece1',
                        padding: '4px 8px',
                        borderRadius: '8px',
                      }}
                    >
                      {Math.round(goal.target)} {goal.unit}
                    </span>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{
                  background: '#284232',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '12px 20px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  marginTop: '8px',
                }}
              >
                Save Goals
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
