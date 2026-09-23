import React, { useState } from 'react';
import { api } from '../api/client';
import type { Student } from '../types';

interface AuthPageProps {
  onAuthSuccess: (student: Student) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [modalOpen, setModalOpen] = useState(false);
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

  const openAuthModal = (tab: 'signin' | 'register') => {
    setActiveTab(tab);
    setError(null);
    setModalOpen(true);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.login(signInEmail, signInPassword);
      const student = await api.getMe();
      setModalOpen(false);
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

      // Automatically log in after registration
      await api.login(email, password);
      setModalOpen(false);
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
    <div className="min-h-screen w-full flex flex-col justify-between relative selection:bg-purple-600 selection:text-white">
      {/* Top Navigation Bar matching reference image */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.5)]">
            <span className="material-symbols-outlined text-white text-[24px]">
              psychology
            </span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
            ExamMind <span className="text-purple-400">AI</span>
          </span>
        </div>

        {/* Right: Nav Links + Get Started Button */}
        <div className="flex items-center gap-6 sm:gap-8">
          <a
            href="#features"
            className="hidden sm:inline-block text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Features
          </a>
          <a
            href="#about"
            className="hidden sm:inline-block text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            About
          </a>
          <button
            onClick={() => openAuthModal('signin')}
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Login
          </button>
          <button
            onClick={() => openAuthModal('register')}
            className="btn-nav-gradient cursor-pointer"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section matching exact reference image */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-12 pb-16 max-w-5xl mx-auto space-y-7 z-10">
        {/* Floating Top Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#161426] border border-purple-500/40 text-purple-300 text-xs sm:text-sm font-medium shadow-[0_0_20px_rgba(168,85,247,0.2)]">
          <span className="text-purple-400">✦</span>
          <span>AI-Powered Study Planning</span>
        </div>

        {/* Massive Headline */}
        <h1 className="hero-title max-w-4xl">
          Stop Guessing What to <br />
          <span className="hero-gradient">Study for Exams.</span>
        </h1>

        {/* Subtitle */}
        <p className="hero-subtitle">
          Let AI analyze your syllabus and past papers to tell you what actually matters.
          <br className="hidden sm:inline" />
          Personalized study plans generated in seconds.
        </p>

        {/* Giant Gradient Pill CTA Button */}
        <div className="pt-3">
          <button
            onClick={() => openAuthModal('register')}
            className="btn-gradient-pill text-base sm:text-lg cursor-pointer"
          >
            <span>Start Planning Now</span>
            <span className="text-xl">➔</span>
          </button>
        </div>
      </main>

      {/* Bottom 3 Feature Cards matching reference image */}
      <section id="features" className="w-full max-w-6xl mx-auto px-6 pb-12 z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Secure Data */}
          <div className="feature-card flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-center text-purple-400 mb-4">
                <span className="material-symbols-outlined text-[22px]">
                  security
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Secure Data</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connects directly to your university portal and question archives with encrypted token authentication and zero leaks.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-purple-400">
              100% Portal Sync
            </div>
          </div>

          {/* Card 2: Smart Priority */}
          <div className="feature-card flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-center text-purple-400 mb-4">
                <span className="material-symbols-outlined text-[22px]">
                  psychology
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Smart Priority</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Mathematical recency-decay formula scores historical question frequencies to predict must-master topics.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-cyan-400">
              88–95% Weight Coverage
            </div>
          </div>

          {/* Card 3: Fast Execution */}
          <div className="feature-card flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-center text-purple-400 mb-4">
                <span className="material-symbols-outlined text-[22px]">
                  rocket_launch
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Fast Execution</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generates actionable 3-tier study plans in seconds and emails alerts for rescheduled datesheets and circulars.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-emerald-400">
              Real-time Feeds
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Auth Modal (Sign In / Register) */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header & Close Button */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[18px]">school</span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  {activeTab === 'register' ? 'Create Student Account' : 'Welcome Back'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-[#070910] p-1 rounded-xl mb-6 border border-slate-800">
              <button
                type="button"
                onClick={() => { setActiveTab('register'); setError(null); }}
                className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'register'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Register as Student
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('signin'); setError(null); }}
                className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'signin'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
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
                  className="btn-primary w-full py-3 mt-3 text-sm justify-center cursor-pointer"
                >
                  {loading ? 'Authenticating...' : 'Sign In to ExamMind ➔'}
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
                      placeholder="Min 6 characters"
                      className="form-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">College Website URL</label>
                  <input
                    type="url"
                    required
                    value={collegeUrl}
                    onChange={(e) => setCollegeUrl(e.target.value)}
                    placeholder="https://apex-tech.edu"
                    className="form-input"
                  />
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
                        className={`py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                          semester === s
                            ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.6)] border border-purple-400'
                            : 'bg-[#141724] text-slate-400 border border-slate-800 hover:border-slate-700'
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
                    id="notifyToggleModal"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 bg-slate-900 border-slate-700 focus:ring-purple-500"
                  />
                  <label htmlFor="notifyToggleModal" className="text-xs text-slate-300 cursor-pointer">
                    Email me when new notices or rescheduled exam circulars appear
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 mt-3 text-sm justify-center cursor-pointer"
                >
                  {loading ? 'Crawling Portal & Creating Plan...' : 'Start AI Exam Prep ➔'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
