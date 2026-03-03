// src/lib/theme.ts
// EX Venture Engineering dark brand theme
// Colors: dark background with green, purple, and cyan accents

export const theme = {
  // Backgrounds
  bg: '#0d1117',
  bgSurface: '#161b22',
  bgSurfaceHover: '#1c2333',
  bgElevated: '#21262d',
  bgInput: '#0d1117',

  // Borders
  border: '#30363d',
  borderLight: '#21262d',

  // Text
  text: '#e6edf3',
  textSecondary: '#8b949e',
  textMuted: '#6e7681',

  // Brand accents
  green: '#10b981',
  greenHover: '#059669',
  greenBg: '#064e3b',

  purple: '#a855f7',
  purpleHover: '#9333ea',
  purpleBg: '#3b0764',

  cyan: '#06b6d4',
  cyanHover: '#0891b2',
  cyanBg: '#083344',

  // Navigation
  navBg: '#010409',
  navActive: '#161b22',

  // Semantic
  error: '#f85149',
  errorBg: '#490202',
  warning: '#d29922',
  warningBg: '#3d2e00',
  success: '#3fb950',
  successBg: '#0d3117',
  info: '#58a6ff',
  infoBg: '#0c2d6b',

  // Status colors
  status: {
    backlog: { bg: '#21262d', text: '#8b949e' },
    in_progress: { bg: '#0c2d6b', text: '#58a6ff' },
    blocked: { bg: '#490202', text: '#f85149' },
    done: { bg: '#0d3117', text: '#3fb950' },
  },

  // Status badge colors (solid for TaskCard)
  statusSolid: {
    backlog: '#6e7681',
    in_progress: '#58a6ff',
    blocked: '#f85149',
    done: '#3fb950',
  },
} as const
