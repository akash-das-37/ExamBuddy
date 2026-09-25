export interface Student {
  id: string;
  name: string;
  email: string;
  college_id: string;
  college_url?: string | null;
  college_name?: string | null;
  course: string;
  branch: string;
  semester: number;
  email_notifications_enabled: boolean;
  is_active: boolean;
}

export interface College {
  id: string;
  name: string | null;
  base_url: string;
  scrape_status: string;
  last_scraped_at: string | null;
}

export interface PYQQuestionSnippet {
  id: string;
  exam_year: string;
  question_text: string;
  marks: number | null;
  match_confidence: number | null;
}

export interface TopicImportanceItem {
  syllabus_entry_id: string;
  topic_title: string;
  topic_description: string | null;
  subject: string;
  course: string;
  semester: string;
  frequency_count: number;
  recency_weighted_score: number;
  final_importance_score: number;
  priority_level: 'High Priority' | 'Medium Priority' | 'Low Priority';
  reasoning_summary: string | null;
  matched_questions: PYQQuestionSnippet[];
}

export interface StudyTier {
  tier_name: string;
  description: string;
  topics: TopicImportanceItem[];
}

export interface StudyReportResponse {
  student_name: string;
  course: string;
  branch: string;
  semester: number;
  subject: string;
  total_topics_analyzed: number;
  total_pyqs_analyzed: number;
  high_priority_count: number;
  medium_priority_count: number;
  low_priority_count: number;
  suggested_revision_strategy: string;
  tiers: StudyTier[];
  generated_at: string;
}

export interface Notice {
  id: string;
  college_id: string;
  title: string;
  content: string | null;
  detected_at: string;
  target_courses: string[] | null;
  target_semesters: string[] | null;
}

export interface NotificationLogItem {
  id: string;
  notice_id: string;
  sent_at: string;
  delivery_status: string;
  notice_title?: string;
  notice_content?: string;
}

export interface SyllabusEntry {
  id: string;
  college_id: string;
  course: string;
  semester: string;
  subject: string;
  topic_title: string;
  topic_description: string | null;
  source_document_id?: string | null;
  source_document_url?: string | null;
}

export interface PYQQuestion {
  id: string;
  college_id: string;
  subject: string;
  exam_year: string;
  question_text: string;
  marks: number | null;
  matched_topic_id: string | null;
  match_confidence: number | null;
  source_document_id?: string | null;
  source_document_url?: string | null;
}

export interface OriginalDocument {
  id: string;
  title: string;
  type: 'syllabus' | 'pyq';
  subject?: string;
  semester?: string;
  exam_year?: string;
  file_url: string;
  file_name: string;
  file_size?: string;
  uploaded_at: string;
  is_official?: boolean;
  content_preview?: string;
  extracted_count?: number;
}

