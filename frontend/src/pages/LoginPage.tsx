import React, { useState } from 'react';
import { api } from '../api/client';
import type { Student } from '../types';
import '../styles/LoginPage.css';

interface LoginPageProps {
  onNavigateToHome: () => void;
  onAuthSuccess: (student: Student) => void;
  initialTab?: 'signin' | 'register';
}

export interface CourseConfig {
  category: string;
  durationSemesters: number;
  branches: string[];
}

export const COURSE_CATALOG: Record<string, CourseConfig> = {
  'B.Tech': {
    category: 'Engineering & Technology',
    durationSemesters: 8,
    branches: [
      'CSE (Computer Science)',
      'IT (Information Technology)',
      'AI & Data Science',
      'AIML (Machine Learning)',
      'Cyber Security',
      'ECE (Electronics & Comm.)',
      'EE (Electrical Engineering)',
      'ME (Mechanical Engineering)',
      'Civil Engineering',
      'Chemical Engineering',
      'Biotechnology Engg.',
      'Aerospace Engineering',
      'Automobile Engineering',
      'Robotics & Automation',
    ],
  },
  'B.E.': {
    category: 'Engineering & Technology',
    durationSemesters: 8,
    branches: [
      'Computer Science & Engg.',
      'Information Science & Engg.',
      'Electronics & Communication',
      'Electrical & Electronics',
      'Mechanical Engineering',
      'Civil Engineering',
      'Aeronautical Engineering',
      'Industrial & Production',
    ],
  },
  'M.Tech': {
    category: 'Engineering & Technology',
    durationSemesters: 4,
    branches: [
      'Computer Science & Engg.',
      'Data Science & AI',
      'VLSI Design & Embedded Systems',
      'Power Systems & Energy',
      'Thermal & Fluid Engineering',
      'Structural Engineering',
      'Software Engineering',
      'Cyber Security',
    ],
  },
  'Diploma': {
    category: 'Engineering & Technology',
    durationSemesters: 6,
    branches: [
      'Computer Engineering',
      'Electrical Engineering',
      'Mechanical Engineering',
      'Civil Engineering',
      'Electronics & Comm.',
      'Automobile Engineering',
    ],
  },
  'BCA': {
    category: 'Computer Applications & IT',
    durationSemesters: 6,
    branches: [
      'General / Core BCA',
      'Cloud Computing & DevOps',
      'Data Science & Analytics',
      'Cyber Security & Forensics',
      'Web & App Development',
      'AI & Machine Learning',
    ],
  },
  'MCA': {
    category: 'Computer Applications & IT',
    durationSemesters: 4,
    branches: [
      'General / Advanced MCA',
      'Artificial Intelligence & ML',
      'Cloud Computing & Architecture',
      'Full Stack Software Development',
      'Data Science & Big Data',
      'Cyber Security',
    ],
  },
  'BBA': {
    category: 'Management & Commerce',
    durationSemesters: 6,
    branches: [
      'Finance & Banking',
      'Marketing Management',
      'Human Resource Management (HR)',
      'Business Analytics',
      'International Business',
      'Digital Marketing',
      'Entrepreneurship',
    ],
  },
  'MBA': {
    category: 'Management & Commerce',
    durationSemesters: 4,
    branches: [
      'Finance',
      'Marketing Management',
      'Human Resources (HR)',
      'Business Analytics & AI',
      'Operations & Supply Chain',
      'Information Technology (IT)',
      'Healthcare Management',
      'International Business',
    ],
  },
  'B.Com': {
    category: 'Management & Commerce',
    durationSemesters: 6,
    branches: [
      'General Commerce',
      'Accounting & Finance',
      'Banking & Insurance',
      'Corporate Accounting',
      'Computer Applications',
      'Taxation & Auditing',
    ],
  },
  'M.Com': {
    category: 'Management & Commerce',
    durationSemesters: 4,
    branches: [
      'Accounting & Finance',
      'Banking & Financial Services',
      'Business Taxation',
      'Financial Management',
    ],
  },
  'B.Sc': {
    category: 'Sciences',
    durationSemesters: 6,
    branches: [
      'Computer Science',
      'Information Technology',
      'Data Science',
      'Mathematics & Statistics',
      'Physics',
      'Chemistry',
      'Biotechnology',
      'Microbiology',
    ],
  },
  'M.Sc': {
    category: 'Sciences',
    durationSemesters: 4,
    branches: [
      'Computer Science',
      'Information Technology',
      'Data Analytics',
      'Physics',
      'Chemistry',
      'Applied Mathematics',
      'Biotechnology',
    ],
  },
  'B.A.': {
    category: 'Humanities & Arts',
    durationSemesters: 6,
    branches: [
      'Economics',
      'English Literature',
      'Political Science',
      'Psychology',
      'Journalism & Mass Comm',
      'History',
      'Sociology',
    ],
  },
  'M.A.': {
    category: 'Humanities & Arts',
    durationSemesters: 4,
    branches: [
      'Economics',
      'English Literature',
      'Political Science',
      'Psychology',
      'Mass Communication & Media',
    ],
  },
  'B.Pharm': {
    category: 'Pharmacy & Healthcare',
    durationSemesters: 8,
    branches: [
      'Pharmaceutical Chemistry',
      'Pharmacology',
      'Pharmaceutics',
      'Pharmacognosy',
      'Pharmacy Practice',
    ],
  },
  'M.Pharm': {
    category: 'Pharmacy & Healthcare',
    durationSemesters: 4,
    branches: [
      'Pharmaceutics',
      'Pharmacology',
      'Pharmaceutical Chemistry',
      'Quality Assurance (QA)',
    ],
  },
  'LLB': {
    category: 'Law & Legal Studies',
    durationSemesters: 6,
    branches: [
      'Corporate & Commercial Law',
      'Criminal Law & Justice',
      'Constitutional & Admin Law',
      'Intellectual Property Rights (IPR)',
      'Cyber Law & Privacy',
    ],
  },
};

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigateToHome,
  onAuthSuccess,
  initialTab = 'signin',
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>(initialTab);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sign In state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Register state
  const [name, setName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  // Academic Details
  const [collegeUrl, setCollegeUrl] = useState('');
  const [course, setCourse] = useState('B.Tech');
  const [branch, setBranch] = useState('CSE (Computer Science)');
  const [semester, setSemester] = useState<number>(6);
  const [isOtherBranch, setIsOtherBranch] = useState(false);
  const [customBranch, setCustomBranch] = useState('');
  const [isOtherCourse, setIsOtherCourse] = useState(false);
  const [customCourse, setCustomCourse] = useState('');

  const currentConfig = COURSE_CATALOG[course] || COURSE_CATALOG['B.Tech'];
  const availableBranches = currentConfig.branches;
  const semesterCount = currentConfig.durationSemesters;
  const semesterOptions = Array.from({ length: semesterCount }, (_, i) => i + 1);

  const handleCourseChange = (newCourse: string) => {
    setCourse(newCourse);
    if (newCourse === 'Other') {
      setIsOtherCourse(true);
      setIsOtherBranch(true);
      setBranch('Other');
      return;
    }
    setIsOtherCourse(false);
    const cfg = COURSE_CATALOG[newCourse];
    if (cfg && cfg.branches.length > 0) {
      setIsOtherBranch(false);
      setBranch(cfg.branches[0]);
      if (semester > cfg.durationSemesters) {
        setSemester(cfg.durationSemesters);
      }
    }
  };

  const handleBranchChange = (newBranch: string) => {
    setBranch(newBranch);
    if (newBranch === 'Other') {
      setIsOtherBranch(true);
    } else {
      setIsOtherBranch(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.login(signInEmail.trim(), signInPassword);
      const student = await api.getMe();
      onAuthSuccess(student);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Login failed. Please check your email and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy to proceed.');
      return;
    }

    if (registerPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (registerPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify both passwords.');
      return;
    }

    const finalCourse = isOtherCourse
      ? (customCourse.trim() || 'Other')
      : (course || 'B.Tech');

    const finalBranch = isOtherBranch
      ? (customBranch.trim() || 'Other')
      : (branch || availableBranches[0] || 'CSE');

    setLoading(true);
    try {
      await api.register({
        name: name.trim() || 'Learner',
        email: registerEmail.trim(),
        password: registerPassword,
        college_url: collegeUrl.trim() || 'https://www.iitb.ac.in/',
        course: finalCourse,
        branch: finalBranch,
        semester: semester || 6,
        email_notifications_enabled: true,
      });

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

  // Mock quick social sign-in demo handler
  const handleSocialAuth = async (provider: 'Google' | 'GitHub') => {
    setError(null);
    setLoading(true);
    try {
      // Simulate quick authentication
      const demoEmail = provider === 'Google' ? 'demo.google@learner.edu' : 'demo.github@learner.edu';
      const demoName = provider === 'Google' ? 'Google Scholar' : 'GitHub Developer';
      
      try {
        await api.login(demoEmail, 'SecurePass123!');
      } catch {
        // Register demo student if not existing
        await api.register({
          name: demoName,
          email: demoEmail,
          password: 'SecurePass123!',
          college_url: 'https://www.iitb.ac.in/',
          course: 'B.Tech',
          branch: 'CSE',
          semester: 6,
          email_notifications_enabled: true,
        });
      }
      const student = await api.getMe();
      onAuthSuccess(student);
    } catch {
      setError(`${provider} authentication is ready in development demo mode.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pm-auth-container">
      {/* Ambient background overlay for sunlight & dappled leaf shadow aesthetic */}
      <div className="pm-auth-overlay" />

      {/* Main Glassmorphic Card */}
      <div className="pm-auth-card">
        {/* Back to Home Button */}
        <button
          type="button"
          onClick={onNavigateToHome}
          className="pm-auth-back-btn"
          title="Back to Home"
          aria-label="Back to Home"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>

        {/* Brand Logo Header: ExamBuddy Leaf Icon */}
        <div className="pm-auth-brand">
          <svg width="34" height="34" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Left Leaf: Caramel / Terracotta Hue */}
            <path
              d="M24 28C17 28 11.5 22.5 11.5 15.5C11.5 8.5 22 4 25.5 2C24 9 26.5 19.5 24 28Z"
              fill="#A26C3C"
            />
            {/* Right Leaf: Soft Botanical Sage Green */}
            <path
              d="M24 28C31 28 36.5 22.5 36.5 15.5C36.5 8.5 26 4 22.5 2C24 9 21.5 19.5 24 28Z"
              fill="#7A8C5F"
            />
            {/* Base Stem Accent */}
            <path
              d="M24 26V36C24 38.2 22.2 40 20 40H18"
              stroke="#607049"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
          <span className="pm-auth-brand-name">ExamBuddy</span>
        </div>

        {/* Heading & Subtitle */}
        <div className="pm-auth-header">
          <h1 className="pm-auth-title">
            {activeTab === 'register' ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="pm-auth-subtitle">
            {activeTab === 'register'
              ? 'Join thousands of learners today'
              : 'Please enter your details to sign in'}
          </p>
        </div>

        {/* Error notification banner */}
        {error && (
          <div className="pm-error-banner">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* ================= REGISTER VIEW ================= */}
        {activeTab === 'register' ? (
          <form onSubmit={handleRegister} className="pm-form">
            {/* Full Name */}
            <div className="pm-field-group">
              <label className="pm-label">Full Name</label>
              <div className="pm-input-wrapper">
                <span className="pm-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </span>
                <input
                  type="text"
                  required
                  placeholder="Elon Musk"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pm-input"
                />
              </div>
            </div>

            {/* Email */}
            <div className="pm-field-group">
              <label className="pm-label">Email</label>
              <div className="pm-input-wrapper">
                <span className="pm-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                  </svg>
                </span>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  className="pm-input"
                />
              </div>
            </div>

            {/* Password */}
            <div className="pm-field-group">
              <label className="pm-label">Password</label>
              <div className="pm-input-wrapper">
                <span className="pm-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  className="pm-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="pm-password-toggle"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="pm-field-group">
              <label className="pm-label">Confirm Password</label>
              <div className="pm-input-wrapper">
                <span className="pm-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pm-input"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="pm-password-toggle"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
              {confirmPassword && registerPassword !== confirmPassword && (
                <span style={{ fontSize: '12px', color: '#dc2626', marginTop: '2px', fontWeight: 500 }}>
                  Passwords do not match
                </span>
              )}
            </div>

            {/* College Portal URL */}
            <div className="pm-field-group">
              <label className="pm-label">College Portal URL</label>
              <div className="pm-input-wrapper pm-url-input-wrapper">
                <span className="pm-input-icon pm-url-link-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                  </svg>
                </span>
                <input
                  type="url"
                  placeholder="https://www.iitb.ac.in/"
                  value={collegeUrl}
                  onChange={(e) => setCollegeUrl(e.target.value)}
                  className="pm-input pm-url-input"
                />
              </div>
            </div>

            {/* Course, Branch, Semester */}
            <div className="pm-academic-grid">
              <div className="pm-field-group">
                <label className="pm-label">Course</label>
                <div className="pm-select-wrapper">
                  <select
                    value={course}
                    onChange={(e) => handleCourseChange(e.target.value)}
                    className="pm-select"
                  >
                    <optgroup label="Engineering & Technology">
                      <option value="B.Tech">B.Tech</option>
                      <option value="B.E.">B.E.</option>
                      <option value="M.Tech">M.Tech</option>
                      <option value="Diploma">Diploma / Poly</option>
                    </optgroup>
                    <optgroup label="Computer Applications & IT">
                      <option value="BCA">BCA</option>
                      <option value="MCA">MCA</option>
                    </optgroup>
                    <optgroup label="Management & Commerce">
                      <option value="BBA">BBA</option>
                      <option value="MBA">MBA</option>
                      <option value="B.Com">B.Com</option>
                      <option value="M.Com">M.Com</option>
                    </optgroup>
                    <optgroup label="Sciences">
                      <option value="B.Sc">B.Sc</option>
                      <option value="M.Sc">M.Sc</option>
                    </optgroup>
                    <optgroup label="Humanities & Arts">
                      <option value="B.A.">B.A.</option>
                      <option value="M.A.">M.A.</option>
                    </optgroup>
                    <optgroup label="Pharmacy & Healthcare">
                      <option value="B.Pharm">B.Pharm</option>
                      <option value="M.Pharm">M.Pharm</option>
                    </optgroup>
                    <optgroup label="Law & Legal Studies">
                      <option value="LLB">LLB</option>
                    </optgroup>
                    <optgroup label="Custom / Other">
                      <option value="Other">+ Other Course (Type below)...</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              <div className="pm-field-group">
                <label className="pm-label">Branch</label>
                <div className="pm-select-wrapper">
                  <select
                    value={branch}
                    onChange={(e) => handleBranchChange(e.target.value)}
                    className="pm-select"
                    title={branch}
                  >
                    {availableBranches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                    <option value="Other" style={{ fontWeight: 600, color: '#284232' }}>
                      + Other (Type your branch)...
                    </option>
                  </select>
                </div>
              </div>

              <div className="pm-field-group">
                <label className="pm-label">Semester</label>
                <div className="pm-select-wrapper">
                  <select
                    value={semester}
                    onChange={(e) => setSemester(Number(e.target.value))}
                    className="pm-select"
                  >
                    {semesterOptions.map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Custom Course Input if 'Other' is selected */}
            {isOtherCourse && (
              <div className="pm-field-group pm-other-branch-anim">
                <label className="pm-label">
                  Specific Course Name <span style={{ color: '#284232', fontWeight: 500 }}>(Custom)</span>
                </label>
                <div className="pm-input-wrapper">
                  <span className="pm-input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path>
                      <path d="M6 6h10"></path>
                      <path d="M6 10h10"></path>
                    </svg>
                  </span>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Enter your course name (e.g. B.Des, B.Arch, Ph.D...)"
                    value={customCourse}
                    onChange={(e) => setCustomCourse(e.target.value)}
                    className="pm-input"
                  />
                </div>
              </div>
            )}

            {/* Custom Branch Input if 'Other' is selected */}
            {isOtherBranch && (
              <div className="pm-field-group pm-other-branch-anim">
                <label className="pm-label">Branch Name</label>
                <div className="pm-input-wrapper">
                  <span className="pm-input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                  </span>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Enter Your Branch"
                    value={customBranch}
                    onChange={(e) => setCustomBranch(e.target.value)}
                    className="pm-input"
                  />
                </div>
              </div>
            )}

            {/* Terms of Service Checkbox */}
            <div className="pm-checkbox-row">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="pm-checkbox"
              />
              <label htmlFor="terms" className="pm-checkbox-text">
                I agree to the <span className="pm-link">Terms of Service</span> and{' '}
                <span className="pm-link">Privacy Policy</span>
              </label>
            </div>

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={loading}
              className="pm-submit-btn"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
        ) : (
          /* ================= SIGN IN VIEW ================= */
          <form onSubmit={handleSignIn} className="pm-form">
            {/* Email */}
            <div className="pm-field-group">
              <label className="pm-label">Email</label>
              <div className="pm-input-wrapper">
                <span className="pm-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                  </svg>
                </span>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  className="pm-input"
                />
              </div>
            </div>

            {/* Password */}
            <div className="pm-field-group">
              <label className="pm-label">Password</label>
              <div className="pm-input-wrapper">
                <span className="pm-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  className="pm-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="pm-password-toggle"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="pm-checkbox-row">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="pm-checkbox"
                />
                <label htmlFor="remember" className="pm-checkbox-text">
                  Remember me
                </label>
              </div>
              <span
                className="pm-link"
                style={{ fontSize: '13px' }}
                onClick={() => setError('Password reset instructions will be sent to your registered email.')}
              >
                Forgot password?
              </span>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="pm-submit-btn"
            >
              {loading ? 'Signing In...' : 'Login'}
            </button>
          </form>
        )}

        {/* Divider: or continue with */}
        <div className="pm-divider">
          <div className="pm-divider-line" />
          <span className="pm-divider-text">or continue with</span>
          <div className="pm-divider-line" />
        </div>

        {/* Social Buttons Stack: Google + GitHub (replacing Microsoft) */}
        <div className="pm-sso-stack">
          {/* Continue with Google */}
          <button
            type="button"
            onClick={() => handleSocialAuth('Google')}
            className="pm-sso-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Continue with GitHub (as requested instead of Microsoft) */}
          <button
            type="button"
            onClick={() => handleSocialAuth('GitHub')}
            className="pm-sso-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#24292F">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
            <span>Continue with GitHub</span>
          </button>
        </div>

        {/* Bottom Switch Mode: Already have an account? Login / Sign Up */}
        <div className="pm-switch-row">
          <span>
            {activeTab === 'register'
              ? 'Already have an account?'
              : "Don't have an account?"}
          </span>
          <button
            type="button"
            onClick={() => {
              setActiveTab(activeTab === 'register' ? 'signin' : 'register');
              setError(null);
            }}
            className="pm-switch-btn"
          >
            {activeTab === 'register' ? 'Login' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
