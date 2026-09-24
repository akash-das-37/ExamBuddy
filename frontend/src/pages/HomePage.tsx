import React from 'react';

interface HomePageProps {
  onNavigateToLogin: (defaultTab?: 'signin' | 'register') => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigateToLogin }) => {
  return (
    <div className="ex-page-wrapper">
      {/* Ambient background glows matching Stitch design */}
      <div className="ex-glow-center" />
      <div className="ex-glow-cyan" />

      {/* Top Header Navigation */}
      <header className="ex-header">
        {/* Left: Brand Logo & Title */}
        <div
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="ex-brand"
        >
          <div className="ex-brand-logo">
            <span className="material-symbols-outlined">school</span>
          </div>
          <span className="ex-brand-name">ExamBuddy</span>
        </div>

        {/* Right: Nav Links + Get Started Button */}
        <div className="ex-nav-actions">
          <a href="#features" className="ex-nav-link ex-nav-link-hide-mobile">
            Features
          </a>
          <a href="#problem" className="ex-nav-link ex-nav-link-hide-mobile">
            The Coder's Dilemma
          </a>
          <button
            type="button"
            onClick={() => onNavigateToLogin('signin')}
            className="ex-nav-link"
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => onNavigateToLogin('register')}
            className="ex-btn-pill-gradient"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="ex-hero">
        {/* Floating Top Badge */}
        <div className="ex-badge">
          <span>⚡</span>
          <span>Built for Technical Students, Developers & Engineers</span>
        </div>

        {/* Large Centered Headline */}
        <h1 className="ex-hero-title">
          Focus on Coding.<br />
          <span className="ex-gradient-text">Let AI Crack Your Exams.</span>
        </h1>

        {/* Centered Subtitle */}
        <p className="ex-hero-subtitle">
          Tech students spend all semester building real projects, solving DSA, and mastering industry skills.
          When semester exams knock at the door, ExamBuddy crawls your college portal and delivers 80/20 Pareto
          intelligence so you can ace your GPA in minimal hours.
        </p>

        {/* Main Pill CTA Button */}
        <div>
          <button
            type="button"
            onClick={() => onNavigateToLogin('register')}
            className="ex-btn-cta-large"
          >
            <span>Rescue My Exam Prep</span>
            <span style={{ fontSize: '18px' }}>➔</span>
          </button>
        </div>
      </main>

      {/* Why ExamBuddy / The Problem Section */}
      <section id="problem" style={{ maxWidth: '960px', margin: '40px auto 20px', padding: '0 24px', textAlign: 'center' }}>
        <div style={{
          background: 'rgba(30, 41, 59, 0.45)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: '20px',
          padding: '36px 28px',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)'
        }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#818cf8',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            display: 'inline-block',
            marginBottom: '8px'
          }}>
            The Reality of Engineering Academics
          </span>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', marginBottom: '12px', lineHeight: 1.3 }}>
            Why High-Skill Coders Get Messed Up When Exams Knock at the Door
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.7, maxWidth: '820px', margin: '0 auto' }}>
            You're shipping full-stack code, grinding LeetCode, and preparing for tech placements—not reading 500-page slide decks.
            When exams suddenly arrive, college portals are labyrinths of broken links, syllabi are buried in deep PDFs, and PYQ scans are scattered across WhatsApp groups.
            ExamBuddy automates the entire academic grunt work with mathematical 80/20 precision so you never compromise your technical focus.
          </p>
        </div>
      </section>

      {/* Bottom 3 Feature Cards */}
      <section id="features" className="ex-features">
        <div className="ex-features-grid">
          {/* Card 1: 1-Click PyMuPDF Extractor */}
          <div
            onClick={() => onNavigateToLogin('signin')}
            className="ex-card"
          >
            <div className="ex-card-icon">
              <span className="material-symbols-outlined">auto_stories</span>
            </div>
            <h3 className="ex-card-title">1-Click Syllabus Discovery</h3>
            <p className="ex-card-desc">
              PyMuPDF extraction parses messy college PDFs—instantly indexing all 6 theory courses, lab matrices, and modular sub-topics.
            </p>
          </div>

          {/* Card 2: Pareto 80/20 Revision Planner */}
          <div
            onClick={() => onNavigateToLogin('signin')}
            className="ex-card"
          >
            <div className="ex-card-icon">
              <span className="material-symbols-outlined">psychology</span>
            </div>
            <h3 className="ex-card-title">Pareto 80/20 Planner</h3>
            <p className="ex-card-desc">
              Recency-weighted decay scoring isolates the top 20% high-yield concepts that deliver 80% of marks, organized into 3-tier study sprints.
            </p>
          </div>

          {/* Card 3: Portal Notice Watchdog */}
          <div
            onClick={() => onNavigateToLogin('signin')}
            className="ex-card"
          >
            <div className="ex-card-icon">
              <span className="material-symbols-outlined">notifications_active</span>
            </div>
            <h3 className="ex-card-title">Silent Notice Watchdog</h3>
            <p className="ex-card-desc">
              Autonomous crawler tracks exam form deadlines, admit card releases, and schedule postponements buried in college circular boards.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
