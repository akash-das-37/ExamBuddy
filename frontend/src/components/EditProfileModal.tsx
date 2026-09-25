import React, { useState } from 'react';
import type { Student } from '../types';
import { aiCollegeScraper, deriveCollegeNameFromUrl, cleanCollegeUrl } from '../services/aiCollegeScraper';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  onSave: (updated: Partial<Student>) => Promise<void>;
  onScrapeComplete?: () => void;
}

const COMMON_BRANCHES = [
  'CSE',
  'IT',
  'ECE',
  'EE',
  'ME',
  'CE',
  'AI & ML',
  'Data Science',
  'CST',
  'Other',
];

const COMMON_COURSES = ['B.Tech', 'BCA', 'MCA', 'M.Tech', 'B.Sc'];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  student,
  onSave,
  onScrapeComplete,
}) => {
  const [name, setName] = useState(student.name);
  const [course, setCourse] = useState(student.course || 'B.Tech');
  const [branch, setBranch] = useState(
    COMMON_BRANCHES.includes(student.branch) ? student.branch : 'Other'
  );
  const [customBranch, setCustomBranch] = useState(
    COMMON_BRANCHES.includes(student.branch) ? '' : student.branch
  );
  const [semester, setSemester] = useState<number>(student.semester || 3);
  
  // College fields
  const [collegeUrl, setCollegeUrl] = useState<string>(() => {
    return (
      student.college_url ||
      localStorage.getItem('exambuddy_college_url') ||
      ''
    );
  });
  const [collegeName, setCollegeName] = useState<string>(() => {
    if (student.college_name && !student.college_name.toLowerCase().startsWith('http')) {
      return student.college_name;
    }
    const url = student.college_url || localStorage.getItem('exambuddy_college_url');
    if (url) {
      return deriveCollegeNameFromUrl(url);
    }
    return localStorage.getItem('exambuddy_college_name') || '';
  });
  const [scrapeOnSave, setScrapeOnSave] = useState(true);
  const [scrapeProgress, setScrapeProgress] = useState<string | null>(null);

  const [emailNotifications, setEmailNotifications] = useState(
    student.email_notifications_enabled ?? true
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const getInitials = (n: string) => {
    return (n || 'S')
      .trim()
      .split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleUrlBlur = () => {
    if (collegeUrl.trim() && (!collegeName || collegeName === 'Autonomous Engineering College')) {
      const derived = deriveCollegeNameFromUrl(collegeUrl.trim());
      setCollegeName(derived);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide your full name.');
      return;
    }

    const effectiveBranch =
      branch === 'Other' ? (customBranch.trim() || 'Other') : branch;
    const finalCollegeUrl = cleanCollegeUrl(collegeUrl.trim());
    const finalCollegeName = collegeName.trim() || (finalCollegeUrl ? deriveCollegeNameFromUrl(finalCollegeUrl) : '');

    setError(null);
    setIsSubmitting(true);
    setScrapeProgress(null);

    try {
      if (scrapeOnSave && finalCollegeUrl) {
        setScrapeProgress(`Connecting to ${finalCollegeName || finalCollegeUrl}...`);
        await aiCollegeScraper.scrapeAndSyncCollege({
          collegeUrl: finalCollegeUrl,
          collegeName: finalCollegeName,
          course: course.trim(),
          branch: effectiveBranch,
          semester,
          onProgress: (msg) => setScrapeProgress(msg),
        });
        onScrapeComplete?.();
      }

      await onSave({
        name: name.trim(),
        course: course.trim(),
        branch: effectiveBranch,
        semester,
        college_url: finalCollegeUrl,
        college_name: finalCollegeName,
        email_notifications_enabled: emailNotifications,
      });

      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="relative w-full max-w-lg bg-[#0d121f] border border-white/15 rounded-2xl shadow-2xl shadow-indigo-950/50 overflow-hidden text-slate-100 animate-scale-in">
        {/* Glow Header Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400" />

        <div className="p-6 sm:p-7 space-y-6">
          {/* Header & Avatar Preview */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3.5">
              <div className="relative group">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 flex items-center justify-center text-lg font-black text-white shadow-lg shadow-indigo-500/25 ring-2 ring-white/15">
                  {getInitials(name)}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-indigo-500 border-2 border-[#0d121f] flex items-center justify-center text-[10px] text-white">
                  <span className="material-symbols-outlined text-[12px]">edit</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  Edit Student Profile
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Update your identity, department, and semester
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {error && (
            <div className="px-3.5 py-2.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-500 text-[18px]">
                  person
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Akash Das"
                  required
                  className="w-full bg-[#080b13] border border-white/15 rounded-xl pl-9.5 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                />
              </div>
            </div>

            {/* Email (Read only with verified badge) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Registered Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-500 text-[18px]">
                  mail
                </span>
                <input
                  type="email"
                  value={student.email}
                  disabled
                  className="w-full bg-[#080b13]/60 border border-white/5 rounded-xl pl-9.5 pr-24 py-2 text-sm text-slate-400 cursor-not-allowed font-mono"
                />
                <span className="absolute right-3 top-2.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">verified</span>
                  Verified
                </span>
              </div>
            </div>

            {/* College & University Portal */}
            <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">account_balance</span>
                  College & Academic Portal
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[11px]">cloud_sync</span>
                  Supabase DB Sync
                </span>
              </div>

              {/* College Name */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  College / University Name
                </label>
                <input
                  type="text"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  placeholder="e.g. Guru Nanak Institute of Technology (GNIT)"
                  style={{ backgroundColor: '#090d19', color: '#ffffff' }}
                  className="w-full !bg-[#090d19] !text-white border border-white/20 rounded-xl px-3 py-2 text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-400 transition-all font-medium"
                />
              </div>

              {/* College Website URL */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  College Website / LMS Portal URL
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-500 text-[16px]">
                    language
                  </span>
                  <input
                    type="url"
                    value={collegeUrl}
                    onChange={(e) => setCollegeUrl(e.target.value)}
                    onBlur={handleUrlBlur}
                    placeholder="e.g. gnit.ac.in or https://heritageit.edu"
                    style={{ backgroundColor: '#090d19', color: '#ffffff' }}
                    className="w-full !bg-[#090d19] !text-white border border-white/20 rounded-xl pl-8.5 pr-3 py-2 text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-400 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Scrape on Save Toggle */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={scrapeOnSave}
                  onChange={(e) => setScrapeOnSave(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-indigo-600 bg-slate-800 border-white/20 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-[11px] text-slate-300 font-medium">
                  AI Web Scrape this portal for syllabus & sync to Supabase database
                </span>
              </label>
            </div>

            {/* Course & Branch Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Course */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Degree / Course
                </label>
                <select
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="w-full bg-[#080b13] border border-white/15 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer font-medium"
                >
                  {COMMON_COURSES.map((c) => (
                    <option key={c} value={c} className="bg-[#0d121f]">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Branch / Department
                </label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full bg-[#080b13] border border-white/15 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer font-medium"
                >
                  {COMMON_BRANCHES.map((b) => (
                    <option key={b} value={b} className="bg-[#0d121f]">
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom Branch if 'Other' */}
            {branch === 'Other' && (
              <div className="animate-fade-in">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Specify Branch Name
                </label>
                <input
                  type="text"
                  value={customBranch}
                  onChange={(e) => setCustomBranch(e.target.value)}
                  placeholder="e.g. Robotics & Automation"
                  className="w-full bg-[#080b13] border border-white/15 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            )}

            {/* Semester Selector Pills */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Current Semester
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <button
                    key={sem}
                    type="button"
                    onClick={() => setSemester(sem)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      semester === sem
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                        : 'bg-[#080b13] text-slate-400 border-white/10 hover:border-white/25 hover:text-slate-200'
                    }`}
                  >
                    Sem {sem}
                  </button>
                ))}
              </div>
            </div>

            {/* Email Notifications Toggle */}
            <div className="pt-2">
              <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#080b13] border border-white/10 cursor-pointer hover:border-white/20 transition-all">
                <div className="space-y-0.5 pr-2">
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-indigo-400 text-[16px]">
                      notifications_active
                    </span>
                    Exam & Routine Alerts
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Get email alerts when new exam notices or revised syllabus changes drop.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-white/20 focus:ring-indigo-500 cursor-pointer"
                />
              </label>
            </div>

            {/* AI Scrape Progress */}
            {scrapeProgress && (
              <div className="px-3.5 py-2.5 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-200 text-xs flex items-center gap-2.5 animate-pulse font-mono">
                <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
                <span className="leading-snug">{scrapeProgress}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary text-xs py-2 px-5 font-semibold flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">check</span>
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
