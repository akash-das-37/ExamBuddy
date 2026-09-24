import React, { useState } from 'react';
import '../styles/cozy-home.css';

interface HomePageProps {
  onNavigateToLogin: (defaultTab?: 'signin' | 'register') => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigateToLogin }) => {
  const [activeModal, setActiveModal] = useState<'features' | 'about' | null>(null);

  return (
    <div className="pm-hero-wrapper">
      {/* Mobile-only subtle background veil */}
      <div className="pm-hero-overlay" />

      {/* Top Navigation Bar */}
      <header className="pm-navbar">
        {/* Brand Logo & Name */}
        <div
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="pm-brand"
        >
          {/* Two stylized organic leaves in warm terracotta/copper matching design */}
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 7C12 7 9.5 13 13.5 16.5C17.5 20 23.5 17 23.5 17C23.5 17 23 23.5 17 24C11 24.5 8 19 8 14C8 9 12 7 12 7Z"
              fill="#7d583b"
            />
            <path
              d="M18.5 10C18.5 10 21 12 21 15C21 18 18 19 18 19"
              stroke="#5d3e26"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M7 24.5C9 22.5 12 18.5 13.5 14"
              stroke="#7d583b"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span className="pm-brand-name">ExamBuddy</span>
        </div>

        {/* Center Nav Links */}
        <nav className="pm-nav-center">
          <button
            type="button"
            className="pm-nav-item active"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Home
          </button>
          <button
            type="button"
            className="pm-nav-item"
            onClick={() => setActiveModal('features')}
          >
            Features
          </button>
          <button
            type="button"
            className="pm-nav-item"
            onClick={() => setActiveModal('about')}
          >
            About
          </button>
        </nav>

        {/* Right Nav Action Buttons */}
        <div className="pm-nav-right">
          <button
            type="button"
            onClick={() => onNavigateToLogin('signin')}
            className="pm-btn-login"
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => onNavigateToLogin('register')}
            className="pm-btn-signup"
          >
            Sign Up
          </button>
        </div>
      </header>

      {/* Main Hero Body Section */}
      <main className="pm-hero-body">
        <div className="pm-hero-content">
          {/* Subtle Tagline with hand-drawn sparkle */}
          <div className="pm-tagline">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ color: '#5b695a', flexShrink: 0 }}
            >
              <path
                d="M12 2C12 2 12.5 7.5 14.5 9.5C16.5 11.5 22 12 22 12C22 12 16.5 12.5 14.5 14.5C12.5 16.5 12 22 12 22C12 22 11.5 16.5 9.5 14.5C7.5 12.5 2 12 2 12C2 12 7.5 11.5 9.5 9.5C11.5 7.5 12 2 12 2Z"
                fill="#586857"
              />
              <path
                d="M8 16L4 20"
                stroke="#586857"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span>LEARN &nbsp;•&nbsp; PRACTICE &nbsp;•&nbsp; TRACK &nbsp;•&nbsp; GROW</span>
          </div>

          {/* Decorative Quotation Mark */}
          <div className="pm-quote" aria-hidden="true">
            “
          </div>

          {/* Editorial Headline */}
          <h1 className="pm-headline">
            <span className="pm-headline-black">Small Steps</span>
            <span className="pm-headline-green">Big Progress</span>
          </h1>

          {/* Subtitle with matching two-line break */}
          <p className="pm-subtitle">
            A smarter way to study, stay consistent<br />
            and become the best version of yourself.
          </p>

          {/* Primary Call to Action Button */}
          <div>
            <button
              type="button"
              onClick={() => onNavigateToLogin('register')}
              className="pm-btn-cta"
            >
              <span>Start Learning Today</span>
              <span className="pm-cta-arrow">→</span>
            </button>
          </div>
        </div>
      </main>

      {/* Spacing for bottom balance */}
      <div style={{ height: '32px' }} />

      {/* Interactive Feature / Subjects / About Modals */}
      {activeModal && (
        <div className="pm-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="pm-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="pm-modal-close"
              onClick={() => setActiveModal(null)}
              aria-label="Close modal"
            >
              ✕
            </button>

            {activeModal === 'features' && (
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#284232', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  ExamBuddy Engine
                </span>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '26px', fontWeight: 800, marginTop: '6px', color: '#181b18' }}>
                  Features Built for High-Performance Students
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                  <div style={{ padding: '14px', background: 'rgba(40, 66, 50, 0.05)', borderRadius: '14px' }}>
                    <h4 style={{ fontWeight: 700, color: '#233f2e', fontSize: '15px' }}>1-Click PyMuPDF Table Extractor</h4>
                    <p style={{ fontSize: '13.5px', color: '#485248', marginTop: '4px', lineHeight: 1.5 }}>
                      Crawl university syllabus PDFs to automatically index all theory courses, lab subjects, and credits in seconds.
                    </p>
                  </div>
                  <div style={{ padding: '14px', background: 'rgba(40, 66, 50, 0.05)', borderRadius: '14px' }}>
                    <h4 style={{ fontWeight: 700, color: '#233f2e', fontSize: '15px' }}>Pareto 80/20 Revision Planner</h4>
                    <p style={{ fontSize: '13.5px', color: '#485248', marginTop: '4px', lineHeight: 1.5 }}>
                      Isolates the top 20% high-yield concepts that generate 80% of examination marks using recency-decay scoring.
                    </p>
                  </div>
                  <div style={{ padding: '14px', background: 'rgba(40, 66, 50, 0.05)', borderRadius: '14px' }}>
                    <h4 style={{ fontWeight: 700, color: '#233f2e', fontSize: '15px' }}>Silent Notice Monitor</h4>
                    <p style={{ fontSize: '13.5px', color: '#485248', marginTop: '4px', lineHeight: 1.5 }}>
                      Real-time datesheet updates, form fill-up deadlines, and schedule change alerts delivered seamlessly.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeModal === 'about' && (
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#284232', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Our Mission
                </span>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '26px', fontWeight: 800, marginTop: '6px', color: '#181b18' }}>
                  Empowering Technical Minds
                </h3>
                <p style={{ fontSize: '14px', color: '#485248', marginTop: '12px', lineHeight: 1.6 }}>
                  Technical students focus on coding, projects, and building real-world skills. ExamBuddy bridges the gap
                  by taking the chaos out of semester exams—giving you structured, high-yield preparation without sacrificing your technical journey.
                </p>
                <div style={{ marginTop: '20px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModal(null);
                      onNavigateToLogin('register');
                    }}
                    className="pm-btn-signup"
                    style={{ width: '100%', textAlign: 'center', padding: '12px' }}
                  >
                    Get Started Free
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
