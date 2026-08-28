"use client";

import { useTheme } from "@/app/lib/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      data-cursor="pointer"
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translate(-1px,-1px)"; e.currentTarget.style.boxShadow = "3px 3px 0 var(--shadow)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translate(0,0)"; e.currentTarget.style.boxShadow = "2px 2px 0 var(--shadow)"; }}
      style={{
        background: "var(--bg-card)", border: "2px solid var(--border)", borderRadius: 8,
        width: 28, height: 28, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 700, color: "var(--text)",
        boxShadow: "2px 2px 0 var(--shadow)",
        transition: "transform 0.15s, box-shadow 0.15s, background 0.3s, color 0.3s",
      }}
      title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      {theme === "light" ? "D" : "L"}
    </button>
  );
}
