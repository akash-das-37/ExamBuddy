import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Notice, NotificationLogItem, Student } from '../types';

interface NoticesPageProps {
  student: Student;
  notices: Notice[];
  onToggleNotifications: (enabled: boolean) => void;
}

export const NoticesPage: React.FC<NoticesPageProps> = ({
  student,
  notices,
  onToggleNotifications,
}) => {
  const [filterTargetOnly, setFilterTargetOnly] = useState(false);
  const [history, setHistory] = useState<NotificationLogItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const data = await api.getMyNotifications();
        setHistory(data);
      } catch {
        // Fallback
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, []);

  const filteredNotices = filterTargetOnly
    ? notices.filter((n) => {
        if (!n.target_semesters || n.target_semesters.length === 0) return true;
        return n.target_semesters.includes(String(student.semester));
      })
    : notices;

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto">
      {/* Header & Notification Settings Card */}
      <div className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-amber">Official Circulars &amp; Feed</span>
            <span className="text-xs font-mono text-slate-400">
              {student.branch} • Sem {student.semester}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            College Notices &amp; Exam Schedule Alerts
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            Real-time feed scraped from your university portal, filtered for your course and semester.
          </p>
        </div>

        {/* Email Notification Preference Box */}
        <div className="p-3.5 rounded-xl bg-[#070a13] border border-slate-700/80 flex items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-white block">
              Email Notifications
            </span>
            <span className="text-[11px] text-slate-400">
              Alerts sent to {student.email}
            </span>
          </div>
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

      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex bg-[#070a13] p-1 rounded-xl w-fit border border-slate-800">
          <button
            onClick={() => setFilterTargetOnly(false)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              !filterTargetOnly
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All College Notices ({notices.length})
          </button>
          <button
            onClick={() => setFilterTargetOnly(true)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filterTargetOnly
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Targeted to Sem {student.semester}
          </button>
        </div>

        <span className="text-xs font-mono text-slate-400">
          Showing {filteredNotices.length} notices
        </span>
      </div>

      {/* Notices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredNotices.length === 0 ? (
          <div className="col-span-2 glass-card p-12 text-center text-slate-400 text-sm">
            No notices match current filter. Click &quot;Crawl Portal&quot; in the header to update.
          </div>
        ) : (
          filteredNotices.map((n) => (
            <div key={n.id} className="glass-card p-5 space-y-2.5 text-left border border-slate-700/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-indigo-400">
                  {new Date(n.detected_at).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-1.5">
                  {n.target_courses && n.target_courses.length > 0 && (
                    <span className="badge badge-indigo">
                      {n.target_courses.join(', ')}
                    </span>
                  )}
                  {n.target_semesters && n.target_semesters.length > 0 && (
                    <span className="badge badge-amber">
                      Sem {n.target_semesters.join(', ')}
                    </span>
                  )}
                </div>
              </div>
              <h4 className="text-base font-semibold text-white">
                {n.title}
              </h4>
              {n.content && (
                <p className="text-xs text-slate-300 leading-relaxed">
                  {n.content}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Notification Delivery History */}
      <div className="glass-card p-5 mt-6">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-emerald-400 text-[18px]">
            mark_email_read
          </span>
          Recent Email Delivery Log for You
        </h3>

        {loadingHistory ? (
          <div className="text-xs text-slate-500 font-mono">Loading history...</div>
        ) : history.length === 0 ? (
          <p className="text-xs text-slate-400">
            No emails dispatched to {student.email} yet. When college circulars match your semester, alerts will be logged here.
          </p>
        ) : (
          <div className="space-y-2">
            {history.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg bg-[#070a13] border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-white">
                    {item.notice_title || 'Notice Alert'}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5 font-mono">
                    Dispatched on {new Date(item.sent_at).toLocaleString()}
                  </span>
                </div>
                <span className="badge badge-emerald uppercase">
                  {item.delivery_status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
