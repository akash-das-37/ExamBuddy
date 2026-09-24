import React, { useState } from 'react';
import { api } from '../api/client';
import { isSupabaseConfigured, supabaseAuth } from '../lib/supabase';
import type { Student } from '../types';

interface LoginPageProps {
  onNavigateToHome: () => void;
  onAuthSuccess: (student: Student) => void;
  initialTab?: 'signin' | 'register';
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigateToHome,
  onAuthSuccess,
  initialTab = 'signin',
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>(initialTab);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sign In fields
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Register fields
  const [name, setName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [collegeUrl, setCollegeUrl] = useState('');
  const [course, setCourse] = useState('B.Tech');
  const [branch, setBranch] = useState('CSE');
  const [customBranch, setCustomBranch] = useState('');
  const [semester, setSemester] = useState<number>(6);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // 1. Authenticate with Supabase Auth for authentic users
      if (isSupabaseConfigured) {
        const { error: supaError } = await supabaseAuth.signIn(signInEmail, signInPassword);
        if (supaError) {
          throw new Error(supaError.message);
        }
      }

      // 2. Obtain session token from ExamBuddy backend
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

    if (registerPassword !== registerConfirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }
    if (registerPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    const effectiveBranch = branch === 'Other' ? (customBranch.trim() || 'Other') : branch;
    try {
      // 1. Register user authentic record in Supabase Auth
      if (isSupabaseConfigured) {
        const { error: supaError } = await supabaseAuth.signUp({
          email: registerEmail.trim(),
          password: registerPassword,
          name: name.trim() || 'Student',
          college_url: collegeUrl.trim() || 'https://www.jiscollege.ac.in/',
          course,
          branch: effectiveBranch,
          semester,
        });

        if (supaError) {
          throw new Error(supaError.message);
        }
      }

      // 2. Initialize student profile in ExamBuddy backend
      await api.register({
        name: name.trim() || 'Student',
        email: registerEmail.trim(),
        password: registerPassword,
        college_url: collegeUrl.trim() || 'https://www.jiscollege.ac.in/',
        course,
        branch: effectiveBranch,
        semester,
        email_notifications_enabled: emailNotifications,
      });

      // 3. Get authenticated student profile
      const student = await api.getMe();
      onAuthSuccess(student);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Registration failed. Please verify your details.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ex-page-wrapper">
      {/* Ambient background glows matching Stitch design */}
      <div className="ex-glow-center" />
      <div className="ex-glow-cyan" />

      {/* Minimalist Top Navigation */}
      <header className="ex-header">
        {/* Brand Logo: ExamBuddy */}
        <div onClick={onNavigateToHome} className="ex-brand">
          <div className="ex-brand-logo">
            <span className="material-symbols-outlined">school</span>
          </div>
          <span className="ex-brand-name">ExamBuddy</span>
        </div>

        {/* Top Action Links */}
        <div className="ex-nav-actions">
          <button
            type="button"
            onClick={onNavigateToHome}
            className="ex-nav-link"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              arrow_back
            </span>
            <span>Back to Home</span>
          </button>
        </div>
      </header>

      {/* Main Canvas: Centered High-Precision Glassmorphic Auth Card */}
      <main className="ex-auth-container">
        <div className="ex-auth-card">
          {/* Top Refined Highlight Line */}
          <div className="ex-auth-top-highlight" />

          {/* Header Titles */}
          <div className="ex-auth-heading">
            {isSupabaseConfigured && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  color: '#6ee7b7',
                  marginBottom: '10px',
                  fontWeight: 500,
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                <span>Supabase Cloud Auth Active</span>
              </div>
            )}
            <h1 className="ex-auth-title">
              {activeTab === 'signin' ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="ex-auth-desc">
              {activeTab === 'signin'
                ? 'Sign in to access your personalized exam prep plan and predictive PYQ analytics.'
                : 'Start your college-tailored exam intelligence copilot in seconds.'}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(225, 29, 72, 0.15)',
                border: '1px solid rgba(225, 29, 72, 0.4)',
                borderRadius: '12px',
                color: '#fca5a5',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                error
              </span>
              <span>{error}</span>
            </div>
          )}

          {/* Sign In Form */}
          {activeTab === 'signin' ? (
            <form onSubmit={handleSignIn} className="ex-form">
              {/* Email */}
              <div>
                <div className="ex-input-label-row">
                  <label className="ex-label" htmlFor="email">
                    Email
                  </label>
                </div>
                <div className="ex-input-box">
                  <span className="material-symbols-outlined">mail</span>
                  <input
                    id="email"
                    type="email"
                    required
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="akashdas200x@gmail.com"
                    className="ex-input-field"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="ex-input-label-row">
                  <label className="ex-label" htmlFor="user-password">
                    Password
                  </label>
                  <span className="ex-link">Forgot password?</span>
                </div>
                <div className="ex-input-box">
                  <span className="material-symbols-outlined">lock</span>
                  <input
                    id="user-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="ex-input-field"
                  />
                  <button
                    type="button"
                    aria-label="Toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    className="ex-password-toggle"
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="ex-auth-row-between">
                <label className="ex-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me for 30 days</span>
                </label>
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: '#64748b',
                  }}
                >
                  ↵ Enter
                </span>
              </div>

              {/* Primary Submit CTA */}
              <button type="submit" disabled={loading} className="ex-btn-submit">
                <span>{loading ? 'Signing In...' : 'Sign In to ExamBuddy'}</span>
                <span>➔</span>
              </button>
            </form>
          ) : (
            /* Create Account Form */
            <form onSubmit={handleRegister} className="ex-form">
              {/* Full Name */}
              <div>
                <label className="ex-label" style={{ display: 'block', marginBottom: '6px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Akash Das"
                  className="ex-input-field"
                  style={{ paddingLeft: '14px' }}
                />
              </div>

              {/* Email */}
              <div>
                <label className="ex-label" style={{ display: 'block', marginBottom: '6px' }}>
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  placeholder="akashdas200x@gmail.com"
                  className="ex-input-field"
                  style={{ paddingLeft: '14px' }}
                />
              </div>

              {/* Password & Confirm Password */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="ex-label" style={{ display: 'block', marginBottom: '6px' }}>
                    Enter Password
                  </label>
                  <input
                    type="password"
                    required
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="Enter password"
                    className="ex-input-field"
                    style={{ paddingLeft: '14px' }}
                  />
                </div>
                <div>
                  <label className="ex-label" style={{ display: 'block', marginBottom: '6px' }}>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="ex-input-field"
                    style={{ paddingLeft: '14px' }}
                  />
                </div>
              </div>

              {/* College Portal URL */}
              <div>
                <label className="ex-label" style={{ display: 'block', marginBottom: '6px' }}>
                  College Portal URL
                </label>
                <input
                  type="url"
                  required
                  value={collegeUrl}
                  onChange={(e) => setCollegeUrl(e.target.value)}
                  placeholder="https://www.iitb.ac.in/"
                  className="ex-input-field"
                  style={{ paddingLeft: '14px' }}
                />
              </div>

              {/* Course */}
              <div>
                <label className="ex-label" style={{ display: 'block', marginBottom: '6px' }}>
                  Course
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    required
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="ex-input-field"
                    style={{
                      paddingLeft: '14px',
                      paddingRight: '36px',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      cursor: 'pointer',
                      backgroundColor: '#080b12',
                    }}
                  >
                    <option value="B.Tech" style={{ backgroundColor: '#0e121d', color: '#ffffff' }}>B.Tech</option>
                    <option value="BCA" style={{ backgroundColor: '#0e121d', color: '#ffffff' }}>BCA</option>
                    <option value="BBA" style={{ backgroundColor: '#0e121d', color: '#ffffff' }}>BBA</option>
                    <option value="B.Sc" style={{ backgroundColor: '#0e121d', color: '#ffffff' }}>B.Sc</option>
                    <option value="B.Com" style={{ backgroundColor: '#0e121d', color: '#ffffff' }}>B.Com</option>
                    <option value="BA" style={{ backgroundColor: '#0e121d', color: '#ffffff' }}>BA</option>
                    <option value="M.Tech" style={{ backgroundColor: '#0e121d', color: '#ffffff' }}>M.Tech</option>
                    <option value="MCA" style={{ backgroundColor: '#0e121d', color: '#ffffff' }}>MCA</option>
                    <option value="MBA" style={{ backgroundColor: '#0e121d', color: '#ffffff' }}>MBA</option>
                    <option value="MA" style={{ backgroundColor: '#0e121d', color: '#ffffff' }}>MA</option>
                    <option value="M.Sc" style={{ backgroundColor: '#0e121d', color: '#ffffff' }}>M.Sc</option>
                  </select>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                      color: '#94a3b8',
                      fontSize: '20px',
                    }}
                  >
                    expand_more
                  </span>
                </div>
              </div>

              {/* Branch & Current Semester Dropdowns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="ex-label" style={{ display: 'block', marginBottom: '6px' }}>
                    Branch
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      required
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="ex-input-field"
                      style={{
                        paddingLeft: '14px',
                        paddingRight: '36px',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                        cursor: 'pointer',
                        backgroundColor: '#080b12',
                      }}
                    >
                      <option value="CSE" style={{ backgroundColor: '#0e121d', color: '#ffffff' }}>CSE</option>
                      <option value="IT" style={{ backgroundColor: '#0e121d', color: '#ffffff' }}>IT</option>
                      <option value="AI & DS" style={{ backgroundColor: '#0e121d', color: '#ffffff' }}>AI & DS</option>
                      <option value="AIML" style={{ backgroundColor: '#0e121d', color: '#ffffff' }}>AIML</option>
                      <option value="ECE" style={{ backgroundColor: '#0e121d', color: '#ffffff' }}>ECE</option>
                      <option value="EE" style={{ backgroundColor: '#0e121d', color: '#ffffff' }}>EE</option>
                      <option value="ME" style={{ backgroundColor: '#0e121d', color: '#ffffff' }}>ME</option>
                      <option value="CE" style={{ backgroundColor: '#0e121d', color: '#ffffff' }}>CE</option>
                      <option value="Finance" style={{ backgroundColor: '#0e121d', color: '#ffffff' }}>Finance</option>
                      <option value="Marketing" style={{ backgroundColor: '#0e121d', color: '#ffffff' }}>Marketing</option>
                      <option value="General" style={{ backgroundColor: '#0e121d', color: '#ffffff' }}>General</option>
                      <option value="Other" style={{ backgroundColor: '#0e121d', color: '#ffffff' }}>Other</option>
                    </select>
                    <span
                      className="material-symbols-outlined"
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                        color: '#94a3b8',
                        fontSize: '20px',
                      }}
                    >
                      expand_more
                    </span>
                  </div>

                  {branch === 'Other' && (
                    <div style={{ marginTop: '8px' }}>
                      <input
                        type="text"
                        required
                        value={customBranch}
                        onChange={(e) => setCustomBranch(e.target.value)}
                        placeholder="Enter your branch name"
                        className="ex-input-field"
                        style={{ paddingLeft: '14px' }}
                        autoFocus
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="ex-label" style={{ display: 'block', marginBottom: '6px' }}>
                    Current Semester
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      required
                      value={semester}
                      onChange={(e) => setSemester(Number(e.target.value))}
                      className="ex-input-field"
                      style={{
                        paddingLeft: '14px',
                        paddingRight: '36px',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                        cursor: 'pointer',
                        backgroundColor: '#080b12',
                      }}
                    >
                      <option value={1} style={{ backgroundColor: '#0e121d', color: '#ffffff' }}>Semester 1</option>
                      <option value={2} style={{ backgroundColor: '#0e121d', color: '#ffffff' }}>Semester 2</option>
                      <option value={3} style={{ backgroundColor: '#0e121d', color: '#ffffff' }}>Semester 3</option>
                      <option value={4} style={{ backgroundColor: '#0e121d', color: '#ffffff' }}>Semester 4</option>
                      <option value={5} style={{ backgroundColor: '#0e121d', color: '#ffffff' }}>Semester 5</option>
                      <option value={6} style={{ backgroundColor: '#0e121d', color: '#ffffff' }}>Semester 6</option>
                      <option value={7} style={{ backgroundColor: '#0e121d', color: '#ffffff' }}>Semester 7</option>
                      <option value={8} style={{ backgroundColor: '#0e121d', color: '#ffffff' }}>Semester 8</option>
                    </select>
                    <span
                      className="material-symbols-outlined"
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                        color: '#94a3b8',
                        fontSize: '20px',
                      }}
                    >
                      expand_more
                    </span>
                  </div>
                </div>
              </div>

              <label className="ex-checkbox-label" style={{ marginTop: '4px' }}>
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                />
                <span>Email me instant alerts when exam datesheets update</span>
              </label>

              <button type="submit" disabled={loading} className="ex-btn-submit">
                <span>{loading ? 'Creating Account...' : 'Start Free AI Exam Prep'}</span>
                <span>➔</span>
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="ex-auth-divider">
            <div className="ex-auth-divider-line" />
            <span className="ex-auth-divider-text">Or continue with</span>
          </div>

          {/* SSO Dual Grid */}
          <div className="ex-sso-grid">
            <button
              type="button"
              onClick={() => setError('Google SSO will be available with campus single sign-on.')}
              className="ex-sso-btn"
            >
              <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24">
                <path
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                  fill="#EA4335"
                />
                <path
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                  fill="#4285F4"
                />
                <path
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8 0-1.3.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.8 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                  fill="#34A853"
                />
              </svg>
              <span>Google</span>
            </button>

            <button
              type="button"
              onClick={() => setError('GitHub sign in will be available soon.')}
              className="ex-sso-btn"
            >
              <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="#ffffff">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              <span>GitHub</span>
            </button>
          </div>

          {/* Student Switch Footnote */}
          <div className="ex-auth-switch-text">
            <span>{activeTab === 'signin' ? "Don't have an account? " : 'Already have an account? '}</span>
            <button
              type="button"
              onClick={() => {
                setActiveTab(activeTab === 'signin' ? 'register' : 'signin');
                setError(null);
              }}
              className="ex-link"
              style={{ fontWeight: 600, marginLeft: '4px' }}
            >
              {activeTab === 'signin' ? 'Sign up for free' : 'Sign in'}
            </button>
          </div>
        </div>
      </main>

      {/* Page Bottom Footer */}
      <footer className="ex-footer">
        <div className="ex-footer-inner">
          <div>ExamBuddy © 2025 • Designed for University Excellence</div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span style={{ cursor: 'pointer' }}>Privacy Policy</span>
            <span style={{ cursor: 'pointer' }}>Terms of Service</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#10b981',
                }}
              />
              <span>Portal Status: Online</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
