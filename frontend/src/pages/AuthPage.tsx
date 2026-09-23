import React, { useState } from 'react';
import { api } from '../api/client';
import type { Student } from '../types';

interface AuthPageProps {
  onAuthSuccess: (student: Student) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('register');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sign In Form State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Register Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [collegeUrl, setCollegeUrl] = useState('https://apex-tech.edu');
  const [course, setCourse] = useState('B.Tech Computer Science');
  const [branch, setBranch] = useState('CSE');
  const [semester, setSemester] = useState<number>(6);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.login(signInEmail, signInPassword);
      const student = await api.getMe();
      onAuthSuccess(student);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const student = await api.register({
        name,
        email,
        password,
        college_url: collegeUrl,
        course,
        branch,
        semester,
        email_notifications_enabled: emailNotifications,
      });

      // Auto login right after signup
      await api.login(email, password);
      onAuthSuccess(student);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Registration failed. Please verify details.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Value Prop Hero */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-mono">
            <span className="pulse-dot" />
            <span>AI-Powered Autonomous Exam Prep Agent</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Ace Your University Exams with <span className="text-indigo-400">AI</span>
          </h1>

          <p className="text-slate-300 text-base leading-relaxed">
            ExamBuddy autonomously crawls your university portal, extracts your syllabus and Previous Year Questions (PYQs), predicts high-yield topics using recency-weighted algorithms, and alerts you to official schedule changes.
          </p>

          {/* Feature Highlights Cards */}
          <div className="space-y-3 pt-2">
            <div className="glass-card p-4 flex items-start gap-3.5 border-l-4 border-l-emerald-500">
              <div className="w-9 h-9 rounded-lg bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <span className="material-symbols-outlined text-[20px]">travel_explore</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-white">Auto-Crawls College Portal</h4>
                  <span className="badge badge-emerald">100% Curriculum Sync</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Indexes curriculum PDFs, question paper banks, and notice board circulars directly from your college website.
                </p>
              </div>
            </div>

            <div className="glass-card p-4 flex items-start gap-3.5 border-l-4 border-l-indigo-500">
              <div className="w-9 h-9 rounded-lg bg-indigo-950/60 border border-indigo-500/40 flex items-center justify-center text-indigo-400 flex-shrink-0">
                <span className="material-symbols-outlined text-[20px]">psychology</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-white">Recency-Weighted Importance</h4>
                  <span className="badge badge-indigo">88–95% Weight Coverage</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Applies mathematical decay and marks weighting to rank topics into 3 clear priorities (Must Master, Core, Quick Review).
                </p>
              </div>
            </div>

            <div className="glass-card p-4 flex items-start gap-3.5 border-l-4 border-l-amber-500">
              <div className="w-9 h-9 rounded-lg bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0">
                <span className="material-symbols-outlined text-[20px]">notifications_active</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-white">Targeted Circular & Date Alerts</h4>
                  <span className="badge badge-amber">Instant Delivery</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Filters official notices for your exact branch and semester, delivering instant alerts when datesheets change.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 text-xs font-mono text-slate-500 flex items-center gap-3">
            <span>🔒 Lightweight 8GB RAM Stack</span>
            <span>•</span>
            <span>⚡ Zero Celery / Pure Async</span>
          </div>
        </div>

        {/* Right Side: Auth Form Card */}
        <div className="lg:col-span-6">
          <div className="glass-card p-6 sm:p-8 relative border border-slate-700/80 shadow-2xl">
            {/* Tab Switcher */}
            <div className="flex bg-[#070a13] p-1 rounded-xl mb-6 border border-slate-800">
              <button
                type="button"
                onClick={() => { setActiveTab('register'); setError(null); }}
                className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                  activeTab === 'register'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Register as Student
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('signin'); setError(null); }}
                className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                  activeTab === 'signin'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Sign In Form */}
            {activeTab === 'signin' ? (
              <form onSubmit={handleSignIn} className="space-y-4 text-left">
                <div>
                  <label className="form-label">College Email</label>
                  <input
                    type="email"
                    required
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="student@college.edu"
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    required
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="••••••••"
                    className="form-input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-2.5 mt-2 text-sm justify-center"
                >
                  {loading ? 'Signing in...' : 'Sign In to ExamBuddy ➔'}
                </button>
              </form>
            ) : (
              /* Register Form */
              <form onSubmit={handleRegister} className="space-y-3.5 text-left">
                <div>
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Rahul Sharma"
                    className="form-input"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">College Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="rahul@college.edu"
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="form-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">College Website URL</label>
                  <div className="relative">
                    <input
                      type="url"
                      required
                      value={collegeUrl}
                      onChange={(e) => setCollegeUrl(e.target.value)}
                      placeholder="https://apex-tech.edu"
                      className="form-input"
                    />
                    <span className="material-symbols-outlined text-slate-500 absolute right-3 top-2.5 text-[18px]">
                      link
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Course / Degree</label>
                    <input
                      type="text"
                      required
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      placeholder="B.Tech Computer Science"
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">Branch</label>
                    <input
                      type="text"
                      required
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="CSE, IT, ECE"
                      className="form-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Current Semester</label>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSemester(s)}
                        className={`py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                          semester === s
                            ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)] border border-indigo-400'
                            : 'bg-[#0f172a] text-slate-400 border border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        Sem {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="notifyToggle"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-500"
                  />
                  <label htmlFor="notifyToggle" className="text-xs text-slate-300 cursor-pointer">
                    Email me when new notices or rescheduled exam circulars appear
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-2.5 mt-2 text-sm justify-center"
                >
                  {loading ? 'Creating Account & Crawling Portal...' : 'Start AI Exam Prep ➔'}
                </button>
              </form>
            )}

            <div className="mt-4 pt-3 border-t border-slate-800/80 text-center text-[11px] font-mono text-slate-500">
              Powered by Anthropic Claude AI • Playwright Web Crawler
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
