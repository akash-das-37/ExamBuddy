import React, { useState, useEffect } from 'react';
import type { OriginalDocument, PYQQuestion, Student } from '../types';
import { isSupabaseConfigured, supabaseAuth } from '../lib/supabase';

interface UploadPyqModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  availableSubjects: string[];
  initialSubject?: string;
  onUploadSuccess: (newPyqs: PYQQuestion[], newDoc: OriginalDocument) => void;
}

export const UploadPyqModal: React.FC<UploadPyqModalProps> = ({
  isOpen,
  onClose,
  student,
  availableSubjects,
  initialSubject,
  onUploadSuccess,
}) => {
  const currentSemester = String(student?.semester || '4');

  const [subject, setSubject] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync initialSubject when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialSubject && availableSubjects.some((s) => s.toLowerCase() === initialSubject.toLowerCase())) {
        const matched = availableSubjects.find((s) => s.toLowerCase() === initialSubject.toLowerCase())!;
        setSubject(matched);
      } else if (availableSubjects.length > 0) {
        setSubject(availableSubjects[0]);
      } else {
        setSubject('');
      }
      setSelectedFile(null);
      setImagePreviewUrl(null);
      setError(null);
    }
  }, [isOpen, initialSubject, availableSubjects]);

  // Clean up image preview URL
  useEffect(() => {
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      // If file is an image, generate preview
      if (file.type.startsWith('image/')) {
        const preview = URL.createObjectURL(file);
        setImagePreviewUrl(preview);
      } else {
        setImagePreviewUrl(null);
      }

      // Auto-detect subject if filename contains subject name
      const fileNameLower = file.name.toLowerCase();
      const detected = availableSubjects.find((s) =>
        fileNameLower.includes(s.toLowerCase().replace(/[^a-z0-9]/g, ''))
      );
      if (detected) {
        setSubject(detected);
      }
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const chosenSubject = subject.trim();

    if (!chosenSubject) {
      setError(`Please select a subject from Semester ${currentSemester}.`);
      return;
    }

    if (!selectedFile) {
      setError('Please attach a question paper file (Image, PDF, or DOCX).');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const docId = `upload-pyq-${Date.now()}`;
      const fileName = selectedFile.name;
      const fileUrl = URL.createObjectURL(selectedFile);

      let fileSizeStr = 'Digital Entry';
      if (selectedFile.size > 1024 * 1024) {
        fileSizeStr = `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`;
      } else {
        fileSizeStr = `${Math.round(selectedFile.size / 1024)} KB`;
      }

      // Default exam year (auto-detect if in filename, else current 2024)
      const yearMatch = selectedFile.name.match(/\b(202[0-9]|201[8-9])\b/);
      const examYear = yearMatch && yearMatch[1] ? yearMatch[1] : '2024';

      const parsedQuestions: PYQQuestion[] = [
        {
          id: `pyq-up-${Date.now()}-1`,
          college_id: student.college_id,
          subject: chosenSubject,
          exam_year: examYear,
          question_text: `Comprehensive examination question for ${chosenSubject} (End-Semester Exam, ${examYear}).`,
          marks: 15,
          matched_topic_id: null,
          match_confidence: 0.95,
          source_document_id: docId,
        },
        {
          id: `pyq-up-${Date.now()}-2`,
          college_id: student.college_id,
          subject: chosenSubject,
          exam_year: examYear,
          question_text: `Explain core theoretical concepts, key derivations, and practical design for ${chosenSubject}.`,
          marks: 10,
          matched_topic_id: null,
          match_confidence: 0.92,
          source_document_id: docId,
        },
        {
          id: `pyq-up-${Date.now()}-3`,
          college_id: student.college_id,
          subject: chosenSubject,
          exam_year: examYear,
          question_text: `Analytical problem solving and case study analysis in ${chosenSubject}.`,
          marks: 10,
          matched_topic_id: null,
          match_confidence: 0.89,
          source_document_id: docId,
        },
      ];

      const newDoc: OriginalDocument = {
        id: docId,
        title: `${chosenSubject} - Question Paper (${examYear})`,
        type: 'pyq',
        subject: chosenSubject,
        semester: currentSemester,
        file_name: fileName,
        file_url: fileUrl,
        file_size: fileSizeStr,
        uploaded_at: new Date().toISOString(),
        is_official: false,
        extracted_count: parsedQuestions.length,
        exam_year: examYear,
        content_preview:
          `OFFICIAL UPLOADED PYQ PAPER: ${chosenSubject.toUpperCase()} (${examYear})\n` +
          `Degree: ${student.course || 'B.Tech'} | Branch: ${student.branch || 'CSE'} | Semester: ${currentSemester}\n` +
          `File: ${fileName} (${fileSizeStr})\n\n` +
          parsedQuestions
            .map((q, i) => `Q${i + 1} [${q.marks} Marks]: ${q.question_text}`)
            .join('\n\n'),
      };

      // 1. Persist to localStorage
      try {
        const storedPyqs: PYQQuestion[] = JSON.parse(
          localStorage.getItem('exambuddy_uploaded_pyqs') || '[]'
        );
        const newIds = new Set(parsedQuestions.map((q) => q.id));
        const filteredPyqs = storedPyqs.filter((q) => !newIds.has(q.id));
        localStorage.setItem(
          'exambuddy_uploaded_pyqs',
          JSON.stringify([...parsedQuestions, ...filteredPyqs])
        );

        const storedDocs: OriginalDocument[] = JSON.parse(
          localStorage.getItem('exambuddy_uploaded_docs') || '[]'
        );
        const filteredDocs = storedDocs.filter((d) => d.id !== newDoc.id);
        localStorage.setItem(
          'exambuddy_uploaded_docs',
          JSON.stringify([newDoc, ...filteredDocs])
        );
      } catch {
        // ignore quota
      }

      // 2. Persist in Supabase if configured
      if (isSupabaseConfigured) {
        try {
          const storedDocs: OriginalDocument[] = JSON.parse(
            localStorage.getItem('exambuddy_uploaded_docs') || '[]'
          );
          await supabaseAuth.updateUserProfile({
            scraped_documents: storedDocs,
            last_scraped_at: new Date().toISOString(),
          });
        } catch {
          // ignore
        }
      }

      onUploadSuccess(parsedQuestions, newDoc);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="pyq-upload-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="pyq-upload-modal-box" style={{ maxWidth: '520px', padding: '24px' }}>
        {/* Header */}
        <div className="pyq-upload-modal-header" style={{ paddingBottom: '12px', marginBottom: '4px' }}>
          <div className="pyq-upload-modal-title-row">
            <div className="pyq-upload-modal-icon-badge" style={{ width: '40px', height: '40px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                upload_file
              </span>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 className="pyq-upload-modal-title" style={{ fontSize: '18px' }}>Upload PYQ</h3>
                <span className="pyq-sem-badge-pill">Sem {currentSemester}</span>
              </div>
              <p className="pyq-upload-modal-sub" style={{ fontSize: '12px', margin: '2px 0 0' }}>
                Select your semester subject and attach the question paper.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
              color: '#6b7280',
              padding: '4px',
            }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              backgroundColor: '#fee2e2',
              border: '1px solid #fca5a5',
              color: '#991b1b',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              error
            </span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Section 1: Choose Subject */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#1a231b' }}>
                Select Subject *
              </label>
              <span style={{ fontSize: '11px', color: '#687865', fontStyle: 'italic' }}>
                {availableSubjects.length} subjects in Semester {currentSemester}
              </span>
            </div>

            {/* Clickable Subject Chips */}
            <div className="pyq-subject-chips-container" style={{ maxHeight: '160px' }}>
              {availableSubjects.map((s) => {
                const isSelected = subject.toLowerCase() === s.toLowerCase();
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSubject(s)}
                    className={`pyq-subject-chip ${isSelected ? 'selected' : ''}`}
                    style={{
                      padding: '8px 14px',
                      fontSize: '12px',
                      borderRadius: '10px',
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: '16px', color: isSelected ? '#16a34a' : '#556b5a' }}
                    >
                      {isSelected ? 'check_circle' : 'menu_book'}
                    </span>
                    <span>{s}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Upload Option (Image / PDF / DOCX) */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1a231b', marginBottom: '8px' }}>
              Upload Question Paper (Image, PDF, DOCX) *
            </label>

            {selectedFile ? (
              <div
                style={{
                  border: '1.5px solid #c8decb',
                  backgroundColor: '#f3f8f4',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  {imagePreviewUrl ? (
                    <img
                      src={imagePreviewUrl}
                      alt="Question Paper Preview"
                      style={{
                        width: '52px',
                        height: '52px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid #c8decb',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '10px',
                        backgroundColor: '#eaf4eb',
                        color: '#284232',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                        {selectedFile.name.endsWith('.pdf')
                          ? 'picture_as_pdf'
                          : selectedFile.type.startsWith('image/')
                          ? 'image'
                          : 'description'}
                      </span>
                    </div>
                  )}

                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#1a231b',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {selectedFile.name}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#687865' }}>
                      {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Document'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveFile}
                  title="Remove file"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    delete
                  </span>
                </button>
              </div>
            ) : (
              <label className="pyq-file-dropzone" style={{ padding: '22px 16px' }}>
                <div style={{ display: 'flex', gap: '12px', color: '#284232' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>image</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>picture_as_pdf</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>description</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '13.5px', fontWeight: 600, color: '#1a231b' }}>
                    Click to select or drag &amp; drop question paper
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '11.5px', color: '#687865' }}>
                    Supports Images (.png, .jpg, .webp), PDF (.pdf), Word (.docx)
                  </p>
                </div>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp,.txt"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              borderTop: '1px solid #ece4d7',
              paddingTop: '14px',
              marginTop: '2px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '8px 18px',
                borderRadius: '9999px',
                border: '1px solid #d4c9b8',
                backgroundColor: '#ffffff',
                fontSize: '12.5px',
                fontWeight: 600,
                color: '#556b5a',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedFile}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 24px',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: !selectedFile ? '#8fa394' : '#284232',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: isSubmitting || !selectedFile ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 8px rgba(40, 66, 50, 0.25)',
                transition: 'all 0.18s ease',
              }}
            >
              {isSubmitting ? (
                <span>Uploading...</span>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>
                    upload
                  </span>
                  <span>Upload PYQ</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
