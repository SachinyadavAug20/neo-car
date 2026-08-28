// Centralized color constants for Three.js materials and UI accents
// Three.js cannot use CSS variables, so these serve as single source of truth

export const COLORS = {
  // Core palette
  ink: "#1a1a2e",
  paper: "#fdf6e3",
  paperLight: "#ffffff",

  // Accent
  gold: "#fbbf24",
  goldDark: "#f59e0b",
  purple: "#a78bfa",
  pink: "#f472b6",
  green: "#22c55e",
  cyan: "#67e8f9",

  // Interaction-specific
  celebrate: ["#fbbf24", "#f472b6", "#a78bfa"] as const,

  // Shadows
  shadowDark: "#6b7280",
  shadowBlack: "#000000",

  // Muted grays (for Three.js)
  gray700: "#374151",
  gray500: "#6b7280",
  gray400: "#9ca3af",
  gray300: "#d1d5db",
  gray200: "#e5e7eb",
  gray100: "#f3f4f6",
  stone600: "#78716c",

  // Terminal
  terminalBg: "#0d1117",
  terminalHeader: "#161b22",
  terminalGreen: "#4ade80",
  terminalBlue: "#60a5fa",
  terminalRed: "#f87171",
  terminalMuted: "#8b949e",
  terminalText: "#e6edf3",
} as const;
