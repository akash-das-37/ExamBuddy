import type {
  College,
  Notice,
  NotificationLogItem,
  PYQQuestion,
  Student,
  StudyReportResponse,
  SyllabusEntry,
  TopicImportanceItem,
} from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'http://127.0.0.1:8000';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('exambuddy_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `Request failed: ${response.status} ${response.statusText}`;
    try {
      const errData = await response.json();
      if (errData && errData.detail) {
        errorMsg = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  // Handle 204 or empty responses
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ access_token: string; token_type: string }> {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      let msg = 'Invalid email or password';
      try {
        const err = await response.json();
        if (err.detail) msg = err.detail;
      } catch {
        // ignore
      }
      throw new Error(msg);
    }

    const data = await response.json();
    localStorage.setItem('exambuddy_token', data.access_token);
    return data;
  },

  async register(studentData: {
    name: string;
    email: string;
    password: string;
    college_url: string;
    course: string;
    branch: string;
    semester: number;
    email_notifications_enabled?: boolean;
  }): Promise<{ access_token: string; token_type: string }> {
    const data = await request<{ access_token: string; token_type: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
    if (data && data.access_token) {
      localStorage.setItem('exambuddy_token', data.access_token);
    }
    return data;
  },

  async getMe(): Promise<Student> {
    return request<Student>('/auth/me');
  },

  logout(): void {
    localStorage.removeItem('exambuddy_token');
  },

  // College & Scrape Status
  async getCollege(collegeId: string): Promise<College> {
    return request<College>(`/colleges/${collegeId}`);
  },

  async triggerScrape(collegeId: string): Promise<{ message: string; status: string }> {
    return request<{ message: string; status: string }>(`/colleges/${collegeId}/scrape`, {
      method: 'POST',
    });
  },

  async getScrapeStatus(collegeId: string): Promise<{
    college_id: string;
    status: string;
    last_scraped_at: string | null;
    pages_scraped: number;
    documents_found: number;
  }> {
    return request(`/colleges/${collegeId}/scrape/status`);
  },

  // Content (Syllabus, PYQs, Notices)
  async searchAndImportSyllabus(
    collegeId: string,
    course: string,
    semester: string,
    regulation?: string,
    forceRefresh: boolean = true
  ): Promise<{
    message: string;
    college_id: string;
    course: string;
    semester: string;
    source_pdf_url: string;
    total_courses_found: number;
    total_entries_created: number;
    entries: SyllabusEntry[];
  }> {
    return request(`/colleges/${collegeId}/search-syllabus`, {
      method: 'POST',
      body: JSON.stringify({
        course,
        semester: String(semester),
        regulation,
        force_refresh: forceRefresh,
      }),
    });
  },

  async getSyllabus(collegeId: string, course?: string, semester?: string): Promise<SyllabusEntry[]> {
    const params = new URLSearchParams();
    if (course) params.append('course', course);
    if (semester) params.append('semester', semester);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<SyllabusEntry[]>(`/colleges/${collegeId}/syllabus${query}`);
  },

  async getPYQs(collegeId: string, subject?: string, examYear?: string): Promise<PYQQuestion[]> {
    const params = new URLSearchParams();
    if (subject) params.append('subject', subject);
    if (examYear) params.append('exam_year', examYear);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<PYQQuestion[]>(`/colleges/${collegeId}/pyqs${query}`);
  },

  async getNotices(collegeId: string): Promise<Notice[]> {
    return request<Notice[]>(`/colleges/${collegeId}/notices`);
  },

  // Exam Preparation Analysis & Study Reports
  async computeImportance(collegeId: string, subject: string): Promise<{
    message: string;
    college_id: string;
    subject: string;
    topics_scored: number;
    pyqs_matched: number;
  }> {
    return request(`/analysis/${encodeURIComponent(subject)}/compute?college_id=${collegeId}`, {
      method: 'POST',
    });
  },

  async getRankedTopics(collegeId: string, subject: string): Promise<TopicImportanceItem[]> {
    return request<TopicImportanceItem[]>(
      `/analysis/${encodeURIComponent(subject)}/ranked-topics?college_id=${collegeId}`
    );
  },

  async getMyStudyReport(subject: string): Promise<StudyReportResponse> {
    return request<StudyReportResponse>(
      `/students/me/study-report?subject=${encodeURIComponent(subject)}`
    );
  },

  // Notifications
  async getMyNotifications(): Promise<NotificationLogItem[]> {
    return request<NotificationLogItem[]>('/notifications/me');
  },

  async updateNotificationPreferences(enabled: boolean): Promise<{
    student_id: string;
    email_notifications_enabled: boolean;
    message: string;
  }> {
    return request('/notifications/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ email_notifications_enabled: enabled }),
    });
  },
};
