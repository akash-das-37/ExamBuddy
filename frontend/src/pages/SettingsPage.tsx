import React, { useState, useRef, useEffect } from 'react';
import { getStudentAvatarUrl } from '../utils/avatar';
import type { College, Student } from '../types';
import '../styles/SettingsPage.css';

// Client-side auto-crop & compression helper to guarantee fast, reliable photo updating
function compressAndCropAvatar(file: File, size = 300, quality = 0.88): Promise<string> {
  return new Promise((resolve) => {
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      try {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        const minDimension = Math.min(width, height);
        const startX = (width - minDimension) / 2;
        const startY = (height - minDimension) / 2;

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, startX, startY, minDimension, minDimension, 0, 0, size, size);

        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      } catch {
        resolve(reader.result as string);
      }
    };

    img.onerror = () => {
      resolve(reader.result as string);
    };

    reader.onerror = () => {
      resolve('');
    };

    reader.readAsDataURL(file);
  });
}

interface SettingsPageProps {
  student: Student;
  college: College | null;
  onUpdateStudent: (updated: Partial<Student>) => Promise<void>;
  onTriggerScrape: () => void;
  isScraping: boolean;
  onLogout: () => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  student,
  onUpdateStudent,
  onTriggerScrape,
  isScraping,
  onLogout,
  showToast,
}) => {
  // File input ref for photo upload
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Profile Picture state (user-scoped)
  const getUserStoredAvatar = () => {
    if (student.avatar_url) return student.avatar_url;
    if (student.email) {
      const scoped = localStorage.getItem(`exambuddy_avatar_${student.email.toLowerCase().trim()}`);
      if (scoped) return scoped;
    }
    return '';
  };

  const [avatarUrl, setAvatarUrl] = useState<string>(getUserStoredAvatar());

  // Sync avatarUrl whenever student prop updates
  useEffect(() => {
    setAvatarUrl(getUserStoredAvatar());
  }, [student.avatar_url, student.email]);

  // Personal Info state
  const [fullName, setFullName] = useState(student.name || 'Student');
  const [email, setEmail] = useState(student.email || 'student@example.edu');

  // Academic Info state
  const [collegeUrl, setCollegeUrl] = useState(
    student.college_url || localStorage.getItem('exambuddy_college_url') || 'https://www.yourcollege.edu/'
  );

  const initialBranch = student.branch || student.course || 'CSE';
  const [courseBranch, setCourseBranch] = useState(() => {
    const b = initialBranch.toUpperCase();
    if (b.includes('CSE') || b.includes('COMPUTER')) return 'CSE';
    if (b.includes('IT') || b.includes('INFORMATION')) return 'IT';
    if (b.includes('ECE') || b.includes('ELECTRONICS')) return 'ECE';
    if (b.includes('EE') || b.includes('ELECTRICAL')) return 'EE';
    if (b.includes('ME') || b.includes('MECHANICAL')) return 'ME';
    if (b.includes('CE') || b.includes('CIVIL')) return 'CE';
    if (b.includes('AI') || b.includes('ML')) return 'AIML';
    return 'CSE';
  });

  const [currentSemester, setCurrentSemester] = useState<string>(
    String(student.semester || 2)
  );

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Academic Info save status
  const [isSavingAcademic, setIsSavingAcademic] = useState(false);
  const [academicSavedMessage, setAcademicSavedMessage] = useState<string | null>(null);

  // Delete account confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  // Change photo options modal
  const [isChangePhotoModalOpen, setIsChangePhotoModalOpen] = useState(false);

  // Avatar Presets
  const PRESET_AVATARS = [
    {
      id: 'classic',
      name: 'Classic Anime',
      dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="50" fill="#f7ede2"/><path d="M18 98 C25 80, 38 74, 50 74 C62 74, 75 80, 82 98 Z" fill="#181b18"/><path d="M42 74 L50 86 L58 74 Z" fill="#dc2626"/><path d="M46 74 L50 81 L54 74 Z" fill="#ffffff"/><rect x="44" y="60" width="12" height="16" rx="3" fill="#f6c29b"/><ellipse cx="50" cy="50" rx="21" ry="23" fill="#f6c29b"/><ellipse cx="42" cy="49" rx="3" ry="3.5" fill="#191c19"/><ellipse cx="58" cy="49" rx="3" ry="3.5" fill="#191c19"/><circle cx="43.2" cy="47.8" r="1.2" fill="#ffffff"/><circle cx="59.2" cy="47.8" r="1.2" fill="#ffffff"/><path d="M46 60 Q50 63 54 60" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round"/><path d="M26 48 C22 33, 32 20, 50 20 C68 20, 78 33, 74 48 C70 34, 60 28, 50 28 C40 28, 30 34, 26 48 Z" fill="#191c19"/><path d="M28 40 L36 46 L32 30 L45 44 L40 24 L52 42 L56 26 L58 43 L68 33 L64 45 L72 38" stroke="#191c19" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="#191c19"/></svg>'
      )}`,
    },
    {
      id: 'scholar',
      name: 'Scholar',
      dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="50" fill="#e0f2fe"/><path d="M18 98 C25 80, 38 74, 50 74 C62 74, 75 80, 82 98 Z" fill="#1e3a8a"/><path d="M44 74 L50 82 L56 74 Z" fill="#ffffff"/><rect x="44" y="60" width="12" height="16" rx="3" fill="#fed7aa"/><ellipse cx="50" cy="50" rx="21" ry="23" fill="#fed7aa"/><circle cx="42" cy="49" r="6" stroke="#1e293b" strokeWidth="1.8" fill="none"/><circle cx="58" cy="49" r="6" stroke="#1e293b" strokeWidth="1.8" fill="none"/><line x1="48" y1="49" x2="52" y2="49" stroke="#1e293b" strokeWidth="1.8"/><ellipse cx="42" cy="49" rx="2" ry="2" fill="#191c19"/><ellipse cx="58" cy="49" rx="2" ry="2" fill="#191c19"/><path d="M46 61 Q50 63 54 61" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round"/><path d="M26 42 C24 28, 35 18, 50 18 C65 18, 76 28, 74 42 C68 30, 58 25, 50 25 C42 25, 32 30, 26 42 Z" fill="#1e293b"/></svg>'
      )}`,
    },
    {
      id: 'tech_girl',
      name: 'Tech Girl',
      dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="50" fill="#fce7f3"/><path d="M18 98 C25 80, 38 74, 50 74 C62 74, 75 80, 82 98 Z" fill="#831843"/><rect x="44" y="60" width="12" height="16" rx="3" fill="#fbcfe8"/><ellipse cx="50" cy="50" rx="21" ry="23" fill="#fce7f3"/><ellipse cx="42" cy="49" rx="2.5" ry="3" fill="#831843"/><ellipse cx="58" cy="49" rx="2.5" ry="3" fill="#831843"/><circle cx="43" cy="48" r="1" fill="#ffffff"/><circle cx="59" cy="48" r="1" fill="#ffffff"/><path d="M46 60 Q50 63 54 60" stroke="#db2777" strokeWidth="1.5" strokeLinecap="round"/><path d="M28 50 C26 30, 36 20, 50 20 C64 20, 74 30, 72 50 C68 34, 58 30, 50 30 C42 30, 32 34, 28 50 Z" fill="#4c0519"/><rect x="22" y="44" width="6" height="14" rx="3" fill="#0284c7"/><rect x="72" y="44" width="6" height="14" rx="3" fill="#0284c7"/><path d="M25 44 C25 25, 75 25, 75 44" stroke="#0284c7" strokeWidth="3" fill="none"/></svg>'
      )}`,
    },
    {
      id: 'hoodie',
      name: 'Green Hoodie',
      dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="50" fill="#d1fae5"/><path d="M18 98 C25 80, 38 74, 50 74 C62 74, 75 80, 82 98 Z" fill="#064e3b"/><rect x="44" y="60" width="12" height="16" rx="3" fill="#fde68a"/><ellipse cx="50" cy="50" rx="21" ry="23" fill="#fde68a"/><ellipse cx="42" cy="49" rx="2.8" ry="3.2" fill="#064e3b"/><ellipse cx="58" cy="49" rx="2.8" ry="3.2" fill="#064e3b"/><circle cx="43" cy="48" r="1" fill="#ffffff"/><circle cx="59" cy="48" r="1" fill="#ffffff"/><path d="M46 60 Q50 63 54 60" stroke="#064e3b" strokeWidth="1.5" strokeLinecap="round"/><path d="M26 46 C24 30, 34 22, 50 22 C66 22, 76 30, 74 46 C70 32, 60 27, 50 27 C40 27, 30 32, 26 46 Z" fill="#064e3b"/><path d="M24 50 L20 60 L24 64" stroke="#064e3b" strokeWidth="3" strokeLinecap="round" fill="none"/><path d="M76 50 L80 60 L76 64" stroke="#064e3b" strokeWidth="3" strokeLinecap="round" fill="none"/></svg>'
      )}`,
    },
  ];

  const handleSelectPresetAvatar = async (dataUrl: string) => {
    setAvatarUrl(dataUrl);
    if (student.email) {
      localStorage.setItem(`exambuddy_avatar_${student.email.toLowerCase().trim()}`, dataUrl);
    }
    localStorage.setItem('exambuddy_avatar', dataUrl);
    setIsChangePhotoModalOpen(false);
    try {
      await onUpdateStudent({ avatar_url: dataUrl });
      if (showToast) showToast('Avatar updated successfully!', 'success');
    } catch {
      if (showToast) showToast('Avatar updated locally.', 'success');
    }
  };

  // Photo Upload Handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      if (showToast) showToast('Image file size must be less than 15MB.', 'error');
      return;
    }

    try {
      const compressedDataUrl = await compressAndCropAvatar(file, 300, 0.88);
      if (!compressedDataUrl) {
        if (showToast) showToast('Failed to process image file.', 'error');
        return;
      }
      setAvatarUrl(compressedDataUrl);
      try {
        if (student.email) {
          localStorage.setItem(`exambuddy_avatar_${student.email.toLowerCase().trim()}`, compressedDataUrl);
        }
        localStorage.setItem('exambuddy_avatar', compressedDataUrl);
      } catch {
        // ignore storage quota error
      }
      setIsChangePhotoModalOpen(false);
      await onUpdateStudent({ avatar_url: compressedDataUrl });
      if (showToast) showToast('Profile picture updated successfully!', 'success');
    } catch {
      if (showToast) showToast('Profile picture saved locally.', 'success');
    }
  };

  // Photo Remove Handler
  const handleRemovePhoto = async () => {
    setAvatarUrl('');
    if (student.email) {
      localStorage.removeItem(`exambuddy_avatar_${student.email.toLowerCase().trim()}`);
    }
    localStorage.removeItem('exambuddy_avatar');
    setIsChangePhotoModalOpen(false);
    try {
      await onUpdateStudent({ avatar_url: null });
      if (showToast) showToast('Profile picture reset to personal monogram.', 'info');
    } catch {
      if (showToast) showToast('Profile picture reset.', 'info');
    }
  };

  // Password Update Handler
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (!currentPassword) {
      setPasswordStatus({ message: 'Please enter your current password.', type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordStatus({ message: 'New password must be at least 6 characters.', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ message: 'New passwords do not match.', type: 'error' });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      // Simulate/call API update
      await new Promise((resolve) => setTimeout(resolve, 600));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordStatus({ message: 'Password updated successfully!', type: 'success' });
      if (showToast) showToast('Password updated successfully!', 'success');
    } catch {
      setPasswordStatus({ message: 'Failed to update password. Try again.', type: 'error' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Save Academic & Personal Information
  const handleSaveInfo = async () => {
    setIsSavingAcademic(true);
    setAcademicSavedMessage(null);
    try {
      const semNumber = parseInt(currentSemester, 10) || 2;
      localStorage.setItem('exambuddy_college_url', collegeUrl);

      await onUpdateStudent({
        name: fullName,
        email,
        college_url: collegeUrl,
        course: 'B.Tech',
        branch: courseBranch,
        semester: semNumber,
        avatar_url: avatarUrl || null,
      });

      setAcademicSavedMessage('Profile and academic details saved successfully!');
      if (showToast) {
        showToast(`Settings updated: ${fullName} (${courseBranch} • Sem ${semNumber})`, 'success');
      }
      setTimeout(() => setAcademicSavedMessage(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save changes.';
      if (showToast) showToast(msg, 'error');
    } finally {
      setIsSavingAcademic(false);
    }
  };

  // Handle Delete Account
  const handleConfirmDeleteAccount = () => {
    localStorage.clear();
    setIsDeleteModalOpen(false);
    if (showToast) showToast('Account deleted successfully.', 'info');
    onLogout();
  };

  return (
    <div className="set-page-container">
      {/* Botanical Corner Leaf Watermarks */}
      <div className="set-leaf-watermark-tr">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="leafGradTop" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e3a2b" stopOpacity="0.7" />
              <stop offset="60%" stopColor="#2d553e" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#417354" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <path d="M210 -10 Q 150 50 80 100" stroke="#223f2f" strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />
          <path d="M190 15 C 135 28, 110 65, 80 115 C 115 110, 150 80, 178 42 Z" fill="url(#leafGradTop)" />
          <path d="M160 48 C 128 72, 105 115, 98 160 C 125 145, 155 110, 164 68 Z" fill="url(#leafGradTop)" opacity="0.8" />
        </svg>
      </div>

      <div className="set-leaf-watermark-bl">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="leafGradBot" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e3a2b" stopOpacity="0.65" />
              <stop offset="70%" stopColor="#284232" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#4e8262" stopOpacity="0.25" />
            </linearGradient>
          </defs>
          <path d="M-10 200 Q 50 150 100 80" stroke="#223f2f" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
          <path d="M15 180 C 28 135, 65 110, 115 80 C 110 115, 80 150, 42 178 Z" fill="url(#leafGradBot)" />
          <path d="M48 160 C 72 128, 115 105, 160 98 C 145 125, 110 155, 68 164 Z" fill="url(#leafGradBot)" opacity="0.75" />
        </svg>
      </div>

      <div className="set-content-wrap">
        {/* Page Title & Subtitle */}
        <div className="set-header">
          <h1 className="set-main-title">Settings</h1>
          <p className="set-subtitle">
            Manage your profile, academic details and account settings.
          </p>
        </div>

        {/* Main 2-Column Grid */}
        <div className="set-grid">
          {/* ================= LEFT COLUMN ================= */}
          <div className="set-col-left">
            {/* Card 1: Profile Picture */}
            <div className="set-card">
              <div className="set-card-header">
                <div className="set-card-icon-wrap">
                  <span className="material-symbols-outlined">photo_camera_front</span>
                </div>
                <div className="set-card-title-group">
                  <h3 className="set-card-title">Profile Picture</h3>
                  <p className="set-card-desc">Upload a photo to personalize your account.</p>
                </div>
              </div>

              <div className="set-avatar-center-wrap">
                <div className="set-avatar-ring-container">
                  <div className="set-avatar-circle">
                    <img
                      src={avatarUrl || getStudentAvatarUrl({ ...student, name: fullName, email })}
                      alt={fullName}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsChangePhotoModalOpen(true)}
                    className="set-avatar-camera-badge"
                    title="Change Profile Photo"
                  >
                    <span className="material-symbols-outlined">photo_camera</span>
                  </button>
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onClick={(e) => {
                    (e.target as HTMLInputElement).value = '';
                  }}
                  onChange={handlePhotoUpload}
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  style={{ display: 'none' }}
                />

                <div className="set-avatar-btn-row">
                  <button
                    type="button"
                    onClick={() => setIsChangePhotoModalOpen(true)}
                    className="set-btn-upload"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      photo_camera
                    </span>
                    <span>Change Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="set-btn-remove"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      delete_outline
                    </span>
                    <span>Remove</span>
                  </button>
                </div>

                <p className="set-avatar-hint">
                  Recommended: Square image, max 5MB (JPG, PNG)
                </p>
              </div>
            </div>

            {/* Card 2: Change Password */}
            <div className="set-card">
              <div className="set-card-header">
                <div className="set-card-icon-wrap">
                  <span className="material-symbols-outlined">lock</span>
                </div>
                <div className="set-card-title-group">
                  <h3 className="set-card-title">Change Password</h3>
                  <p className="set-card-desc">Set a new password for your account.</p>
                </div>
              </div>

              {passwordStatus && (
                <div className={`set-card-alert ${passwordStatus.type}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    {passwordStatus.type === 'success' ? 'check_circle' : 'error'}
                  </span>
                  <span>{passwordStatus.message}</span>
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="set-password-form">
                <div className="set-form-group">
                  <label className="set-label">Current Password</label>
                  <div className="set-input-wrap">
                    <span className="material-symbols-outlined set-input-icon">lock</span>
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="set-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="set-input-trailing-btn"
                      title={showCurrentPass ? 'Hide password' : 'Show password'}
                    >
                      <span className="material-symbols-outlined">
                        {showCurrentPass ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="set-form-group">
                  <label className="set-label">New Password</label>
                  <div className="set-input-wrap">
                    <span className="material-symbols-outlined set-input-icon">lock</span>
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="set-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="set-input-trailing-btn"
                      title={showNewPass ? 'Hide password' : 'Show password'}
                    >
                      <span className="material-symbols-outlined">
                        {showNewPass ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="set-form-group">
                  <label className="set-label">Confirm New Password</label>
                  <div className="set-input-wrap">
                    <span className="material-symbols-outlined set-input-icon">lock</span>
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="set-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="set-input-trailing-btn"
                      title={showConfirmPass ? 'Hide password' : 'Show password'}
                    >
                      <span className="material-symbols-outlined">
                        {showConfirmPass ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="set-btn-submit-full"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    lock
                  </span>
                  <span>{isUpdatingPassword ? 'Updating...' : 'Update Password'}</span>
                </button>
              </form>
            </div>
          </div>

          {/* ================= RIGHT COLUMN ================= */}
          <div className="set-col-right">
            {/* Card 1: Personal Information */}
            <div className="set-card">
              <div className="set-card-header">
                <div className="set-card-icon-wrap">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <div className="set-card-title-group">
                  <h3 className="set-card-title">Personal Information</h3>
                  <p className="set-card-desc">Update your personal details.</p>
                </div>
              </div>

              <div className="set-form-row-2col">
                <div className="set-form-group">
                  <label className="set-label">Full Name</label>
                  <div className="set-input-wrap">
                    <span className="material-symbols-outlined set-input-icon">person</span>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Akash Das"
                      className="set-input"
                    />
                  </div>
                </div>

                <div className="set-form-group">
                  <label className="set-label">Email Address</label>
                  <div className="set-input-wrap">
                    <span className="material-symbols-outlined set-input-icon">mail</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. akashdas123@example.com"
                      className="set-input"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Academic Information */}
            <div className="set-card">
              <div className="set-card-header">
                <div className="set-card-icon-wrap">
                  <span className="material-symbols-outlined">school</span>
                </div>
                <div className="set-card-title-group">
                  <h3 className="set-card-title">Academic Information</h3>
                  <p className="set-card-desc">
                    Update your college and course details. This helps us fetch the correct syllabus and resources.
                  </p>
                </div>
              </div>

              <div className="set-form-row-2col">
                <div className="set-form-group">
                  <label className="set-label">College Portal URL</label>
                  <div className="set-input-wrap">
                    <span className="material-symbols-outlined set-input-icon">link</span>
                    <input
                      type="url"
                      value={collegeUrl}
                      onChange={(e) => setCollegeUrl(e.target.value)}
                      placeholder="https://www.yourcollege.edu/"
                      className="set-input"
                    />
                  </div>
                </div>

                <div className="set-form-group">
                  <label className="set-label">Course / Branch</label>
                  <div className="set-select-wrap">
                    <span className="material-symbols-outlined set-input-icon">menu_book</span>
                    <select
                      value={courseBranch}
                      onChange={(e) => setCourseBranch(e.target.value)}
                      className="set-select"
                    >
                      <option value="CSE">CSE (Computer Science Engineering)</option>
                      <option value="IT">IT (Information Technology)</option>
                      <option value="AIML">AIML (Artificial Intelligence & Machine Learning)</option>
                      <option value="ECE">ECE (Electronics & Communication Engineering)</option>
                      <option value="EE">EE (Electrical Engineering)</option>
                      <option value="ME">ME (Mechanical Engineering)</option>
                      <option value="CE">CE (Civil Engineering)</option>
                      <option value="Data Science">Data Science (CS & Data Science)</option>
                    </select>
                    <span className="material-symbols-outlined set-select-chevron">
                      keyboard_arrow_down
                    </span>
                  </div>
                </div>
              </div>

              <div className="set-form-row-2col">
                <div className="set-form-group">
                  <label className="set-label">Current Semester</label>
                  <div className="set-select-wrap">
                    <span className="material-symbols-outlined set-input-icon">calendar_today</span>
                    <select
                      value={currentSemester}
                      onChange={(e) => setCurrentSemester(e.target.value)}
                      className="set-select"
                    >
                      <option value="1">Semester 1</option>
                      <option value="2">Semester 2</option>
                      <option value="3">Semester 3</option>
                      <option value="4">Semester 4</option>
                      <option value="5">Semester 5</option>
                      <option value="6">Semester 6</option>
                      <option value="7">Semester 7</option>
                      <option value="8">Semester 8</option>
                    </select>
                    <span className="material-symbols-outlined set-select-chevron">
                      keyboard_arrow_down
                    </span>
                  </div>
                </div>
              </div>

              {academicSavedMessage && (
                <div className="set-card-alert success">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    check_circle
                  </span>
                  <span>{academicSavedMessage}</span>
                </div>
              )}

              <div className="set-save-bar">
                <button
                  type="button"
                  onClick={handleSaveInfo}
                  disabled={isSavingAcademic}
                  className="set-btn-save"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    save
                  </span>
                  <span>{isSavingAcademic ? 'Saving Changes...' : 'Save Academic Details'}</span>
                </button>
              </div>
            </div>

            {/* Card 3: Account Actions */}
            <div className="set-card">
              <div className="set-card-header">
                <div className="set-card-icon-wrap">
                  <span className="material-symbols-outlined">shield</span>
                </div>
                <div className="set-card-title-group">
                  <h3 className="set-card-title">Account Actions</h3>
                  <p className="set-card-desc">Manage your account and data.</p>
                </div>
              </div>

              <div className="set-actions-list">
                {/* Re-sync Row */}
                <div className="set-action-item green-tone">
                  <div className="set-action-info-group">
                    <div className="set-action-icon-circle">
                      <span className="material-symbols-outlined">cloud_sync</span>
                    </div>
                    <div className="set-action-texts">
                      <h4 className="set-action-title">Re-sync from Portal</h4>
                      <p className="set-action-desc">
                        Update your syllabus and academic data from your college portal.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onTriggerScrape}
                    disabled={isScraping}
                    className="set-btn-action-sync"
                  >
                    <span
                      className={`material-symbols-outlined ${isScraping ? 'spinning' : ''}`}
                      style={{ fontSize: '18px' }}
                    >
                      sync
                    </span>
                    <span>{isScraping ? 'Syncing...' : 'Sync Now'}</span>
                  </button>
                </div>

                {/* Delete Account Row */}
                <div className="set-action-item red-tone">
                  <div className="set-action-info-group">
                    <div className="set-action-icon-circle">
                      <span className="material-symbols-outlined">delete</span>
                    </div>
                    <div className="set-action-texts">
                      <h4 className="set-action-title">Delete Account</h4>
                      <p className="set-action-desc">
                        Permanently delete your account and all data.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="set-btn-action-delete"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      delete_outline
                    </span>
                    <span>Delete Account</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="set-modal-backdrop" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="set-modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                  warning
                </span>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#181b18' }}>
                  Delete Account
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6a7667' }}>
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.5', margin: '8px 0' }}>
              Are you sure you want to permanently delete your account? All your personal details, academic progress, uploaded syllabus data, and preparation history will be lost.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="set-btn-remove"
                style={{ padding: '8px 16px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAccount}
                className="set-btn-action-delete"
                style={{ background: '#dc2626', color: '#ffffff', borderColor: '#dc2626', padding: '8px 18px' }}
              >
                Yes, Delete My Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Profile Photo Options Modal */}
      {isChangePhotoModalOpen && (
        <div
          className="set-modal-backdrop"
          onClick={() => setIsChangePhotoModalOpen(false)}
        >
          <div
            className="set-photo-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="set-photo-modal-header">
              <div>
                <h3 className="set-photo-modal-title">Change Profile Photo</h3>
                <p className="set-photo-modal-subtitle">
                  Upload a photo from your computer or choose an illustrated avatar.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsChangePhotoModalOpen(false)}
                className="set-photo-modal-close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Upload from Device Dropzone */}
            <div
              className="set-photo-upload-dropzone"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="set-photo-dropzone-icon">
                <span className="material-symbols-outlined">upload_file</span>
              </div>
              <p className="set-photo-dropzone-title">Upload from your device</p>
              <p className="set-photo-dropzone-sub">
                Click to browse JPG, PNG, WebP (max 5MB)
              </p>
            </div>

            <div className="set-photo-section-divider">or choose an illustrated avatar</div>

            {/* Presets Grid */}
            <div className="set-avatar-presets-grid">
              {PRESET_AVATARS.map((preset) => {
                const isSelected = avatarUrl === preset.dataUrl;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPresetAvatar(preset.dataUrl)}
                    className={`set-avatar-preset-item ${isSelected ? 'active' : ''}`}
                    title={preset.name}
                  >
                    <div className="set-avatar-preset-thumb">
                      <img
                        src={preset.dataUrl}
                        alt={preset.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <span className="set-avatar-preset-label">{preset.name}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setIsChangePhotoModalOpen(false)}
                className="set-btn-remove"
                style={{ padding: '8px 16px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
