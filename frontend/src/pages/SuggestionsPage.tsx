import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Student } from '../types';
import { getSuggestionsForSemester, type SubjectSuggestion } from '../data/suggestionsData';
import '../styles/SuggestionsPage.css';

interface SuggestionsPageProps {
  student: Student;
  onNavigateTab?: (tab: string) => void;
}

export const SuggestionsPage: React.FC<SuggestionsPageProps> = ({ student, onNavigateTab }) => {
  // Semester selection (defaults to student's active semester)
  const defaultSem = String(student?.semester || '3');
  const [selectedSem, setSelectedSem] = useState<string>(defaultSem);

  // Suggestions for currently chosen semester
  const semesterSubjects = useMemo<SubjectSuggestion[]>(() => {
    return getSuggestionsForSemester(selectedSem, student?.branch);
  }, [selectedSem, student?.branch]);

  // Active Subject selection
  const [activeSubjectId, setActiveSubjectId] = useState<string>(
    semesterSubjects[0]?.subjectId || ''
  );

  // Synchronize active subject whenever the semester or subjects change
  useEffect(() => {
    if (semesterSubjects.length > 0) {
      if (!semesterSubjects.some((s) => s.subjectId === activeSubjectId)) {
        setActiveSubjectId(semesterSubjects[0].subjectId);
      }
    }
  }, [semesterSubjects, activeSubjectId]);

  // Resolve currently active subject
  const activeSubject = useMemo<SubjectSuggestion>(() => {
    const found = semesterSubjects.find((s) => s.subjectId === activeSubjectId);
    return found || semesterSubjects[0] || {
      subjectId: 'default',
      subjectName: 'Core Subject',
      chaptersCount: 5,
      icon: 'auto_stories',
      accentBg: '#eaf4eb',
      accentColor: '#284232',
      syllabusCovered: 40,
      topics: [],
    };
  }, [semesterSubjects, activeSubjectId]);

  // Added to Plan state (persisted in localStorage)
  const [addedPlans, setAddedPlans] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('exambuddy_planned_topics');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Action toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Horizontal carousel ref for smooth scroll
  const scrollRowRef = useRef<HTMLDivElement>(null);

  const handleScrollRight = () => {
    if (scrollRowRef.current) {
      scrollRowRef.current.scrollBy({ left: 240, behavior: 'smooth' });
    }
  };

  const handleTogglePlan = (topicId: string, topicName: string) => {
    setAddedPlans((prev) => {
      const isCurrentlyAdded = !!prev[topicId];
      const next = { ...prev, [topicId]: !isCurrentlyAdded };
      try {
        localStorage.setItem('exambuddy_planned_topics', JSON.stringify(next));
      } catch {
        // ignore
      }
      setToastMessage(
        isCurrentlyAdded
          ? `Removed "${topicName}" from Study Plan.`
          : `Added "${topicName}" to your Study Plan!`
      );
      setTimeout(() => setToastMessage(null), 3500);
      return next;
    });
  };

  const handleOpenResource = (query: string) => {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Importance count breakdown
  const importanceCounts = useMemo(() => {
    const counts = { veryHigh: 0, high: 0, medium: 0, low: 0 };
    activeSubject.topics.forEach((t) => {
      if (t.importance === 'Very High') counts.veryHigh++;
      else if (t.importance === 'High') counts.high++;
      else if (t.importance === 'Medium') counts.medium++;
      else if (t.importance === 'Low') counts.low++;
    });
    return counts;
  }, [activeSubject]);

  // Donut chart math
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (activeSubject.syllabusCovered / 100) * circumference;

  return (
    <div className="sugg-page-container">
      {/* Botanical Corner Leaf Art Watermark */}
      <div className="sugg-leaf-watermark">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
          <path d="M20 180 C 40 140, 80 110, 150 90 C 130 110, 90 150, 60 170 Z" fill="#284232" opacity="0.3" />
          <path d="M50 140 C 70 100, 120 70, 180 50 C 160 80, 120 120, 80 140 Z" fill="#284232" opacity="0.25" />
          <path d="M10 190 Q 70 130 160 80" stroke="#284232" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
        </svg>
      </div>

      <div className="sugg-content-wrap">
        {/* ================= 1. TOP HEADER ROW ================= */}
        <div className="sugg-top-row">
          <div className="sugg-title-group">
            <h1 className="sugg-main-title">Suggestions</h1>
            <p className="sugg-subtitle">
              Most important topics for your subjects, based on PYQs, syllabus weightage and exam patterns.
            </p>
          </div>

          {/* Semester Selector Pill */}
          <div>
            <select
              value={selectedSem}
              onChange={(e) => {
                const newSem = e.target.value;
                setSelectedSem(newSem);
                const nextSubjs = getSuggestionsForSemester(newSem, student?.branch);
                if (nextSubjs[0]) {
                  setActiveSubjectId(nextSubjs[0].subjectId);
                }
              }}
              className="sugg-sem-pill-select"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={String(s)}>
                  {student.branch || 'CSE'} • Semester {s}
                </option>
              ))}
            </select>
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

        {/* ================= 2. SUBJECTS CAROUSEL ================= */}
        <div className="sugg-carousel-wrap">
          <div className="sugg-subjects-scroll-row" ref={scrollRowRef}>
            {semesterSubjects.map((sub) => {
              const isActive = activeSubject.subjectId === sub.subjectId;
              return (
                <div
                  key={sub.subjectId}
                  onClick={() => setActiveSubjectId(sub.subjectId)}
                  className={`sugg-subject-card ${isActive ? 'active' : ''}`}
                >
                  <div
                    className="sugg-subj-icon-box"
                    style={{ backgroundColor: sub.accentBg, color: sub.accentColor }}
                  >
                    <span className="material-symbols-outlined">{sub.icon}</span>
                  </div>
                  <div className="sugg-subj-info">
                    <span className="sugg-subj-name">{sub.subjectName}</span>
                    <span className="sugg-subj-chapters">{sub.chaptersCount} Chapters</span>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleScrollRight}
            title="Scroll subjects"
            className="sugg-scroll-arrow-btn"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              chevron_right
            </span>
          </button>
        </div>

        {/* ================= 3. MAIN 2-COLUMN WORKSPACE ================= */}
        <div className="sugg-main-grid">
          {/* Left Column: Important Topics Table */}
          <div className="sugg-topics-card">
            <div className="sugg-card-header">
              <div className="sugg-headline-group">
                <h2 className="sugg-headline">
                  Important Topics – {activeSubject.subjectName}
                </h2>
                <p className="sugg-desc">
                  Topics ranked by past year questions, weightage and syllabus analysis.
                </p>
              </div>

              <div className="sugg-badge-pill">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  history_edu
                </span>
                <span>Based on 5 years PYQs</span>
                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#687865' }}>
                  info
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="sugg-table-wrap">
              <table className="sugg-topics-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Topic</th>
                    <th>Importance</th>
                    <th>PYQ Frequency</th>
                    <th>Recommended Resources</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeSubject.topics.map((t) => {
                    const isAdded = !!addedPlans[t.id];
                    const importanceClass =
                      t.importance === 'Very High'
                        ? 'very-high'
                        : t.importance === 'High'
                        ? 'high'
                        : t.importance === 'Medium'
                        ? 'medium'
                        : 'low';

                    return (
                      <tr key={t.id}>
                        <td>{t.rank}</td>
                        <td>
                          <span className="sugg-topic-cell-title">{t.topic}</span>
                        </td>
                        <td>
                          <span className={`sugg-importance-pill ${importanceClass}`}>
                            <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                              bar_chart
                            </span>
                            <span>{t.importance}</span>
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: '#1a231b' }}>
                            {t.pyqFrequency}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleOpenResource(t.resourceQuery)}
                            title={`Watch ${t.resourceQuery} on YouTube`}
                            className="sugg-resource-btn"
                          >
                            <span className="material-symbols-outlined sugg-yt-icon">
                              play_circle
                            </span>
                            <span>
                              {t.resourceTitle} ({t.resourceChannel})
                            </span>
                          </button>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleTogglePlan(t.id, t.topic)}
                            className={`sugg-add-plan-btn ${isAdded ? 'added' : ''}`}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                              {isAdded ? 'check_circle' : 'add'}
                            </span>
                            <span>{isAdded ? 'Added' : 'Add to Plan'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Subject Insights, How We Decide, Quick Actions */}
          <div className="sugg-sidebar-col">
            {/* Card 1: Subject Insights */}
            <div className="sugg-sidebar-card">
              <div className="sugg-sidebar-headrow">
                <span className="material-symbols-outlined" style={{ color: '#284232', fontSize: '20px' }}>
                  insights
                </span>
                <h3 className="sugg-sidebar-title">Subject Insights</h3>
              </div>

              <div className="sugg-insights-body">
                {/* Donut Chart */}
                <div className="sugg-donut-container">
                  <svg viewBox="0 0 88 88">
                    <circle
                      cx="44"
                      cy="44"
                      r={radius}
                      fill="transparent"
                      stroke="#ede8dc"
                      strokeWidth="9"
                    />
                    <circle
                      cx="44"
                      cy="44"
                      r={radius}
                      fill="transparent"
                      stroke="#284232"
                      strokeWidth="9"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeOffset}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                    />
                  </svg>
                  <div className="sugg-donut-label-box">
                    <span className="sugg-donut-val">{activeSubject.syllabusCovered}%</span>
                    <span className="sugg-donut-sub">Syllabus Covered</span>
                  </div>
                </div>

                {/* Topics Breakdown */}
                <div className="sugg-insights-list">
                  <div className="sugg-insight-row highlight">
                    <span>Total Topics</span>
                    <span>{activeSubject.topics.length + 17}</span>
                  </div>
                  <div className="sugg-insight-row">
                    <span>
                      <span className="sugg-dot very-high" />
                      Very High
                    </span>
                    <span style={{ fontWeight: 700 }}>{importanceCounts.veryHigh}</span>
                  </div>
                  <div className="sugg-insight-row">
                    <span>
                      <span className="sugg-dot high" />
                      High
                    </span>
                    <span style={{ fontWeight: 700 }}>{importanceCounts.high}</span>
                  </div>
                  <div className="sugg-insight-row">
                    <span>
                      <span className="sugg-dot medium" />
                      Medium
                    </span>
                    <span style={{ fontWeight: 700 }}>{importanceCounts.medium}</span>
                  </div>
                  <div className="sugg-insight-row">
                    <span>
                      <span className="sugg-dot low" />
                      Low
                    </span>
                    <span style={{ fontWeight: 700 }}>{importanceCounts.low}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: How We Decide Importance */}
            <div className="sugg-sidebar-card">
              <div className="sugg-sidebar-headrow">
                <span className="material-symbols-outlined" style={{ color: '#d97706', fontSize: '20px' }}>
                  lightbulb
                </span>
                <h3 className="sugg-sidebar-title">How We Decide Importance?</h3>
              </div>

              <div className="sugg-decide-list">
                <div className="sugg-decide-item">
                  <span className="material-symbols-outlined sugg-check-icon">check</span>
                  <span>Analysis of last 5 years PYQs</span>
                </div>
                <div className="sugg-decide-item">
                  <span className="material-symbols-outlined sugg-check-icon">check</span>
                  <span>Chapter weightage in university exams</span>
                </div>
                <div className="sugg-decide-item">
                  <span className="material-symbols-outlined sugg-check-icon">check</span>
                  <span>Topic frequency and question patterns</span>
                </div>
                <div className="sugg-decide-item">
                  <span className="material-symbols-outlined sugg-check-icon">check</span>
                  <span>Handpicked by AI from official syllabus</span>
                </div>
              </div>
            </div>

            {/* Card 3: Quick Actions */}
            <div className="sugg-sidebar-card">
              <div className="sugg-sidebar-headrow">
                <span className="material-symbols-outlined" style={{ color: '#0284c7', fontSize: '20px' }}>
                  ads_click
                </span>
                <h3 className="sugg-sidebar-title">Quick Actions</h3>
              </div>

              <div className="sugg-actions-grid">
                <button
                  type="button"
                  onClick={() => {
                    if (onNavigateTab) onNavigateTab('study-report');
                  }}
                  className="sugg-action-btn plan"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    calendar_month
                  </span>
                  <span>Create Study Plan</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setToastMessage(`Topic-wise tracking activated for ${activeSubject.subjectName}.`);
                    setTimeout(() => setToastMessage(null), 3000);
                  }}
                  className="sugg-action-btn mark"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    check_box
                  </span>
                  <span>Mark Topic Wise</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onNavigateTab) onNavigateTab('syllabus');
                  }}
                  className="sugg-action-btn syllabus"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    description
                  </span>
                  <span>View Full Syllabus</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setToastMessage(`Goal Set: Achieve 85%+ in ${activeSubject.subjectName}!`);
                    setTimeout(() => setToastMessage(null), 3500);
                  }}
                  className="sugg-action-btn goal"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    track_changes
                  </span>
                  <span>Set Goal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
