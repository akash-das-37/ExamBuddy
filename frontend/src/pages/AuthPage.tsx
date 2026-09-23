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

  // Live Demo Widget Expand state
  const [demoExpanded, setDemoExpanded] = useState(false);

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

      // Automatically log in after registration
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

  const scrollToAuth = () => {
    document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between relative">
      {/* Top Header Navigation */}
      <header className="header-glass sticky top-0 z-40 w-full px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-cyan-500 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)]">
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

          {/* Quick Header Actions */}
          <div className="flex items-center gap-4 sm:gap-6">
            <a
              href="#how-it-works"
              className="hidden sm:inline-block text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              How It Works
            </a>
            <a
              href="#demo"
              className="hidden sm:inline-block text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Preview AI Plan
            </a>
            <button
              onClick={() => { setActiveTab('signin'); scrollToAuth(); }}
              className="btn-outline text-xs sm:text-sm py-1.5 px-4 cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => { setActiveTab('register'); scrollToAuth(); }}
              className="btn-pill-primary text-xs sm:text-sm py-1.5 px-4 cursor-pointer"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 pt-16 pb-20 max-w-6xl mx-auto text-center space-y-8 z-10">
        {/* Floating Top Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-950/50 border border-indigo-500/40 text-indigo-300 text-xs sm:text-sm font-medium shadow-[0_0_20px_rgba(99,102,241,0.25)]">
          <span className="text-cyan-400">✦</span>
          <span>Autonomous College Exam Preparation Agent</span>
        </div>

        {/* High-Impact Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08] max-w-4xl mx-auto">
          Stop Guessing What to <br />
          <span className="text-gradient-purple-cyan">Study for Exams.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          ExamBuddy crawls your college website to extract your syllabus, Previous Year Questions (PYQs), and notices — then applies mathematical recency-decay scoring to tell you what actually appears on exams.
        </p>

        {/* CTA Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button
            onClick={() => { setActiveTab('register'); scrollToAuth(); }}
            className="btn-cta-gradient cursor-pointer text-base w-full sm:w-auto"
          >
            <span>Start Free Study Plan</span>
            <span className="text-lg">➔</span>
          </button>
          <a
            href="#demo"
            className="btn-outline py-3 px-6 text-sm font-semibold cursor-pointer w-full sm:w-auto"
          >
            <span className="material-symbols-outlined text-[18px] text-cyan-400">play_circle</span>
            View Interactive Preview
          </a>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-emerald-400 text-[16px]">check_circle</span>
            Auto-Scrapes College LMS & Portals
          </span>
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-indigo-400 text-[16px]">check_circle</span>
            Recency-Weighted PYQ Scoring
          </span>
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-cyan-400 text-[16px]">check_circle</span>
            Targeted Notice Email Alerts
          </span>
        </div>
      </section>

      {/* Interactive Live Demo Preview Section */}
      <section id="demo" className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 w-full z-10">
        <div className="card-elevated p-6 sm:p-8 border border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.15)] text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="badge badge-emerald">Live AI Study Report Output</span>
                <span className="text-xs font-mono text-slate-400">Computer Networks • Sem 6</span>
              </div>
              <h3 className="text-xl font-bold text-white">
                Exam Yield Analysis &amp; High-Priority Topics
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge badge-indigo">Predicted Score: 88–95/100</span>
            </div>
          </div>

          {/* AI Strategy Banner */}
          <div className="my-5 p-4 rounded-xl bg-gradient-to-r from-indigo-950/60 to-purple-950/40 border border-indigo-500/30 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[20px]">psychology</span>
            </div>
            <div className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              <strong className="text-white">AI Revision Strategy:</strong> Master the 4 High-Priority topics first — these account for ~72% of cumulative exam question weight over the last 4 years.
            </div>
          </div>

          {/* Tier 1 Interactive Card Preview */}
          <div className="card-tier1 p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center font-mono font-bold text-emerald-300 text-lg flex-shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  94
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="badge badge-emerald">Tier 1 • Must Master</span>
                    <span className="text-xs font-mono text-slate-400">Score 94.2/100</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-white mt-1">
                    Routing Algorithms (Dijkstra &amp; Distance Vector)
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Link state routing, Bellman-Ford, counting to infinity, and shortest path graph calculations.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <span className="badge badge-indigo">4 PYQ Appearances</span>
                <button
                  type="button"
                  onClick={() => setDemoExpanded(!demoExpanded)}
                  className="btn-outline text-xs py-1.5 px-3 cursor-pointer"
                >
                  <span>{demoExpanded ? 'Hide Questions' : 'Inspect Past PYQs'}</span>
                  <span className={`material-symbols-outlined text-[16px] transition-transform ${demoExpanded ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>
              </div>
            </div>

            {/* AI Reasoning Pill */}
            <div className="text-xs text-slate-300 bg-[#090c14] p-3 rounded-xl border border-slate-800 flex items-center gap-2 font-mono">
              <span className="text-emerald-400">✓ AI Analysis:</span>
              <span>Tested every single year (2024, 2023, 2022, 2019). High 15-mark numerical frequency.</span>
            </div>

            {/* Expanded Question Preview */}
            {demoExpanded && (
              <div className="pt-3 border-t border-slate-800/80 space-y-2.5 animate-fade-in">
                <div className="p-3.5 rounded-xl bg-[#080b12] border border-slate-800/90 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="badge badge-indigo">Exam Year: 2024</span>
                      <span className="badge badge-amber">15 Marks</span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400">95% Topic Confidence</span>
                  </div>
                  <p className="text-slate-200 font-serif italic leading-relaxed pt-1">
                    &quot;Explain Dijkstra&apos;s link state routing algorithm. For the given 6-node network graph, calculate the shortest path routing table from source node A to all destinations.&quot;
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Feature Value Props Cards */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 w-full z-10">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Engineered Specifically for University Students
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Traditional flashcards and generic chat prompts don&apos;t know what your specific university professor asks. ExamBuddy does.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {/* Card 1 */}
          <div className="card-base p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <span className="material-symbols-outlined text-[26px]">travel_explore</span>
            </div>
            <div>
              <span className="badge badge-indigo mb-2">Automated Crawling</span>
              <h3 className="text-lg font-bold text-white mb-1.5">College Portal Scraping</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connects directly to your college URL. Uses Playwright and PDF OCR to pull real syllabus blueprints, exam schedules, and circulars.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="card-base p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-950/60 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <span className="material-symbols-outlined text-[26px]">analytics</span>
            </div>
            <div>
              <span className="badge badge-emerald mb-2">Mathematical Scoring</span>
              <h3 className="text-lg font-bold text-white mb-1.5">Recency-Decay Algorithm</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Applies weighting: recent exam papers contribute significantly higher than older papers, factoring in 15-mark versus 2-mark question weight.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="card-base p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <span className="material-symbols-outlined text-[26px]">forward_to_inbox</span>
            </div>
            <div>
              <span className="badge badge-cyan mb-2">Real-time Radar</span>
              <h3 className="text-lg font-bold text-white mb-1.5">Notice &amp; Datesheet Alerts</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Matches college notices to your course and semester. Automatically emails you when your exam timetable is rescheduled or updated.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Student Onboarding & Sign In Form Section */}
      <section id="auth-section" className="max-w-xl mx-auto px-4 pb-24 w-full z-10">
        <div className="card-elevated p-6 sm:p-8 border border-indigo-500/30 shadow-2xl text-left">
          {/* Tab Switcher */}
          <div className="flex bg-[#080b12] p-1 rounded-xl mb-6 border border-slate-800">
            <button
              type="button"
              onClick={() => { setActiveTab('register'); setError(null); }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Student Account
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('signin'); setError(null); }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'signin'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Sign In Form */}
          {activeTab === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
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
                className="btn-cta-gradient w-full py-3.5 text-sm font-bold justify-center cursor-pointer mt-2"
              >
                {loading ? 'Authenticating...' : 'Sign In to ExamBuddy ➔'}
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
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
                    placeholder="student@college.edu"
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
                <label className="form-label">College Portal URL</label>
                <div className="relative">
                  <input
                    type="url"
                    required
                    value={collegeUrl}
                    onChange={(e) => setCollegeUrl(e.target.value)}
                    placeholder="https://apex-tech.edu"
                    className="form-input pr-9"
                  />
                  <span className="material-symbols-outlined absolute right-3 top-3 text-slate-500 text-[18px]">
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
                    placeholder="CSE, ECE, ME"
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
                      className={`py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                        semester === s
                          ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.6)] border border-indigo-400'
                          : 'bg-[#080b12] text-slate-400 border border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      Sem {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-1.5">
                <input
                  type="checkbox"
                  id="notifyConsent"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="notifyConsent" className="text-xs text-slate-300 cursor-pointer">
                  Email me instant alerts when exam datesheets or circulars update
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-cta-gradient w-full py-3.5 text-sm font-bold justify-center cursor-pointer mt-2"
              >
                {loading ? 'Crawling Portal & Generating Plan...' : 'Start Free AI Exam Prep ➔'}
              </button>
            </form>
          )}

          <div className="mt-5 pt-4 border-t border-slate-800/80 text-center text-xs font-mono text-slate-500">
            Encrypted Authentication • Zero Spam Guarantee • Built for Students
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 py-6 px-6 text-center text-xs font-mono text-slate-500 z-10">
        ExamBuddy • AI-Powered University Exam Copilot • Built for College Students
      </footer>
    </div>
  );
};
