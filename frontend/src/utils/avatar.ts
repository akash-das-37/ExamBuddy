import type { Student } from '../types';

// Curated palette of sophisticated, editorial botanical colors for deterministic student avatars
const AVATAR_PALETTES = [
  { bg: '#284232', fg: '#ffffff', border: '#3e654c', accent: '#78a287' }, // Deep Forest / Sage
  { bg: '#8c4323', fg: '#ffffff', border: '#b85d34', accent: '#e89c7d' }, // Warm Terracotta
  { bg: '#1e3a5f', fg: '#ffffff', border: '#2f5b8c', accent: '#7daee8' }, // Oxford Indigo
  { bg: '#5c2d58', fg: '#ffffff', border: '#7f407a', accent: '#cc8ec8' }, // Mulberry Wine
  { bg: '#1c4d4f', fg: '#ffffff', border: '#2a7275', accent: '#6ec2c5' }, // Nordic Teal
  { bg: '#7a5214', fg: '#ffffff', border: '#a87320', accent: '#e8b868' }, // Amber Ochre
  { bg: '#474c22', fg: '#ffffff', border: '#687034', accent: '#a6b05d' }, // Olive Bronze
  { bg: '#312e4a', fg: '#ffffff', border: '#4c476f', accent: '#9d98ca' }, // Twilight Violet
];

/**
 * Deterministically pick a color palette based on string seed (name or email)
 */
function getPaletteForSeed(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

/**
 * Extract 1 to 2 uppercase initials from a user's name or email
 */
export function getStudentInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (email && email.trim()) {
    const clean = email.split('@')[0].replace(/[^a-zA-Z]/g, '');
    return (clean.slice(0, 2) || 'EX').toUpperCase();
  }
  return 'EB';
}

/**
 * Generates an authentic, crisp SVG data URL with the student's unique initials & palette
 */
export function generateInitialsAvatarSvg(name?: string | null, email?: string | null): string {
  const seed = (name || email || 'ExamBuddy Student').trim().toLowerCase();
  const initials = getStudentInitials(name, email);
  const palette = getPaletteForSeed(seed);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${palette.bg}" />
        <stop offset="100%" stop-color="${palette.border}" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="50" fill="url(#grad)" />
    <!-- Subtle Inner Accent Ring -->
    <circle cx="50" cy="50" r="46" fill="none" stroke="${palette.accent}" stroke-width="1.8" stroke-opacity="0.35" />
    <!-- Monogram Initials -->
    <text x="50" y="54" 
      font-family="Playfair Display, Georgia, serif" 
      font-size="34" 
      font-weight="700" 
      fill="${palette.fg}" 
      text-anchor="middle" 
      dominant-baseline="middle" 
      letter-spacing="0.5">
      ${initials}
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Returns the effective avatar URL for a student:
 * 1. Custom uploaded photo / chosen preset avatar in student.avatar_url
 * 2. User-scoped avatar saved in localStorage (exambuddy_avatar_{id/email})
 * 3. Fallback to dynamically generated personal monogram SVG (never the same boy icon for everyone!)
 */
export function getStudentAvatarUrl(student?: Partial<Student> | null): string {
  if (!student) {
    return generateInitialsAvatarSvg('Student', 'student@exambuddy.edu');
  }

  // 1. Direct avatar_url from student object
  if (student.avatar_url && student.avatar_url.trim()) {
    return student.avatar_url;
  }

  // 2. User-scoped avatar in localStorage
  const userKey = student.email ? `exambuddy_avatar_${student.email.toLowerCase().trim()}` : '';
  if (userKey) {
    const scoped = localStorage.getItem(userKey);
    if (scoped && scoped.trim()) return scoped;
  }

  if (student.id) {
    const idScoped = localStorage.getItem(`exambuddy_avatar_${student.id}`);
    if (idScoped && idScoped.trim()) return idScoped;
  }

  // 3. Fallback: Generate unique monogram initials avatar tailored specifically to this user
  return generateInitialsAvatarSvg(student.name, student.email);
}
