// ─── D&D themed color palette ───────────────────────────────

const tintColorLight = "#7C3AED"; // purple
const tintColorDark = "#A78BFA";  // lighter purple

export default {
  light: {
    text: "#1F2937",
    secondaryText: "#6B7280",
    background: "#F9FAFB",
    card: "#FFFFFF",
    tint: tintColorLight,
    tabIconDefault: "#9CA3AF",
    tabIconSelected: tintColorLight,
    border: "#E5E7EB",
    danger: "#EF4444",
    success: "#10B981",
    inputBg: "#F3F4F6",
  },
  dark: {
    text: "#F9FAFB",
    secondaryText: "#9CA3AF",
    background: "#0F172A",
    card: "#1E293B",
    tint: tintColorDark,
    tabIconDefault: "#6B7280",
    tabIconSelected: tintColorDark,
    border: "#334155",
    danger: "#F87171",
    success: "#34D399",
    inputBg: "#1E293B",
  },
};
