import React, { useState, useMemo } from 'react';
import type { Notice, Student } from '../types';
import '../styles/NoticesPage.css';

interface NoticesPageProps {
  student: Student;
  notices: Notice[];
  onToggleNotifications: (enabled: boolean) => void;
}

interface NoticeItemData {
  id: string;
  title: string;
  date: string;
  category: 'exams' | 'academic' | 'assignments' | 'college' | 'events' | 'others';
  description: string;
  tags: { label: string; type: string }[];
  icon: string;
  accentBg: string;
  accentColor: string;
  attachmentUrl?: string;
}

const DEFAULT_NOTICES: NoticeItemData[] = [
  {
    id: 'nt-1',
    title: 'Semester 2 Exam Schedule Released',
    date: '20 Sep 2026',
    category: 'exams',
    description:
      'The detailed timetable for Semester 2 (Even Semester) examinations has been released. Please check and plan your preparation accordingly.',
    tags: [
      { label: 'Academic', type: 'academic' },
      { label: 'Exam', type: 'exam' },
    ],
    icon: 'campaign',
    accentBg: '#fee2e2',
    accentColor: '#ef4444',
  },
  {
    id: 'nt-2',
    title: 'DECO Lab File Submission',
    date: '18 Sep 2026',
    category: 'assignments',
    description:
      'All students are required to submit their DECO lab files by 25th September 2026. Late submissions will not be accepted.',
    tags: [
      { label: 'Assignment', type: 'assignment' },
      { label: 'DECO', type: 'deco' },
    ],
    icon: 'description',
    accentBg: '#e0f2fe',
    accentColor: '#0284c7',
  },
  {
    id: 'nt-3',
    title: 'College Holiday Notice',
    date: '15 Sep 2026',
    category: 'college',
    description:
      'The college will remain closed on 2nd October 2026 on account of Gandhi Jayanti.',
    tags: [
      { label: 'College', type: 'college' },
      { label: 'Holiday', type: 'holiday' },
    ],
    icon: 'info',
    accentBg: '#dcfce7',
    accentColor: '#16a34a',
  },
  {
    id: 'nt-4',
    title: 'Tech Talk: Career Opportunities in AI',
    date: '14 Sep 2026',
    category: 'events',
    description:
      'A guest lecture on "Career Opportunities in AI" will be held on 28th September 2026 at 3:00 PM in the Auditorium. All students are encouraged to attend.',
    tags: [
      { label: 'Event', type: 'event' },
      { label: 'AI', type: 'ai' },
    ],
    icon: 'group',
    accentBg: '#ede9fe',
    accentColor: '#7c3aed',
  },
  {
    id: 'nt-5',
    title: 'Internal Assessment Marks Published',
    date: '12 Sep 2026',
    category: 'academic',
    description:
      'Semester 2 internal assessment marks are now available on the student portal. Please check and contact your respective faculty in case of any discrepancy.',
    tags: [
      { label: 'Academic', type: 'academic' },
      { label: 'Result', type: 'result' },
    ],
    icon: 'feed',
    accentBg: '#ffedd5',
    accentColor: '#f97316',
  },
];

interface ImportantDateItem {
  id: string;
  day: string;
  month: string;
  color: 'red' | 'blue' | 'green' | 'purple';
  title: string;
  subtitle: string;
}

const IMPORTANT_DATES: ImportantDateItem[] = [
  {
    id: 'id-1',
    day: '25',
    month: 'Sep',
    color: 'red',
    title: 'DECO Lab File Submission',
    subtitle: 'Assignment Deadline',
  },
  {
    id: 'id-2',
    day: '28',
    month: 'Sep',
    color: 'blue',
    title: 'Tech Talk: Career Opportunities in AI',
    subtitle: 'College Event',
  },
  {
    id: 'id-3',
    day: '02',
    month: 'Oct',
    color: 'green',
    title: 'Gandhi Jayanti',
    subtitle: 'College Holiday',
  },
  {
    id: 'id-4',
    day: '10',
    month: 'Oct',
    color: 'purple',
    title: 'Semester 2 Exams Begin',
    subtitle: 'Examination',
  },
];

export const NoticesPage: React.FC<NoticesPageProps> = ({
  student,
  notices,
  onToggleNotifications,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedNotice, setSelectedNotice] = useState<NoticeItemData | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Combine default curated notices with any live scraped notices from portal
  const combinedNotices = useMemo(() => {
    const list: NoticeItemData[] = [...DEFAULT_NOTICES];

    if (notices && notices.length > 0) {
      notices.forEach((n) => {
        // Avoid duplicate titles
        if (!list.some((existing) => existing.title.toLowerCase() === n.title.toLowerCase())) {
          list.push({
            id: String(n.id),
            title: n.title,
            date: new Date(n.detected_at).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }),
            category: n.title.toLowerCase().includes('exam')
              ? 'exams'
              : n.title.toLowerCase().includes('lab')
              ? 'assignments'
              : 'college',
            description: n.content || 'Official circular published on the university portal.',
            tags: [
              { label: 'Official', type: 'college' },
              { label: `Sem ${student.semester}`, type: 'academic' },
            ],
            icon: 'notifications_active',
            accentBg: '#eaf4eb',
            accentColor: '#284232',
            attachmentUrl: (n as unknown as { source_url?: string }).source_url,
          });
        }
      });
    }

    return list;
  }, [notices, student.semester]);

  // Filter notices by category
  const filteredNotices = useMemo(() => {
    if (activeCategory === 'all') return combinedNotices;
    return combinedNotices.filter((n) => n.category === activeCategory);
  }, [combinedNotices, activeCategory]);

  const handleQuickLink = (type: string) => {
    if (type === 'website') {
      const url = student.college_url || 'https://makautwb.ac.in';
      window.open(url.startsWith('http') ? url : `https://${url}`, '_blank');
    } else {
      setToastMessage(`Opening ${type}...`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <div className="nt-page-container">
      {/* Botanical Corner Leaf Watermark */}
      <div className="nt-leaf-watermark">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
          <path d="M20 180 C 40 140, 80 110, 150 90 C 130 110, 90 150, 60 170 Z" fill="#284232" opacity="0.3" />
          <path d="M50 140 C 70 100, 120 70, 180 50 C 160 80, 120 120, 80 140 Z" fill="#284232" opacity="0.25" />
          <path d="M10 190 Q 70 130 160 80" stroke="#284232" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
        </svg>
      </div>

      <div className="nt-content-wrap">
        {/* ================= TOP HEADER & QUOTE ROW ================= */}
        <div className="nt-top-row">
          <div className="nt-header-col">
            <div className="nt-title-group">
              <h1 className="nt-main-title">Notices</h1>
              <p className="nt-subtitle">Stay updated. Don't miss anything important.</p>
            </div>

            {/* Category Filter Pills in Header */}
            <div className="nt-filter-pills">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`nt-filter-pill ${activeCategory === 'all' ? 'active' : ''}`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('exams')}
                className={`nt-filter-pill ${activeCategory === 'exams' ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  calendar_today
                </span>
                <span>Exams</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('academic')}
                className={`nt-filter-pill ${activeCategory === 'academic' ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  school
                </span>
                <span>Academic</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('assignments')}
                className={`nt-filter-pill ${activeCategory === 'assignments' ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  assignment
                </span>
                <span>Assignments</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('college')}
                className={`nt-filter-pill ${activeCategory === 'college' ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  account_balance
                </span>
                <span>College</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('events')}
                className={`nt-filter-pill ${activeCategory === 'events' ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  campaign
                </span>
                <span>Events</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('others')}
                className={`nt-filter-pill ${activeCategory === 'others' ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  more_horiz
                </span>
                <span>Others</span>
              </button>
            </div>
          </div>

          {/* Inspirational Quote Card on top right */}
          <div className="nt-quote-card">
            <span className="nt-quote-mark">“</span>
            <p className="nt-quote-text">
              Be informed today for a smoother tomorrow.
            </p>

            <svg
              className="nt-quote-leaves"
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
        <div className="nt-main-grid">
          {/* Left Column: Notices Feed */}
          <div className="nt-notices-feed">
            {filteredNotices.length === 0 ? (
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e7e0d3',
                  borderRadius: '20px',
                  padding: '48px',
                  textAlign: 'center',
                  color: '#657161',
                  fontSize: '14px',
                }}
              >
                No notices found under this category.
              </div>
            ) : (
              filteredNotices.map((notice) => (
                <div
                  key={notice.id}
                  onClick={() => setSelectedNotice(notice)}
                  className="nt-notice-card"
                >
                  <div
                    className="nt-notice-icon-box"
                    style={{
                      backgroundColor: notice.accentBg,
                      color: notice.accentColor,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                      {notice.icon}
                    </span>
                  </div>

                  <div className="nt-notice-body">
                    <div className="nt-notice-headrow">
                      <h3 className="nt-notice-title">{notice.title}</h3>
                      <span className="nt-notice-date">{notice.date}</span>
                    </div>

                    <p className="nt-notice-desc">{notice.description}</p>

                    <div className="nt-notice-tags">
                      {notice.tags.map((tag, tIdx) => (
                        <span key={tIdx} className={`nt-tag-pill ${tag.type}`}>
                          {tag.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <span className="material-symbols-outlined nt-notice-arrow">
                    chevron_right
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Right Sidebar: Important Dates, Filter Notices, Quick Links */}
          <div className="nt-sidebar-cards">
            {/* Card 1: Important Dates */}
            <div className="nt-dates-card">
              <div className="nt-card-headrow">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#dc2626' }}>
                    calendar_month
                  </span>
                  <h3 className="nt-card-title">Important Dates</h3>
                </div>
                <span
                  onClick={() => {
                    setToastMessage('Viewing complete academic calendar.');
                    setTimeout(() => setToastMessage(null), 3000);
                  }}
                  className="nt-view-all-link"
                >
                  <span>View All</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                    arrow_forward
                  </span>
                </span>
              </div>

              <div className="nt-dates-list">
                {IMPORTANT_DATES.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setToastMessage(`Timeline Event: ${item.title} (${item.day} ${item.month})`);
                      setTimeout(() => setToastMessage(null), 3000);
                    }}
                    className="nt-date-item"
                  >
                    <div className="nt-date-left">
                      <div className="nt-date-badge">
                        <span className={`nt-date-num ${item.color}`}>{item.day}</span>
                        <span className={`nt-date-month ${item.color}`}>{item.month}</span>
                      </div>
                      <div className="nt-date-info">
                        <span className="nt-date-title">{item.title}</span>
                        <span className="nt-date-sub">{item.subtitle}</span>
                      </div>
                    </div>

                    <span className="material-symbols-outlined nt-date-arrow">
                      chevron_right
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2: Filter Notices */}
            <div className="nt-filters-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#284232' }}>
                  filter_alt
                </span>
                <h3 className="nt-card-title">Filter Notices</h3>
              </div>

              <div className="nt-filters-grid">
                <button
                  type="button"
                  onClick={() => setActiveCategory('all')}
                  className={`nt-filter-tag ${activeCategory === 'all' ? 'active' : ''}`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCategory('exams')}
                  className={`nt-filter-tag ${activeCategory === 'exams' ? 'active' : ''}`}
                >
                  Exams
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCategory('academic')}
                  className={`nt-filter-tag ${activeCategory === 'academic' ? 'active' : ''}`}
                >
                  Academic
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCategory('assignments')}
                  className={`nt-filter-tag ${activeCategory === 'assignments' ? 'active' : ''}`}
                >
                  Assignments
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCategory('college')}
                  className={`nt-filter-tag ${activeCategory === 'college' ? 'active' : ''}`}
                >
                  College
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCategory('events')}
                  className={`nt-filter-tag ${activeCategory === 'events' ? 'active' : ''}`}
                >
                  Events
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCategory('others')}
                  className={`nt-filter-tag ${activeCategory === 'others' ? 'active' : ''}`}
                >
                  Others
                </button>
              </div>
            </div>

            {/* Card 3: Quick Links */}
            <div className="nt-links-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#284232' }}>
                  link
                </span>
                <h3 className="nt-card-title">Quick Links</h3>
              </div>

              <div className="nt-links-grid">
                {/* Academic Calendar */}
                <button
                  type="button"
                  onClick={() => handleQuickLink('Academic Calendar')}
                  className="nt-link-tile tile-red"
                >
                  <div className="nt-link-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      description
                    </span>
                  </div>
                  <span className="nt-link-title">Academic Calendar</span>
                </button>

                {/* Exam Guidelines */}
                <button
                  type="button"
                  onClick={() => handleQuickLink('Exam Guidelines')}
                  className="nt-link-tile tile-blue"
                >
                  <div className="nt-link-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      article
                    </span>
                  </div>
                  <span className="nt-link-title">Exam Guidelines</span>
                </button>

                {/* Important Documents */}
                <button
                  type="button"
                  onClick={() => handleQuickLink('Important Documents')}
                  className="nt-link-tile tile-green"
                >
                  <div className="nt-link-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      download
                    </span>
                  </div>
                  <span className="nt-link-title">Important Documents</span>
                </button>

                {/* College Website */}
                <button
                  type="button"
                  onClick={() => handleQuickLink('website')}
                  className="nt-link-tile tile-purple"
                >
                  <div className="nt-link-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      language
                    </span>
                  </div>
                  <span className="nt-link-title">College Website</span>
                </button>
              </div>

              {/* Email Alert Toggle Switch */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '1px solid #f0eae0',
                  marginTop: '4px',
                }}
              >
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#191e17', display: 'block' }}>
                    Email Alerts
                  </span>
                  <span style={{ fontSize: '10.5px', color: '#727e6e' }}>
                    {student.email}
                  </span>
                </div>

                <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={student.email_notifications_enabled}
                    onChange={(e) => onToggleNotifications(e.target.checked)}
                    style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                  />
                  <div
                    style={{
                      width: '38px',
                      height: '22px',
                      backgroundColor: student.email_notifications_enabled ? '#284232' : '#ded5c6',
                      borderRadius: '9999px',
                      transition: 'background-color 0.2s ease',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: '2px',
                        left: student.email_notifications_enabled ? '18px' : '2px',
                        width: '18px',
                        height: '18px',
                        backgroundColor: '#ffffff',
                        borderRadius: '50%',
                        transition: 'left 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                      }}
                    />
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notice Detail Modal */}
      {selectedNotice && (
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
              maxWidth: '600px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: '#284232' }}>
                  Official Notice • {selectedNotice.date}
                </span>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', fontWeight: 700, margin: '4px 0 0', color: '#181d16' }}>
                  {selectedNotice.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedNotice(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#687865' }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: '#faf8f5', padding: '18px', borderRadius: '14px', border: '1px solid #eee8de', fontSize: '13.5px', lineHeight: 1.6, color: '#2b3329' }}>
              {selectedNotice.description}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {selectedNotice.tags.map((tag, idx) => (
                <span key={idx} className={`nt-tag-pill ${tag.type}`}>
                  {tag.label}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', paddingTop: '6px' }}>
              <button
                type="button"
                onClick={() => {
                  setToastMessage(`Notice link copied: "${selectedNotice.title}"`);
                  setSelectedNotice(null);
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="nt-filter-pill active"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Copy Announcement Link
              </button>
              <button
                type="button"
                onClick={() => setSelectedNotice(null)}
                className="nt-filter-pill"
                style={{ padding: '8px 20px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
