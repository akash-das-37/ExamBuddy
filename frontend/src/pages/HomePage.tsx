import React, { useState } from 'react';
import '../styles/cozy-home.css';

interface HomePageProps {
  onNavigateToLogin: (defaultTab?: 'signin' | 'register') => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigateToLogin }) => {
  const [activeModal, setActiveModal] = useState<'features' | 'subjects' | 'about' | null>(null);

  return (
    <div className="pm-hero-wrapper">
      {/* Soft natural overlay ensuring high-contrast readability on any screen width */}
      <div className="pm-hero-overlay" />

      {/* Top Navigation Bar */}
      <header className="pm-navbar">
        {/* Brand Logo & Name */}
        <div
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="pm-brand"
        >
          {/* Stylized organic leaf sprout icon matching design */}
          <svg width="32" height="32" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M14 6C14 6 11 14 17 19C23 24 31 19 31 19C31 19 30 28 20 28C10 28 6 21 6 15C6 9 14 6 14 6Z"
              fill="#7a5538"
            />
            <path
              d="M17 19C17 19 22 17 24 12C24.5 10.7 24.3 9.5 24 8.5C22.5 8 20.5 8.5 19 10C17.2 11.8 17 15 17 19Z"
              fill="#9e724c"
              opacity="0.9"
            />
            <path
              d="M9 29C11 26 15 21 17 19"
              stroke="#593b23"
              strokeWidth="2.2"
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
            onClick={() => setActiveModal('subjects')}
          >
            Subjects
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
          {/* Subtle Tagline */}
          <div className="pm-tagline">
            <span className="pm-sparkle">✦</span>
            <span>LEARN • PRACTICE • TRACK • GROW</span>
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

          {/* Subtitle */}
          <p className="pm-subtitle">
            A smarter way to study, stay consistent and become the best version of yourself.
          </p>

          {/* Primary Call to Action Button */}
          <div>
            <button
              type="button"
              onClick={() => onNavigateToLogin('register')}
              className="pm-btn-cta"
            >
              <span>Start Learning Today</span>
              <span style={{ fontSize: '18px', lineHeight: 1 }}>→</span>
            </button>
          </div>
        </div>
      </main>

      {/* Empty space for bottom balance without the requested excluded sections */}
      <div style={{ height: '40px' }} />

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
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#253a2a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Intelligence Engine
                </span>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '26px', fontWeight: 800, marginTop: '6px', color: '#191c19' }}>
                  Features Built for High Performance
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                  <div style={{ padding: '14px', background: 'rgba(37, 58, 42, 0.05)', borderRadius: '14px' }}>
                    <h4 style={{ fontWeight: 700, color: '#1e382b', fontSize: '15px' }}>1-Click PyMuPDF Table Extractor</h4>
                    <p style={{ fontSize: '13.5px', color: '#4d554d', marginTop: '4px', lineHeight: 1.5 }}>
                      Crawl college syllabus PDFs and extract all theory and lab subjects, credits, and contact hours in seconds.
                    </p>
                  </div>
                  <div style={{ padding: '14px', background: 'rgba(37, 58, 42, 0.05)', borderRadius: '14px' }}>
                    <h4 style={{ fontWeight: 700, color: '#1e382b', fontSize: '15px' }}>Pareto 80/20 Revision Planner</h4>
                    <p style={{ fontSize: '13.5px', color: '#4d554d', marginTop: '4px', lineHeight: 1.5 }}>
                      Isolates the top 20% high-yield concepts that generate 80% of examination marks using recency-decay scoring.
                    </p>
                  </div>
                  <div style={{ padding: '14px', background: 'rgba(37, 58, 42, 0.05)', borderRadius: '14px' }}>
                    <h4 style={{ fontWeight: 700, color: '#1e382b', fontSize: '15px' }}>Silent Circular Monitor</h4>
                    <p style={{ fontSize: '13.5px', color: '#4d554d', marginTop: '4px', lineHeight: 1.5 }}>
                      Real-time datesheet updates, form fill-up deadlines, and schedule change alerts delivered seamlessly.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeModal === 'subjects' && (
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#253a2a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Curriculum Coverage
                </span>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '26px', fontWeight: 800, marginTop: '6px', color: '#191c19' }}>
                  Indexed Technical Courses
                </h3>
                <p style={{ fontSize: '14px', color: '#4d554d', marginTop: '8px', lineHeight: 1.5 }}>
                  Autonomous college syllabus tables parsed with module-level topics and past exam papers:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '16px' }}>
                  <div style={{ padding: '10px 14px', background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
                    <strong style={{ color: '#1e382b' }}>CS301</strong>
                    <div style={{ fontSize: '12px', color: '#666' }}>Data Structures & Algorithms</div>
                  </div>
                  <div style={{ padding: '10px 14px', background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
                    <strong style={{ color: '#1e382b' }}>CS302</strong>
                    <div style={{ fontSize: '12px', color: '#666' }}>Discrete Mathematics</div>
                  </div>
                  <div style={{ padding: '10px 14px', background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
                    <strong style={{ color: '#1e382b' }}>CS303</strong>
                    <div style={{ fontSize: '12px', color: '#666' }}>Computer Organization & Arch</div>
                  </div>
                  <div style={{ padding: '10px 14px', background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
                    <strong style={{ color: '#1e382b' }}>EC(CS)301</strong>
                    <div style={{ fontSize: '12px', color: '#666' }}>Digital Electronics & Circuits</div>
                  </div>
                </div>
              </div>
            )}

            {activeModal === 'about' && (
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#253a2a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Our Mission
                </span>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '26px', fontWeight: 800, marginTop: '6px', color: '#191c19' }}>
                  Empowering Technical Minds
                </h3>
                <p style={{ fontSize: '14px', color: '#4d554d', marginTop: '12px', lineHeight: 1.6 }}>
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
