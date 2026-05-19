// src/utils/theme.js

export const colors = {
  bg:        "#060910",
  surface:   "#0d1420",
  surfaceHi: "#131d2e",
  border:    "#1e2d45",
  borderHi:  "#2a4fd4",
  primary:   "#2a4fd4",
  primaryHi: "#3d63f5",
  accent:    "#00d4aa",
  accentLo:  "#00d4aa22",
  danger:    "#ff4757",
  warn:      "#ffb830",
  text:      "#e8eaf0",
  textMid:   "#8892a4",
  textLo:    "#4a5568",
};

// Fracture class definitions — match your YOLOv8 class IDs
export const FRACTURE_CLASSES = {
  0: { label: "Hairline Fracture",   color: "#ffb830", icon: "〰️" },
  1: { label: "Comminuted Fracture", color: "#ff4757", icon: "💥" },
  2: { label: "Transverse Fracture", color: "#2a4fd4", icon: "➖" },
  3: { label: "Oblique Fracture",    color: "#a855f7", icon: "↗️" },
  4: { label: "Spiral Fracture",     color: "#00d4aa", icon: "🌀" },
  5: { label: "Greenstick Fracture", color: "#f97316", icon: "🌿" },
  6: { label: "No Fracture",         color: "#22c55e", icon: "✅" },
};

export const fonts = {
  display: "'Syne', sans-serif",
  body:    "'DM Sans', sans-serif",
};

export const card = {
  background:   colors.surface,
  border:       `1px solid ${colors.border}`,
  borderRadius: "16px",
  padding:      "24px",
};

export const btn = {
  primary: {
    background:   colors.primary,
    color:        "#fff",
    border:       "none",
    borderRadius: "10px",
    padding:      "12px 24px",
    fontFamily:   fonts.body,
    fontWeight:   600,
    fontSize:     "15px",
    cursor:       "pointer",
    transition:   "all 0.2s",
  },
  ghost: {
    background:   "transparent",
    color:        colors.textMid,
    border:       `1px solid ${colors.border}`,
    borderRadius: "10px",
    padding:      "12px 24px",
    fontFamily:   fonts.body,
    fontWeight:   500,
    fontSize:     "15px",
    cursor:       "pointer",
    transition:   "all 0.2s",
  },
};
