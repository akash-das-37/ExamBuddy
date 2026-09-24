import React, { useEffect, useState } from 'react';
import { api } from './api/client';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { NoticesPage } from './pages/NoticesPage';
import { StudyReportPage } from './pages/StudyReportPage';
import { SyllabusPage } from './pages/SyllabusPage';
import { PyqPage } from './pages/PyqPage';
import type { College, Notice, Student } from './types';

export const App: React.FC = () => {
  const [student, setStudent] = useState<Student | null>(null);
  const [college, setCollege] = useState<College | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [totalTopics, setTotalTopics] = useState(0);
  const [totalPYQs, setTotalPYQs] = useState(0);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [publicView, setPublicView] = useState<'home' | 'login'>('home');
  const [loginInitialTab, setLoginInitialTab] = useState<'signin' | 'register'>('signin');
  const [isScraping, setIsScraping] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadStudentData = async (stud: Student) => {
    setStudent(stud);
    try {
      if (stud.college_id) {
        const [col, nots, syllabus, pyqs] = await Promise.all([
          api.getCollege(stud.college_id).catch(() => null),
          api.getNotices(stud.college_id).catch(() => []),
          api.getSyllabus(stud.college_id).catch(() => []),
          api.getPYQs(stud.college_id).catch(() => []),
        ]);
        if (col) setCollege(col);
        setNotices(nots);
        setTotalTopics(syllabus.length);
        setTotalPYQs(pyqs.length);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('exambuddy_token');
      if (token) {
        try {
          const currentStudent = await api.getMe();
          await loadStudentData(currentStudent);
        } catch {
          api.logout();
          setStudent(null);
        }
      }
      setInitializing(false);
    };
    initAuth();
  }, []);

  const handleLogout = () => {
    api.logout();
    setStudent(null);
    setCollege(null);
    setNotices([]);
    setActiveTab('dashboard');
    setPublicView('home');
    showToast('Signed out successfully', 'info');
  };

  const handleTriggerScrape = async () => {
    if (!student?.college_id) return;
    setIsScraping(true);
    showToast('Triggered college portal web crawler...', 'info');
    try {
      await api.triggerScrape(student.college_id);

      // Poll status for up to 15 seconds
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        try {
          const statusData = await api.getScrapeStatus(student.college_id);
          if (statusData.status === 'completed' || attempts >= 8) {
            clearInterval(interval);
            setIsScraping(false);
            showToast('Portal crawling & document extraction complete!', 'success');
            await loadStudentData(student);
          }
        } catch {
          clearInterval(interval);
          setIsScraping(false);
        }
      }, 2000);
    } catch (err: unknown) {
      setIsScraping(false);
      showToast(err instanceof Error ? err.message : 'Scrape trigger failed', 'error');
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    try {
      await api.updateNotificationPreferences(enabled);
      if (student) {
        setStudent({ ...student, email_notifications_enabled: enabled });
      }
      showToast(
        enabled ? 'Email alerts enabled for revised notices!' : 'Email alerts muted',
        'success'
      );
    } catch {
      showToast('Could not update notification settings', 'error');
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f19]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm font-mono text-slate-400">Loading ExamBuddy Copilot...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    if (publicView === 'home') {
      return (
        <HomePage
          onNavigateToLogin={(tab = 'signin') => {
            setLoginInitialTab(tab);
            setPublicView('login');
          }}
        />
      );
    }

    return (
      <LoginPage
        initialTab={loginInitialTab}
        onNavigateToHome={() => setPublicView('home')}
        onAuthSuccess={async (newStudent) => {
          await loadStudentData(newStudent);
          showToast(`Welcome back, ${newStudent.name}!`, 'success');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 border animate-fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
              : toast.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-500/50'
              : 'bg-indigo-950/90 text-indigo-200 border-indigo-500/50'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">
            {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        setActiveTab={setActiveTab}
        student={student}
        college={college}
        onLogout={handleLogout}
        onTriggerScrape={handleTriggerScrape}
        isScraping={isScraping}
      />

      {/* Workspace Body: Left Sidebar + Main Content */}
      <div className="eb-layout-wrapper">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          student={student}
          college={college}
          noticesCount={notices.length}
        />

        <main className="eb-main-content">
          {activeTab === 'dashboard' && (
            <Dashboard
              student={student}
              college={college}
              notices={notices}
              totalTopics={totalTopics}
              totalPYQs={totalPYQs}
              onNavigateTab={setActiveTab}
              onTriggerScrape={handleTriggerScrape}
              onToggleNotifications={handleToggleNotifications}
              isScraping={isScraping}
            />
          )}

          {activeTab === 'study-report' && <StudyReportPage student={student} />}

          {activeTab === 'syllabus' && <SyllabusPage student={student} />}

          {activeTab === 'pyqs' && <PyqPage student={student} />}

          {activeTab === 'notices' && (
            <NoticesPage
              student={student}
              notices={notices}
              onToggleNotifications={handleToggleNotifications}
            />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 py-4 px-6 text-center text-xs font-mono text-slate-500">
        ExamBuddy v0.2.0 • AI-Powered University Exam Copilot • Built for College Students
      </footer>
    </div>
  );
};

export default App;
