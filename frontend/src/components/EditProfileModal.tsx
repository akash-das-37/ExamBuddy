import React, { useState } from 'react';
import type { Student } from '../types';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  onSave: (updated: Partial<Student>) => Promise<void>;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  student,
  onSave,
}) => {
  const [name, setName] = useState(student.name || '');
  const [course, setCourse] = useState(student.course || 'B.Tech');
  const [branch, setBranch] = useState(student.branch || 'CSE');
  const [semester, setSemester] = useState(String(student.semester || '3'));
  const [collegeUrl, setCollegeUrl] = useState(student.college_url || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        name,
        course,
        branch: branch.toUpperCase(),
        semester: parseInt(semester),
        college_url: collegeUrl,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) onClose();
      }}
    >
      <div className="relative w-full max-w-md bg-[#0d121f] border border-white/15 rounded-2xl shadow-2xl p-6 text-slate-100 animate-scale-in space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-indigo-400 text-[22px]">manage_accounts</span>
            <h3 className="text-base font-bold text-white">Edit Academic Profile</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-left text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-[#080b13] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Course / Degree</label>
              <input
                type="text"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full bg-[#080b13] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Branch</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value.toUpperCase())}
                className="w-full bg-[#080b13] border border-white/15 rounded-xl px-3 py-2 text-white uppercase font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Current Semester</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full bg-[#080b13] border border-white/15 rounded-xl px-3 py-2 text-white cursor-pointer font-bold focus:outline-none focus:border-indigo-500"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={String(s)} className="bg-[#0d121f]">
                  Semester {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">College Portal URL</label>
            <input
              type="url"
              value={collegeUrl}
              onChange={(e) => setCollegeUrl(e.target.value)}
              placeholder="e.g. gnit.ac.in"
              className="w-full bg-[#080b13] border border-white/15 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
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
              disabled={isSaving}
              className="btn-primary py-2 px-4 text-xs font-semibold"
            >
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
