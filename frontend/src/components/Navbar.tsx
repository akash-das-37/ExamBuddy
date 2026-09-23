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
    <header className="glass-nav sticky top-0 z-50 px-6 py-3 flex justify-between items-center w-full">
      {/* Brand & AI Badge */}
      <div className="flex items-center gap-6">
        <div
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-[#171f33] border border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.35)] group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-indigo-400 text-[20px]">
              school
            </span>
            <span className="pulse-dot absolute -top-1 -right-1" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white">
                ExamBuddy
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-indigo-950/70 text-indigo-300 border border-indigo-500/30">
                AI Exam Copilot
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Center Nav Tabs */}
      <nav className="hidden md:flex items-center gap-2 lg:gap-4">
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-[0_0_10px_rgba(99,102,241,0.25)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
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
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-[#070a13] border border-slate-700/60 text-xs">
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
          className="btn-secondary text-xs py-1.5 px-2.5 hidden sm:inline-flex"
          title="Scrape and extract latest syllabus, PYQs, and notices"
        >
          <span
            className={`material-symbols-outlined text-[15px] ${
              isScraping ? 'animate-spin' : ''
            }`}
          >
            sync
          </span>
          <span>{isScraping ? 'Syncing...' : 'Crawl Portal'}</span>
        </button>

        {/* Student Avatar & Logout */}
        {student && (
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-700/60">
            <div className="w-8 h-8 rounded-full bg-indigo-950/80 border border-indigo-500/50 flex items-center justify-center text-xs font-bold text-indigo-300 shadow-sm">
              {getInitials(student.name)}
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-200 leading-tight">
                {student.name}
              </span>
              <span className="text-[10px] font-mono text-slate-400 leading-tight">
                {student.branch} • Sem {student.semester}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-colors ml-1"
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
