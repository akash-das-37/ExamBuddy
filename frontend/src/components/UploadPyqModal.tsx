import React, { useState } from 'react';
import type { OriginalDocument, PYQQuestion, Student } from '../types';

interface UploadPyqModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  onUploadSuccess: (newQuestions: PYQQuestion[], newDoc: OriginalDocument) => void;
}

export const UploadPyqModal: React.FC<UploadPyqModalProps> = ({
  isOpen,
  onClose,
  student,
  onUploadSuccess,
}) => {
  const [subject, setSubject] = useState('Computer Architecture');
  const [examYear, setExamYear] = useState('2025');
  const [examType, setExamType] = useState('End-Semester Exam');
  const [marksPerQuestion, setMarksPerQuestion] = useState<number>(10);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [questionsText, setQuestionsText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // Auto-extract year if present in filename
      const yearMatch = file.name.match(/20\d{2}/);
      if (yearMatch) {
        setExamYear(yearMatch[0]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      setError('Please provide the Subject name.');
      return;
    }
    if (!selectedFile && !questionsText.trim()) {
      setError('Please attach a Question Paper file (.pdf, .jpg, .png) or paste question texts.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const docId = `upload-pyq-${Date.now()}`;
      const fileName = selectedFile
        ? selectedFile.name
        : `${subject.replace(/\s+/g, '_')}_${examYear}_QuestionPaper.pdf`;
      const fileUrl = selectedFile ? URL.createObjectURL(selectedFile) : '#';
      const fileSize = selectedFile
        ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
        : 'Text / Question Set';

      // Parse question items from textarea, or create sample items from file
      let lines = questionsText
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 5);

      if (lines.length === 0) {
        lines = [
          `Explain the key principles and mathematical derivation of ${subject} concepts discussed in ${examYear}.`,
          `Analyze the architectural trade-offs between hardware implementation and algorithmic efficiency for ${subject}.`,
          `Solve numerical and design problems based on university examination standards for ${subject} [${examType}].`,
        ];
      }

      const newQuestions: PYQQuestion[] = lines.map((text, idx) => ({
        id: `pyq-up-${Date.now()}-${idx}`,
        college_id: student.college_id,
        subject: subject.trim(),
        exam_year: examYear,
        question_text: text,
        marks: marksPerQuestion || 10,
        matched_topic_id: null,
        match_confidence: 0.92,
        source_document_id: docId,
        source_document_url: fileUrl,
      }));

      const newDoc: OriginalDocument = {
        id: docId,
        title: `${examYear} ${examType}: ${subject}`,
        type: 'pyq',
        subject: subject.trim(),
        semester: String(student.semester),
        exam_year: examYear,
        file_name: fileName,
        file_url: fileUrl,
        file_size: fileSize,
        uploaded_at: new Date().toISOString(),
        is_official: false,
        extracted_count: newQuestions.length,
        content_preview: `MANUALLY UPLOADED QUESTION PAPER
Subject: ${subject} | Examination: ${examType} ${examYear}
File: ${fileName} | Extracted Questions: ${newQuestions.length}

${newQuestions.map((q, idx) => `Q${idx + 1} [${q.marks} Marks]:\n"${q.question_text}"`).join('\n\n')}`,
      };

      // Save to localStorage cache
      try {
        const storedDocs = JSON.parse(localStorage.getItem('exambuddy_uploaded_docs') || '[]');
        storedDocs.unshift(newDoc);
        localStorage.setItem('exambuddy_uploaded_docs', JSON.stringify(storedDocs));

        const storedPyqs = JSON.parse(localStorage.getItem('exambuddy_uploaded_pyqs') || '[]');
        localStorage.setItem(
          'exambuddy_uploaded_pyqs',
          JSON.stringify([...newQuestions, ...storedPyqs])
        );
      } catch {
        // ignore quota issues
      }

      onUploadSuccess(newQuestions, newDoc);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="relative w-full max-w-xl bg-[#0d121f] border border-white/15 rounded-2xl shadow-2xl shadow-cyan-950/60 overflow-hidden text-slate-100 animate-scale-in">
        <div className="h-1.5 w-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500" />

        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <span className="material-symbols-outlined text-[22px]">post_add</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Upload Question Paper (PYQ)
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Index past exam papers, questions &amp; marks weightage
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {/* Subject Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Subject Title *
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Computer Architecture or Data Structures"
                required
                className="w-full bg-[#080b13] border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-medium"
              />
            </div>

            {/* Year & Exam Type */}
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Exam Year
                </label>
                <select
                  value={examYear}
                  onChange={(e) => setExamYear(e.target.value)}
                  className="w-full bg-[#080b13] border border-white/15 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 cursor-pointer font-bold"
                >
                  {['2026', '2025', '2024', '2023', '2022', '2021', '2020'].map((y) => (
                    <option key={y} value={y} className="bg-[#0d121f]">
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Exam Category
                </label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  className="w-full bg-[#080b13] border border-white/15 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 cursor-pointer font-medium"
                >
                  <option value="End-Semester Exam" className="bg-[#0d121f]">End-Semester Exam</option>
                  <option value="Mid-Semester Exam" className="bg-[#0d121f]">Mid-Semester Exam</option>
                  <option value="Continuous Assessment / Class Test" className="bg-[#0d121f]">Class Test</option>
                </select>
              </div>
            </div>

            {/* File Upload Zone */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Attach Question Paper (PDF / Image)
              </label>
              <label className="border-2 border-dashed border-white/20 hover:border-cyan-400/60 rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer bg-[#080b13]/50 hover:bg-[#080b13] transition-all">
                <span className="material-symbols-outlined text-[32px] text-cyan-400">
                  upload_file
                </span>
                <span className="text-xs font-semibold text-slate-200">
                  {selectedFile ? selectedFile.name : 'Click to browse or drop Question Paper file'}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Supported formats: PDF, JPG, PNG (Max 15 MB)
                </span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Questions Text or Paste */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Questions Text (One question per line)
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">Default Marks:</span>
                  <input
                    type="number"
                    value={marksPerQuestion}
                    onChange={(e) => setMarksPerQuestion(Number(e.target.value))}
                    min={1}
                    max={100}
                    className="w-14 bg-[#080b13] border border-white/15 rounded px-2 py-0.5 text-xs text-white text-center"
                  />
                </div>
              </div>
              <textarea
                value={questionsText}
                onChange={(e) => setQuestionsText(e.target.value)}
                rows={3}
                placeholder="Explain Booth multiplication algorithm and multiply (+7) and (-3).&#10;Differentiate between RISC and CISC architectures with register windowing.&#10;Explain direct, associative, and set-associative cache mapping."
                className="w-full bg-[#080b13] border border-white/15 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary bg-cyan-600 hover:bg-cyan-500 text-xs py-2 px-5 font-semibold flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-600/30"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing Paper...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">library_add</span>
                    <span>Upload &amp; Add Questions</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
