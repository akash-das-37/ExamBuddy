import React, { useState } from 'react';
import type { OriginalDocument, PYQQuestion, Student } from '../types';

interface UploadPyqModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  onUploadSuccess: (newPyqs: PYQQuestion[], newDoc: OriginalDocument) => void;
}

export const UploadPyqModal: React.FC<UploadPyqModalProps> = ({
  isOpen,
  onClose,
  student,
  onUploadSuccess,
}) => {
  const [subject, setSubject] = useState('');
  const [examYear, setExamYear] = useState('2024');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [manualQuestions, setManualQuestions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      setError('Please provide a subject title.');
      return;
    }
    if (!selectedFile && !manualQuestions.trim()) {
      setError('Please attach a PYQ exam paper PDF or paste questions.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const docId = `upload-pyq-${Date.now()}`;
      const fileName = selectedFile ? selectedFile.name : `${subject}_${examYear}_PYQ.txt`;
      const fileUrl = selectedFile ? URL.createObjectURL(selectedFile) : '#';

      const rawLines = manualQuestions
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 5);

      const parsedQuestions: PYQQuestion[] =
        rawLines.length > 0
          ? rawLines.map((line, idx) => ({
              id: `pyq-up-${Date.now()}-${idx}`,
              college_id: student.college_id,
              subject: subject.trim(),
              exam_year: examYear,
              question_text: line,
              marks: line.includes('marks') ? parseInt(line.match(/(\d+)\s*marks/i)?.[1] || '10') : 10,
              matched_topic_id: null,
              match_confidence: null,
              source_document_id: docId,
            }))
          : [
              {
                id: `pyq-up-${Date.now()}-1`,
                college_id: student.college_id,
                subject: subject.trim(),
                exam_year: examYear,
                question_text: `Comprehensive examination question for ${subject.trim()} (${examYear} End-Semester).`,
                marks: 15,
                matched_topic_id: null,
                match_confidence: null,
                source_document_id: docId,
              },
            ];

      const newDoc: OriginalDocument = {
        id: docId,
        title: `${subject.trim()} (${examYear}) - Previous Year Exam Paper`,
        type: 'pyq',
        subject: subject.trim(),
        semester: String(student.semester || '3'),
        file_name: fileName,
        file_url: fileUrl,
        file_size: selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Text Questions',
        uploaded_at: new Date().toISOString(),
        is_official: false,
        extracted_count: parsedQuestions.length,
        content_preview: `UPLOADED PYQ PAPER: ${subject.toUpperCase()} (${examYear})\n\n` +
          parsedQuestions.map((q, i) => `Q${i + 1} [${q.marks} Marks]: ${q.question_text}`).join('\n\n'),
      };

      // Cache locally
      try {
        const stored: PYQQuestion[] = JSON.parse(localStorage.getItem('exambuddy_uploaded_pyqs') || '[]');
        const newIds = new Set(parsedQuestions.map((q) => q.id));
        const filtered = stored.filter((q) => !newIds.has(q.id));
        localStorage.setItem('exambuddy_uploaded_pyqs', JSON.stringify([...parsedQuestions, ...filtered]));
      } catch {
        // ignore
      }

      onUploadSuccess(parsedQuestions, newDoc);
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
      <div className="relative w-full max-w-lg bg-[#0d121f] border border-white/15 rounded-2xl shadow-2xl p-6 text-slate-100 animate-scale-in space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-purple-400 text-[24px]">quiz</span>
            <h3 className="text-base font-bold text-white">Upload Previous Year Question Paper</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-left text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Subject Title *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Computer Architecture"
              required
              className="w-full bg-[#080b13] border border-white/15 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Exam Year</label>
            <input
              type="text"
              value={examYear}
              onChange={(e) => setExamYear(e.target.value)}
              placeholder="e.g. 2024"
              className="w-full bg-[#080b13] border border-white/15 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Attach Exam Paper PDF</label>
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
              className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600/30 file:text-indigo-300 hover:file:bg-indigo-600/50 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Or Paste Questions</label>
            <textarea
              value={manualQuestions}
              onChange={(e) => setManualQuestions(e.target.value)}
              rows={3}
              placeholder="Enter exam questions, one per line..."
              className="w-full bg-[#080b13] border border-white/15 rounded-xl p-2.5 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary py-2 px-4 text-xs font-semibold"
            >
              {isSubmitting ? 'Uploading...' : 'Save PYQ Paper'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
