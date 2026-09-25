import React, { useState } from 'react';
import type { College, Student } from '../types';
import { EditProfileModal } from './EditProfileModal';

interface NavbarProps {
  setActiveTab: (tab: string) => void;
  student: Student | null;
  college: College | null;
  onLogout: () => void;
  onTriggerScrape: () => void;
  isScraping: boolean;
  onUpdateStudent?: (updated: Partial<Student>) => Promise<void>;
}

export const Navbar: React.FC<NavbarProps> = ({
  setActiveTab,
  student,
  college,
  onLogout,
  onTriggerScrape,
  isScraping,
  onUpdateStudent,
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="header-glass sticky top-0 z-50 px-6 py-3.5 flex justify-between items-center w-full">
      {/* Brand & AI Badge */}
      <div className="flex items-center gap-6">
        <div
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-cyan-500 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)] group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-white text-[22px]">
              school
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-white">
                ExamBuddy
              </span>
              <span className="badge badge-indigo">
                AI Copilot
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Portal Status & Student Profile */}
      <div className="flex items-center gap-3">
        {/* Scrape Status Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0d101c] border border-white/10 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              isScraping
                ? 'bg-amber-400 animate-ping'
                : college?.scrape_status === 'completed'
                ? 'bg-emerald-400'
                : 'bg-indigo-400'
            }`}
          />
          <span className="font-mono text-slate-300">
            {isScraping
              ? 'Crawling portal...'
              : college?.scrape_status === 'completed'
              ? 'Portal Synced'
              : 'Portal Ready'}
          </span>
        </div>

        {/* Trigger Portal Scrape Button */}
        <button
          onClick={onTriggerScrape}
          disabled={isScraping}
          className="btn-outline text-xs py-1.5 px-3.5 hidden sm:inline-flex cursor-pointer"
          title="Scrape and extract latest syllabus, PYQs, and notices"
        >
          <span
            className={`material-symbols-outlined text-[16px] ${
              isScraping ? 'animate-spin text-amber-400' : 'text-indigo-400'
            }`}
          >
            sync
          </span>
          <span>{isScraping ? 'Syncing...' : 'Crawl Portal'}</span>
        </button>

        {/* Student Profile Card (Clickable to Edit) & Logout */}
        {student && (
          <div className="flex items-center gap-2 pl-3 border-l border-white/10">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="nav-profile-chip group"
              title="Click to edit profile, branch & semester"
            >
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm ring-1 ring-white/20 group-hover:scale-105 transition-transform">
                  {getInitials(student.name)}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-indigo-600 border border-[#0d101c] flex items-center justify-center text-white shadow-sm">
                  <span className="material-symbols-outlined text-[9px]">edit</span>
                </div>
              </div>
              <div className="flex flex-col text-left min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white leading-tight group-hover:text-indigo-300 transition-colors truncate max-w-[120px]">
                    {student.name}
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[9px] font-bold border border-emerald-500/30">
                    Sem {student.semester}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-slate-300 leading-tight truncate max-w-[160px]">
                  {student.branch}
                </span>
              </div>
            </button>
            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-colors ml-1 cursor-pointer"
              title="Sign Out"
            >
              <span className="material-symbols-outlined text-[18px]">
                logout
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {student && onUpdateStudent && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          student={student}
          onSave={onUpdateStudent}
        />
      )}
    </header>
  );
};
