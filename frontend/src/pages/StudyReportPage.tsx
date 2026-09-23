import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Student, StudyReportResponse, TopicImportanceItem } from '../types';

interface StudyReportPageProps {
  student: Student;
}

const COMMON_SUBJECTS = [
  'Computer Networks',
  'Operating Systems',
  'Data Structures and Algorithms',
  'Database Management Systems',
  'Theory of Computation',
  'Software Engineering',
];

export const StudyReportPage: React.FC<StudyReportPageProps> = ({ student }) => {
  const [subject, setSubject] = useState('Computer Networks');
  const [report, setReport] = useState<StudyReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [recomputing, setRecomputing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);

  const loadReport = async (subj: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMyStudyReport(subj);
      setReport(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load study report for subject');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(subject);
  }, []);

  const handleSubjectChange = (newSubj: string) => {
    setSubject(newSubj);
    loadReport(newSubj);
  };

  const handleRecompute = async () => {
    setRecomputing(true);
    setError(null);
    try {
      await api.computeImportance(student.college_id, subject);
      await loadReport(subject);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to compute importance scores');
      }
    } finally {
      setRecomputing(false);
    }
  };

  const toggleExpand = (topicId: string) => {
    setExpandedTopicId(expandedTopicId === topicId ? null : topicId);
  };

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto">
      {/* Header & Subject Controller */}
      <div className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-emerald">AI Exam Readiness Intelligence</span>
            <span className="text-xs font-mono text-slate-400">
              {student.course} • Sem {student.semester}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Personalized Study Report: <span className="text-indigo-400">{subject}</span>
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            Historical question analysis with recency weighting and AI prioritization.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={subject}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className="form-input text-xs sm:text-sm py-2 px-3 w-auto min-w-[200px]"
          >
            {COMMON_SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <button
            onClick={handleRecompute}
            disabled={recomputing}
            className="btn-primary text-xs sm:text-sm py-2 px-4"
          >
            <span
              className={`material-symbols-outlined text-[17px] ${
                recomputing ? 'animate-spin' : ''
              }`}
            >
              calculate
            </span>
            {recomputing ? 'Re-scoring...' : 'Recompute Scores'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
          <button
            onClick={() => handleRecompute()}
            className="btn-secondary text-xs py-1 px-2.5"
          >
            Run Initial Scorer
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400 font-mono">
            Analyzing syllabus modules & past examination questions...
          </p>
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* Actionable Strategy Banner */}
          <div className="p-5 rounded-xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-950/60 border border-indigo-500/40 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400 text-[20px]">
                  psychology
                </span>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Recommended Revision Strategy
                </h4>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">
                {report.suggested_revision_strategy}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="px-3 py-2 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-center">
                <span className="text-[10px] font-mono text-emerald-400 uppercase block">Tier 1 Must Master</span>
                <span className="text-lg font-bold text-white font-mono">{report.high_priority_count} topics</span>
              </div>
              <div className="px-3 py-2 rounded-lg bg-amber-950/70 border border-amber-500/40 text-center">
                <span className="text-[10px] font-mono text-amber-400 uppercase block">Tier 2 Core</span>
                <span className="text-lg font-bold text-white font-mono">{report.medium_priority_count} topics</span>
              </div>
              <div className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-center">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Tier 3 Review</span>
                <span className="text-lg font-bold text-white font-mono">{report.low_priority_count} topics</span>
              </div>
            </div>
          </div>

          {/* 3 Tiers Container */}
          <div className="space-y-6">
            {report.tiers.map((tier, index) => {
              const isTier1 = index === 0;
              const isTier2 = index === 1;

              return (
                <div key={tier.tier_name} className="space-y-3">
                  {/* Tier Title */}
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span
                        className={`badge ${
                          isTier1
                            ? 'badge-emerald'
                            : isTier2
                            ? 'badge-amber'
                            : 'badge-slate'
                        }`}
                      >
                        {tier.tier_name}
                      </span>
                      <span className="text-xs text-slate-400">{tier.description}</span>
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      {tier.topics.length} topics
                    </span>
                  </div>

                  {/* Topic Cards */}
                  {tier.topics.length === 0 ? (
                    <div className="glass-card p-4 text-center text-xs text-slate-500">
                      No topics assigned to this tier yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3.5">
                      {tier.topics.map((topic: TopicImportanceItem) => {
                        const isExpanded = expandedTopicId === topic.syllabus_entry_id;

                        return (
                          <div
                            key={topic.syllabus_entry_id}
                            className={`p-4 transition-all ${
                              isTier1
                                ? 'glass-card-tier1'
                                : isTier2
                                ? 'glass-card-tier2'
                                : 'glass-card-tier3'
                            }`}
                          >
                            {/* Card Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-start gap-2.5">
                                <div
                                  className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-sm flex-shrink-0 border ${
                                    isTier1
                                      ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                                      : isTier2
                                      ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                                      : 'bg-slate-900 border-slate-700 text-slate-300'
                                  }`}
                                >
                                  {Math.round(topic.final_importance_score)}
                                </div>
                                <div>
                                  <h4 className="text-base font-semibold text-white">
                                    {topic.topic_title}
                                  </h4>
                                  {topic.topic_description && (
                                    <p className="text-xs text-slate-300 mt-0.5">
                                      {topic.topic_description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-center">
                                <span
                                  className={`badge ${
                                    topic.frequency_count > 0 ? 'badge-indigo' : 'badge-slate'
                                  }`}
                                >
                                  {topic.frequency_count} PYQ appearances
                                </span>
                                {topic.matched_questions && topic.matched_questions.length > 0 && (
                                  <button
                                    onClick={() => toggleExpand(topic.syllabus_entry_id)}
                                    className="btn-ghost text-xs"
                                  >
                                    <span>
                                      {isExpanded ? 'Hide Questions' : 'View Past Questions'}
                                    </span>
                                    <span
                                      className={`material-symbols-outlined text-[16px] transition-transform ${
                                        isExpanded ? 'rotate-180' : ''
                                      }`}
                                    >
                                      expand_more
                                    </span>
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* AI Reasoning Summary */}
                            {topic.reasoning_summary && (
                              <div className="mt-3 text-xs text-slate-400 bg-[#070a13]/70 p-2.5 rounded-lg border border-slate-800/80 flex items-start gap-2">
                                <span className="material-symbols-outlined text-indigo-400 text-[15px] flex-shrink-0 mt-0.5">
                                  info
                                </span>
                                <span>{topic.reasoning_summary}</span>
                              </div>
                            )}

                            {/* Expandable Past Exam Questions Snippets */}
                            {isExpanded && topic.matched_questions && (
                              <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2 animate-fade-in">
                                <span className="text-[11px] font-mono text-slate-400 block uppercase">
                                  Matched Exam Questions from University Archives:
                                </span>
                                {topic.matched_questions.map((q) => (
                                  <div
                                    key={q.id}
                                    className="p-3 rounded-lg bg-[#070a13] border border-slate-800 text-xs space-y-1.5"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="badge badge-indigo">
                                          Exam Year: {q.exam_year}
                                        </span>
                                        {q.marks && (
                                          <span className="badge badge-amber">
                                            {q.marks} Marks
                                          </span>
                                        )}
                                      </div>
                                      {q.match_confidence && (
                                        <span className="text-[10px] font-mono text-slate-500">
                                          Match Confidence: {Math.round(q.match_confidence * 100)}%
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-slate-200 font-serif leading-relaxed">
                                      &quot;{q.question_text}&quot;
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="glass-card p-12 text-center text-slate-400 text-sm">
          No analysis report found for {subject}. Click &quot;Recompute Scores&quot; above to calculate.
        </div>
      )}
    </div>
  );
};
