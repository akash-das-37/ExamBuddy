import React from 'react';
import type { College, Student } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  student: Student;
  college: College | null;
  noticesCount: number;
  onLogout?: () => void;
  onOpenSettings?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  noticesCount,
  onLogout,
  onOpenSettings,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'home', badge: null },
    { id: 'study-report', label: 'Study Report', icon: 'poll', badge: null },
    { id: 'syllabus', label: 'Syllabus', icon: 'menu_book', badge: null },
    { id: 'pyqs', label: 'Question Bank (PYQs)', icon: 'quiz', badge: null },
    {
      id: 'notices',
      label: 'Notices',
      icon: 'campaign',
      badge: noticesCount > 0 ? `${noticesCount}` : '2',
    },
  ];

  return (
    <aside className="eb-editorial-sidebar">
      {/* Top Brand Logo */}
      <div
        className="eb-sidebar-brand"
        onClick={() => setActiveTab('dashboard')}
        title="Go to Dashboard"
      >
        <div className="eb-brand-icon-circle">
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            menu_book
          </span>
        </div>
        <span className="eb-brand-text">ExamBuddy</span>
      </div>

      {/* Main Navigation Links */}
      <nav className="eb-sidebar-nav-list">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`eb-editorial-nav-btn ${isActive ? 'active' : ''}`}
            >
              <div className="eb-nav-btn-inner">
                <span className="material-symbols-outlined eb-nav-icon">
                  {item.icon}
                </span>
                <span className="eb-nav-label">{item.label}</span>
              </div>

              {item.badge && (
                <span className="eb-nav-amber-badge">{item.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Spacer pushing bottom items down */}
      <div className="eb-sidebar-spacer" />

      {/* Bottom Actions: Settings & Logout */}
      <div className="eb-sidebar-bottom-actions">
        <button
          type="button"
          onClick={() => {
            setActiveTab('settings');
            if (onOpenSettings) onOpenSettings();
          }}
          className={`eb-editorial-nav-btn eb-sidebar-action-btn ${activeTab === 'settings' ? 'active' : ''}`}
          title="Profile & Settings"
        >
          <div className="eb-nav-btn-inner">
            <span className="material-symbols-outlined eb-nav-icon">settings</span>
            <span className="eb-nav-label">Settings</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onLogout && onLogout()}
          className="eb-editorial-nav-btn eb-sidebar-action-btn eb-sidebar-logout-btn"
          title="Sign Out"
        >
          <div className="eb-nav-btn-inner">
            <span className="material-symbols-outlined eb-nav-icon">logout</span>
            <span className="eb-nav-label">Logout</span>
          </div>
        </button>
      </div>

      {/* Botanical Leaves Watermark Art in Bottom Corner */}
      <div className="eb-sidebar-leaf-art">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="leafGrad1" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e3a2b" stopOpacity="0.75" />
              <stop offset="60%" stopColor="#2d553e" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#417354" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient id="leafGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#284232" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#4e8262" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="leafGrad3" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#183022" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#355e44" stopOpacity="0.5" />
            </linearGradient>
          </defs>

          {/* Stems */}
          <path d="M-10 200 Q 50 150 100 80" stroke="#223f2f" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
          <path d="M10 200 Q 75 165 135 115" stroke="#284232" strokeWidth="2" strokeLinecap="round" opacity="0.45" />

          {/* Primary Leaf */}
          <path d="M15 180 C 28 135, 65 110, 115 80 C 110 115, 80 150, 42 178 Z" fill="url(#leafGrad1)" />

          {/* Secondary Leaf spreading right */}
          <path d="M48 160 C 72 128, 115 105, 160 98 C 145 125, 110 155, 68 164 Z" fill="url(#leafGrad2)" />

          {/* Bottom overlapping leaves */}
          <path d="M-5 195 C 10 165, 38 150, 75 142 C 62 168, 35 188, 8 196 Z" fill="url(#leafGrad3)" />
        </svg>
      </div>
    </aside>
  );
};
