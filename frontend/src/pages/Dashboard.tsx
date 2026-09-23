import React from 'react';
import type { College, Notice, Student } from '../types';

interface DashboardProps {
  student: Student;
  college: College | null;
  notices: Notice[];
  totalTopics: number;
  totalPYQs: number;
  onNavigateTab: (tab: string) => void;
  onTriggerScrape: () => void;
  onToggleNotifications: (enabled: boolean) => void;
  isScraping: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  student,
  college,
  notices,
  totalTopics,
  totalPYQs,
  onNavigateTab,
  onTriggerScrape,
  onToggleNotifications,
  isScraping,
}) => {
  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto">
      {/* Top Welcome / Portal Banner */}
      <div className="glass-card p-6 border-l-4 border-l-indigo-500 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-indigo">AI Academic Radar</span>
            <span className="text-xs font-mono text-slate-400">
              Target: Sem {student.semester} Exam Readiness
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Welcome back, {student.name}
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            Enrolled at <span className="text-indigo-400 font-semibold">{college?.name || college?.base_url || 'Your College'}</span> for{' '}
            <span className="text-slate-200 font-medium">{student.course} ({student.branch})</span>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('study-report')}
            className="btn-primary text-sm py-2 px-4"
          >
            <span className="material-symbols-outlined text-[18px]">analytics</span>
            View Study Report
          </button>
          <button
            onClick={onTriggerScrape}
            disabled={isScraping}
            className="btn-secondary text-sm py-2 px-3"
          >
            <span
              className={`material-symbols-outlined text-[17px] ${
                isScraping ? 'animate-spin' : ''
              }`}
            >
              sync
            </span>
            {isScraping ? 'Crawling...' : 'Crawl Portal'}
          </button>
        </div>
      </div>

      {/* Top 4 Metrics Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Topics Analyzed */}
        <div
          onClick={() => onNavigateTab('study-report')}
          className="glass-card p-4 flex items-center justify-between cursor-pointer group"
        >
          <div>
            <span className="form-label text-[11px] mb-1">Curriculum Topics</span>
            <div className="text-2xl font-bold font-mono text-white">
              {totalTopics > 0 ? totalTopics : '28'} topics
            </div>
            <span className="text-xs text-emerald-400 flex items-center gap-1 mt-1 font-mono">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              Recency Weighted
            </span>
          </div>
          <div className="w-11 h-11 rounded-lg bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[24px]">auto_stories</span>
          </div>
        </div>

        {/* Stat 2: Historical PYQs Indexed */}
        <div
          onClick={() => onNavigateTab('syllabus-pyq')}
          className="glass-card p-4 flex items-center justify-between cursor-pointer group"
        >
          <div>
            <span className="form-label text-[11px] mb-1">PYQ Questions Bank</span>
            <div className="text-2xl font-bold font-mono text-white">
              {totalPYQs > 0 ? totalPYQs : '85'} questions
            </div>
            <span className="text-xs text-indigo-400 flex items-center gap-1 mt-1 font-mono">
              <span className="material-symbols-outlined text-[14px]">history_edu</span>
              Multi-Year Papers
            </span>
          </div>
          <div className="w-11 h-11 rounded-lg bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[24px]">quiz</span>
          </div>
        </div>

        {/* Stat 3: Relevant College Notices */}
        <div
          onClick={() => onNavigateTab('notices')}
          className="glass-card p-4 flex items-center justify-between cursor-pointer group"
        >
          <div>
            <span className="form-label text-[11px] mb-1">Targeted Notices</span>
            <div className="text-2xl font-bold font-mono text-white">
              {notices.length} alerts
            </div>
            <span className="text-xs text-amber-400 flex items-center gap-1 mt-1 font-mono">
              <span className="material-symbols-outlined text-[14px]">campaign</span>
              Filtered for Sem {student.semester}
            </span>
          </div>
          <div className="w-11 h-11 rounded-lg bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[24px]">notifications_active</span>
          </div>
        </div>

        {/* Stat 4: Email Alerts Toggle */}
        <div className="glass-card p-4 flex items-center justify-between">
          <div>
            <span className="form-label text-[11px] mb-1">Notice Email Alerts</span>
            <div className="text-sm font-semibold text-white">
              {student.email_notifications_enabled ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Active
                </span>
              ) : (
                <span className="text-slate-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                  Disabled
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Direct to {student.email}
            </span>
          </div>
          <div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={student.email_notifications_enabled}
                onChange={(e) => onToggleNotifications(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
            </label>
          </div>
        </div>
      </section>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Quick Exam Prep Navigator */}
        <div className="lg:col-span-8 space-y-4">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-400 text-[20px]">
                    model_training
                  </span>
                  AI 3-Tier Exam Preparation System
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Compound ranking combines question frequency, marks weighting, and recency decay.
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('study-report')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1"
              >
                Full Report ➔
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Tier 1 Preview Card */}
              <div className="glass-card-tier1 p-4 text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="badge badge-emerald">Tier 1</span>
                  <span className="text-[11px] font-mono text-emerald-400">Score &ge; 65</span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Must Master</h4>
                <p className="text-xs text-slate-300">
                  Accounts for ~70% of exam question weight. Recurring long-form questions, algorithms, and proofs.
                </p>
              </div>

              {/* Tier 2 Preview Card */}
              <div className="glass-card-tier2 p-4 text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="badge badge-amber">Tier 2</span>
                  <span className="text-[11px] font-mono text-amber-400">Score 35–64</span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Core Coverage</h4>
                <p className="text-xs text-slate-300">
                  Standard curriculum topics regularly appearing in medium-mark questions.
                </p>
              </div>

              {/* Tier 3 Preview Card */}
              <div className="glass-card-tier3 p-4 text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="badge badge-slate">Tier 3</span>
                  <span className="text-[11px] font-mono text-slate-400">Score &lt; 35</span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Quick Review</h4>
                <p className="text-xs text-slate-400">
                  Concept check topics for last-minute revision and short definition notes.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Ready to review topic-by-topic breakdowns with past questions?
              </span>
              <button
                onClick={() => onNavigateTab('study-report')}
                className="btn-primary text-xs py-1.5 px-3"
              >
                Open Subject Report
              </button>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Live Official College Feed Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-amber-400 text-[18px]">
                  feed
                </span>
                Official College Feed
              </h3>
              <span className="badge badge-amber">Sem {student.semester}</span>
            </div>

            {notices.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                No new notices scraped yet. Click &quot;Crawl Portal&quot; to fetch latest circulars.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {notices.slice(0, 4).map((notice) => (
                  <div
                    key={notice.id}
                    className="p-3 rounded-lg bg-[#070a13] border border-slate-800/80 hover:border-slate-700 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-indigo-400">
                        {new Date(notice.detected_at).toLocaleDateString()}
                      </span>
                      {notice.target_semesters && notice.target_semesters.length > 0 && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-600/30">
                          Sem {notice.target_semesters.join(', ')}
                        </span>
                      )}
                    </div>
                    <h5 className="text-xs font-semibold text-slate-200 line-clamp-2">
                      {notice.title}
                    </h5>
                    {notice.content && (
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {notice.content}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => onNavigateTab('notices')}
              className="w-full mt-3 py-2 text-center text-xs text-indigo-400 hover:text-indigo-300 font-medium block border-t border-slate-800"
            >
              View All Notices & Alert History ➔
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
