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
          <a href="#about" className="ex-nav-link ex-nav-link-hide-mobile">
            About
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
          <span>✦</span>
          <span>AI-Powered Study Planning</span>
        </div>

        {/* Large Centered Headline */}
        <h1 className="ex-hero-title">
          Stop Guessing What to <br />
          <span className="ex-gradient-text">Study for Exams.</span>
        </h1>

        {/* Centered Subtitle */}
        <p className="ex-hero-subtitle">
          Let AI analyze your syllabus and past papers to tell you what actually matters.
          <br />
          Personalized study plans generated in seconds.
        </p>

        {/* Main Pill CTA Button */}
        <div>
          <button
            type="button"
            onClick={() => onNavigateToLogin('register')}
            className="ex-btn-cta-large"
          >
            <span>Start Planning Now</span>
            <span style={{ fontSize: '18px' }}>➔</span>
          </button>
        </div>
      </main>

      {/* Bottom 3 Feature Cards matching screenshot */}
      <section id="features" className="ex-features">
        <div className="ex-features-grid">
          {/* Card 1: Secure Data */}
          <div
            onClick={() => onNavigateToLogin('register')}
            className="ex-card"
          >
            <div className="ex-card-icon">
              <span className="material-symbols-outlined">security</span>
            </div>
            <h3 className="ex-card-title">Secure Data</h3>
            <p className="ex-card-desc">
              Connects directly to your college portal and exam records with zero data leakage.
            </p>
          </div>

          {/* Card 2: Smart Priority */}
          <div
            onClick={() => onNavigateToLogin('register')}
            className="ex-card"
          >
            <div className="ex-card-icon">
              <span className="material-symbols-outlined">psychology</span>
            </div>
            <h3 className="ex-card-title">Smart Priority</h3>
            <p className="ex-card-desc">
              Recency-decay formula scores historical question frequencies to predict must-master topics.
            </p>
          </div>

          {/* Card 3: Fast Execution */}
          <div
            onClick={() => onNavigateToLogin('register')}
            className="ex-card"
          >
            <div className="ex-card-icon">
              <span className="material-symbols-outlined">rocket_launch</span>
            </div>
            <h3 className="ex-card-title">Fast Execution</h3>
            <p className="ex-card-desc">
              Generates actionable 3-tier study plans in seconds and delivers real-time datesheet alerts.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
