import React from 'react';
import type { College, Student } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  student: Student;
  college: College | null;
  noticesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  student,
  college,
  noticesCount,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', badge: null },
    { id: 'study-report', label: 'Study Report', icon: 'analytics', badge: null },
    { id: 'syllabus', label: 'Syllabus', icon: 'menu_book', badge: null },
    { id: 'pyqs', label: 'Question Bank (PYQs)', icon: 'quiz', badge: null },
    {
      id: 'notices',
      label: 'Notices',
      icon: 'campaign',
      badge: noticesCount > 0 ? `${noticesCount}` : null,
    },
  ];

  return (
    <aside className="eb-sidebar">
      {/* Top Navigation Section */}
      <div className="eb-sidebar-top">
        <div className="eb-sidebar-label">
          Workspace Navigation
        </div>

        <nav className="eb-sidebar-nav">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`eb-nav-btn ${isActive ? 'eb-nav-btn-active' : ''}`}
              >
                <div className="eb-nav-btn-left">
                  <span className="material-symbols-outlined">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`eb-badge-pill ${isActive ? 'eb-badge-active' : ''}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Academic Status Card */}
      <div className="eb-sidebar-bottom">
        <div className="eb-student-card">
          <div className="eb-student-card-header">
            <span className="eb-student-card-label">
              Enrolled Student
            </span>
            <span className="badge badge-emerald text-[9px] py-0.5 px-2">
              Sem {student.semester}
            </span>
          </div>

          <div className="eb-student-card-name">
            {student.name}
          </div>

          <div className="eb-student-card-sub">
            {student.branch} • {student.course}
          </div>

          <div className="eb-student-card-college">
            {college?.name || college?.base_url || 'Connected University'}
          </div>
        </div>
      </div>
    </aside>
  );
};
