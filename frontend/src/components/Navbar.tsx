import React from 'react';
import type { College, Student } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  student: Student | null;
  college: College | null;
  onLogout: () => void;
  onTriggerScrape: () => void;
  isScraping: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  student,
  college,
  onLogout,
  onTriggerScrape,
  isScraping,
}) => {
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

      {/* Center Nav Tabs */}
      <nav className="hidden md:flex items-center bg-[#0d101c] p-1 rounded-2xl border border-white/5">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
          { id: 'study-report', label: 'Study Report', icon: 'analytics' },
          { id: 'syllabus-pyq', label: 'Syllabus & PYQs', icon: 'menu_book' },
          { id: 'notices', label: 'Notices', icon: 'campaign' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">
                {tab.icon}
              </span>
              {tab.label}
            </button>
          );
        })}
      </nav>

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

        {/* Student Avatar & Logout */}
        {student && (
          <div className="flex items-center gap-3 pl-3 border-l border-white/10">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
              {getInitials(student.name)}
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-semibold text-white leading-tight">
                {student.name}
              </span>
              <span className="text-[10px] font-mono text-slate-400 leading-tight">
                {student.branch} • Sem {student.semester}
              </span>
            </div>
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
    </header>
  );
};
