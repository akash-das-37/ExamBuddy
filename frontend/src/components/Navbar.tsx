import React, { useState } from 'react';
import { getStudentAvatarUrl } from '../utils/avatar';
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

  const userAvatar = getStudentAvatarUrl(student);

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
          {/* Dynamic User Avatar */}
          <div className="eb-nav-avatar">
            <img
              src={userAvatar}
              alt={student?.name || 'Student'}
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
            />
          </div>

          <div className="eb-nav-profile-info">
            <span className="eb-nav-profile-name">
              {student?.name || 'Student'}
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
