"use client";

import { memo } from "react";
import { useTheme } from "@/app/lib/ThemeContext";

export default memo(function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      data-cursor="pointer"
      style={{
        background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: 6,
        width: 26, height: 26, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
        boxShadow: "1px 1px 0 var(--shadow)",
        transition: "background 0.3s, color 0.3s, border-color 0.3s",
      }}
      title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      {theme === "light" ? "D" : "L"}
    </button>
  );
});
