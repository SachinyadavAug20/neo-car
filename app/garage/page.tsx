"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAppStore, THEMES, type ThemeId } from "../lib/appStore";

const TERMINAL_FONT =
  "var(--font-geist-mono), 'Fira Code', 'JetBrains Mono', monospace";

const THEME_ORDER: ThemeId[] = ["midnight", "vaporwave", "matrix"];

function ThemePreview({ themeId }: { themeId: ThemeId }) {
  const theme = THEMES[themeId];
  return (
    <div className="flex gap-1">
      {[theme.primary, theme.secondary, theme.accent].map((c, i) => (
        <div
          key={i}
          className="h-3 w-3 rounded-full"
          style={{
            backgroundColor: `rgb(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)})`,
          }}
        />
      ))}
    </div>
  );
}

export default function GaragePage() {
  const activeTheme = useAppStore((s) => s.activeTheme);
  const setTheme = useAppStore((s) => s.setTheme);
  const setRoute = useAppStore((s) => s.setRoute);

  useEffect(() => {
    setRoute("/garage");
  }, [setRoute]);

  return (
    <div
      className="pointer-events-auto flex flex-col items-center justify-center gap-10"
      style={{ fontFamily: TERMINAL_FONT }}
    >
      <div className="text-center">
        <p className="mb-2 text-[9px] tracking-[0.3em] text-[#585b70]">
          SELECT VISUAL MODE
        </p>
        <h1 className="text-3xl font-bold tracking-[0.2em] text-[#b4befe] sm:text-4xl">
          GARAGE
        </h1>
      </div>

      <div className="flex flex-col gap-4">
        {THEME_ORDER.map((id) => {
          const theme = THEMES[id];
          const isActive = activeTheme === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTheme(id)}
              className={`flex items-center gap-6 rounded-xl border px-8 py-5 text-left transition-all ${
                isActive
                  ? "border-[#8aadf4]/50 bg-[#8aadf4]/10 shadow-[0_0_20px_rgba(138,173,244,0.1)]"
                  : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
              }`}
            >
              <ThemePreview themeId={id} />
              <div>
                <p
                  className={`text-xs tracking-[0.2em] ${
                    isActive ? "text-[#8aadf4]" : "text-[#a5adcb]"
                  }`}
                >
                  {theme.name}
                </p>
                {isActive && (
                  <p className="mt-1 text-[9px] tracking-[0.15em] text-[#585b70]">
                    ACTIVE
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <Link
        href="/drive"
        onClick={() => setRoute("/drive")}
        className="rounded-lg border border-[#8aadf4]/30 px-8 py-3 text-xs tracking-[0.25em] text-[#8aadf4] transition-all hover:border-[#8aadf4]/60 hover:bg-[#8aadf4]/10 hover:text-white"
      >
        START ENGINE
      </Link>
    </div>
  );
}
