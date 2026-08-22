"use client";

import Link from "next/link";
import { useAppStore } from "../lib/appStore";
import { useAudioAnalyzer } from "../hooks/useAudioAnalyzer";
import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";

const TERMINAL_FONT =
  "var(--font-geist-mono), 'Fira Code', 'JetBrains Mono', monospace";

export default function NavBar() {
  const currentRoute = useAppStore((s) => s.currentRoute);
  const { play, pause, getState } = useAudioAnalyzer();
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    let raf = 0;
    const poll = () => {
      raf = requestAnimationFrame(poll);
      setPlaying(getState() === "playing");
    };
    raf = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(raf);
  }, [getState]);

  const toggleAudio = () => {
    if (getState() === "playing") pause();
    else play();
  };

  return (
    <nav
      className="pointer-events-auto fixed top-0 left-0 right-0 z-50 flex h-10 items-center justify-between border-b border-white/5 bg-[#050505]/60 px-6 backdrop-blur-xl"
      style={{ fontFamily: TERMINAL_FONT }}
    >
      <Link
        href="/"
        className="flex items-center gap-3 transition-opacity hover:opacity-80"
        onClick={() => useAppStore.getState().setRoute("/")}
      >
        <span className="text-[11px] font-bold tracking-[0.25em] text-[#b4befe]">
          NEON_DRIVE
        </span>
        <span className="hidden text-[9px] tracking-[0.2em] text-[#585b70] sm:inline">
          // AMBIENT VISUALIZER
        </span>
      </Link>

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-3 sm:flex">
          {(
            [
              ["/", "HOME"],
              ["/garage", "GARAGE"],
              ["/drive", "DRIVE"],
            ] as const
          ).map(([href, label]) => (
            <Link
              key={href}
              href={href}
              onClick={() => useAppStore.getState().setRoute(href)}
              className={`text-[9px] tracking-[0.2em] transition-all hover:text-white ${
                currentRoute === href
                  ? "text-[#8aadf4]"
                  : "text-[#585b70]"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="h-3 w-px bg-white/10" />

        <button
          type="button"
          onClick={toggleAudio}
          className="flex items-center gap-1.5 rounded px-2 py-1 text-[#8aadf4] transition-all hover:bg-white/5 hover:text-white"
          aria-label={playing ? "Pause audio" : "Play audio"}
        >
          {playing ? <Pause size={10} /> : <Play size={10} />}
          <span className="text-[9px] tracking-[0.15em]">
            {playing ? "MUTE" : "PLAY"}
          </span>
        </button>

        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded border border-[#8aadf4]/20 px-2.5 py-1 text-[9px] tracking-[0.15em] text-[#8aadf4] transition-all hover:border-[#8aadf4]/50 hover:bg-[#8aadf4]/10 hover:text-white hover:shadow-[0_0_12px_rgba(138,173,244,0.15)]"
        >
          GITHUB
        </a>
      </div>
    </nav>
  );
}
