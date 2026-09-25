import React, { useState } from 'react';
import type { College, Student } from '../types';

interface NavbarProps {
  setActiveTab: (tab: string) => void;
  student: Student | null;
  college: College | null;
  onLogout: () => void;
  onTriggerScrape: () => void;
  isScraping: boolean;
  onUpdateStudent?: (updated: Partial<Student>) => Promise<void>;
  onOpenProfileModal?: () => void;
  onSearch?: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  setActiveTab,
  student,
  onTriggerScrape,
  isScraping,
  onOpenProfileModal,
  onSearch,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (onSearch) {
      onSearch(val);
    }
  };

  const branchShort = student?.branch
    ? student.branch.includes('(')
      ? student.branch.split('(')[0].trim()
      : student.branch.split(' ')[0]
    : 'CSE';

  const customAvatar = student?.avatar_url || localStorage.getItem('exambuddy_avatar') || '';

  return (
    <header className="eb-editorial-navbar">
      {/* Search Input Bar (Center-Left) */}
      <div className="eb-nav-search-bar">
        <span className="material-symbols-outlined eb-nav-search-icon">
          search
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search subjects, topics, syllabus..."
          className="eb-nav-search-input"
        />
      </div>

      {/* Right Action Group */}
      <div className="eb-nav-actions">
        {/* Portal Synced Pill */}
        <div className="eb-nav-status-pill">
          <span className={`eb-nav-status-dot ${isScraping ? 'syncing' : ''}`} />
          <span className="eb-nav-status-text">
            {isScraping ? 'Crawling portal...' : 'Portal Synced'}
          </span>
        </div>

        {/* Crawl Portal Button */}
        <button
          type="button"
          onClick={onTriggerScrape}
          disabled={isScraping}
          className="eb-nav-crawl-btn"
          title="Scrape and extract latest syllabus, PYQs, and notices"
        >
          <span
            className={`material-symbols-outlined eb-crawl-icon ${
              isScraping ? 'spinning' : ''
            }`}
          >
            sync
          </span>
          <span>Crawl Portal</span>
        </button>

        {/* Notification Bell with Red Badge Dot */}
        <button
          type="button"
          onClick={() => setActiveTab('notices')}
          className="eb-nav-bell-btn"
          title="Notices & Announcements"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            notifications
          </span>
          <span className="eb-nav-bell-dot" />
        </button>

        {/* Student Profile Pill */}
        <div
          onClick={() => {
            setActiveTab('settings');
            if (onOpenProfileModal) onOpenProfileModal();
          }}
          className="eb-nav-profile-pill"
          title="Click to view and edit profile"
        >
          {/* Illustrated Anime Student Avatar */}
          <div className="eb-nav-avatar">
            {customAvatar ? (
              <img
                src={customAvatar}
                alt={student?.name || 'User'}
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="50" fill="#f7ede2" />
                {/* Dark Shirt with red accents */}
                <path d="M18 98 C25 80, 38 74, 50 74 C62 74, 75 80, 82 98 Z" fill="#181b18" />
                <path d="M42 74 L50 86 L58 74 Z" fill="#dc2626" />
                <path d="M46 74 L50 81 L54 74 Z" fill="#ffffff" />
                {/* Neck & Face */}
                <rect x="44" y="60" width="12" height="16" rx="3" fill="#f6c29b" />
                <ellipse cx="50" cy="50" rx="21" ry="23" fill="#f6c29b" />
                {/* Eyes */}
                <ellipse cx="42" cy="49" rx="3" ry="3.5" fill="#191c19" />
                <ellipse cx="58" cy="49" rx="3" ry="3.5" fill="#191c19" />
                <circle cx="43.2" cy="47.8" r="1.2" fill="#ffffff" />
                <circle cx="59.2" cy="47.8" r="1.2" fill="#ffffff" />
                {/* Subtle smile */}
                <path d="M46 60 Q50 63 54 60" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round" />
                {/* Spiky Dark Hair */}
                <path d="M26 48 C22 33, 32 20, 50 20 C68 20, 78 33, 74 48 C70 34, 60 28, 50 28 C40 28, 30 34, 26 48 Z" fill="#191c19" />
                <path d="M28 40 L36 46 L32 30 L45 44 L40 24 L52 42 L56 26 L58 43 L68 33 L64 45 L72 38" stroke="#191c19" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="#191c19" />
              </svg>
            )}
          </div>

          <div className="eb-nav-profile-info">
            <span className="eb-nav-profile-name">
              {student?.name || 'Akash Das'}
            </span>
            <span className="eb-nav-profile-sub">
              {branchShort} • Sem {student?.semester || 2}
            </span>
          </div>

          <span className="material-symbols-outlined eb-nav-chevron">
            expand_more
          </span>
        </div>
      </div>
    </header>
  );
};
