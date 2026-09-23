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
      <div className="card-elevated p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge badge-emerald">AI Exam Readiness Intelligence</span>
            <span className="text-xs font-mono text-slate-400">
              {student.course} • Sem {student.semester}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Personalized Study Report: <span className="text-gradient-purple-cyan">{subject}</span>
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            Historical question analysis with mathematical recency-decay scoring and AI prioritization.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={subject}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className="form-input text-xs sm:text-sm py-2.5 px-3.5 w-auto min-w-[220px] cursor-pointer"
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
            className="btn-pill-primary text-xs sm:text-sm py-2.5 px-5 cursor-pointer"
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
            className="btn-outline text-xs py-1 px-3 cursor-pointer"
          >
            Run Initial Scorer
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400 font-mono">
            Analyzing curriculum modules &amp; past examination question weights...
          </p>
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* Actionable Strategy Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-purple-950/50 border border-indigo-500/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400 text-[22px]">
                  psychology
                </span>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Recommended Revision Roadmap
                </h4>
              </div>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium">
                {report.suggested_revision_strategy}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="px-4 py-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-center shadow-md">
                <span className="text-[10px] font-mono text-emerald-400 uppercase block font-bold">Tier 1 Must Master</span>
                <span className="text-xl font-bold text-white font-mono">{report.high_priority_count} topics</span>
              </div>
              <div className="px-4 py-2.5 rounded-xl bg-amber-950/80 border border-amber-500/40 text-center shadow-md">
                <span className="text-[10px] font-mono text-amber-400 uppercase block font-bold">Tier 2 Core</span>
                <span className="text-xl font-bold text-white font-mono">{report.medium_priority_count} topics</span>
              </div>
              <div className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-center shadow-md">
                <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">Tier 3 Review</span>
                <span className="text-xl font-bold text-white font-mono">{report.low_priority_count} topics</span>
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
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
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
                    <span className="text-xs font-mono text-slate-400 font-semibold">
                      {tier.topics.length} topics
                    </span>
                  </div>

                  {/* Topic Cards */}
                  {tier.topics.length === 0 ? (
                    <div className="card-base p-6 text-center text-xs text-slate-500">
                      No topics assigned to this tier yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3.5">
                      {tier.topics.map((topic: TopicImportanceItem) => {
                        const isExpanded = expandedTopicId === topic.syllabus_entry_id;

                        return (
                          <div
                            key={topic.syllabus_entry_id}
                            className={`p-5 transition-all ${
                              isTier1
                                ? 'card-tier1'
                                : isTier2
                                ? 'card-tier2'
                                : 'card-tier3'
                            }`}
                          >
                            {/* Card Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-start gap-3.5">
                                <div
                                  className={`w-11 h-11 rounded-xl flex items-center justify-center font-mono font-bold text-base flex-shrink-0 border shadow-md ${
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
                                  <h4 className="text-base sm:text-lg font-bold text-white">
                                    {topic.topic_title}
                                  </h4>
                                  {topic.topic_description && (
                                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
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
                                    className="btn-outline text-xs py-1.5 px-3 cursor-pointer"
                                  >
                                    <span>
                                      {isExpanded ? 'Hide Questions' : 'Inspect Past PYQs'}
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
                              <div className="mt-3.5 text-xs text-slate-300 bg-[#080b12] p-3 rounded-xl border border-slate-800 flex items-start gap-2.5 font-mono">
                                <span className="material-symbols-outlined text-indigo-400 text-[16px] flex-shrink-0 mt-0.5">
                                  psychology
                                </span>
                                <span>{topic.reasoning_summary}</span>
                              </div>
                            )}

                            {/* Expandable Past Exam Questions Snippets */}
                            {isExpanded && topic.matched_questions && (
                              <div className="mt-3.5 pt-3.5 border-t border-slate-800/80 space-y-2.5 animate-fade-in">
                                <span className="text-[11px] font-mono text-slate-400 block uppercase font-semibold">
                                  Matched Questions from Past University Exam Papers:
                                </span>
                                {topic.matched_questions.map((q) => (
                                  <div
                                    key={q.id}
                                    className="p-3.5 rounded-xl bg-[#090c14] border border-slate-800 text-xs space-y-1.5"
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
                                        <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                                          Match Confidence: {Math.round(q.match_confidence * 100)}%
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-slate-200 font-serif leading-relaxed italic pt-0.5">
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
        <div className="card-base p-16 text-center text-slate-400 text-sm">
          No analysis report found for {subject}. Click &quot;Recompute Scores&quot; above to calculate.
        </div>
      )}
    </div>
  );
};
