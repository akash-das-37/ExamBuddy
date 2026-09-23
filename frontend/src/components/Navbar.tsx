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
    <header className="glass-nav sticky top-0 z-50 px-6 py-4 flex justify-between items-center w-full">
      {/* Brand & AI Badge matching reference image */}
      <div className="flex items-center gap-6">
        <div
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.5)] group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-white text-[20px]">
              psychology
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white">
                ExamMind <span className="text-purple-400">AI</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-purple-950/70 text-purple-300 border border-purple-500/30">
                Copilot
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Center Nav Tabs */}
      <nav className="hidden md:flex items-center gap-2 lg:gap-3">
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
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-purple-600/25 text-purple-200 border border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
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
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#11131c] border border-slate-800 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              isScraping
                ? 'bg-amber-400 animate-ping'
                : college?.scrape_status === 'completed'
                ? 'bg-emerald-400'
                : 'bg-purple-400'
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
          className="btn-secondary text-xs py-1.5 px-3 hidden sm:inline-flex cursor-pointer"
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
          <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
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
