"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAppStore } from "./lib/appStore";

const TERMINAL_FONT =
  "var(--font-geist-mono), 'Fira Code', 'JetBrains Mono', monospace";

export default function HomePage() {
  const [revealed, setRevealed] = useState(false);
  const setRoute = useAppStore((s) => s.setRoute);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setRoute("/");
  }, [setRoute]);

  return (
    <div
      className="pointer-events-auto flex flex-col items-center justify-center gap-8"
      style={{ fontFamily: TERMINAL_FONT }}
    >
      <div
        className={`flex flex-col items-center gap-6 transition-all duration-1000 ${
          revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <h1 className="text-center text-5xl font-black tracking-[0.3em] text-[#b4befe] drop-shadow-[0_0_40px_rgba(180,190,254,0.3)] sm:text-7xl md:text-8xl">
          ENTER
          <br />
          <span className="text-[#cba6f7]">THE VOID</span>
        </h1>

        <p className="max-w-md text-center text-xs leading-relaxed tracking-[0.2em] text-[#585b70]">
          AN IMMERSIVE AUDIO-VISUAL DRIVING SYNTHESIZER.
          <br />
          REACTIVE SHADERS. INFINITE HIGHWAY. PURE SOUND.
        </p>
      </div>

      <div
        className={`flex flex-col items-center gap-6 transition-all duration-1000 delay-500 ${
          revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <Link
          href="/drive"
          onClick={() => setRoute("/drive")}
          className="group relative rounded-lg border border-[#8aadf4]/30 px-10 py-4 text-sm tracking-[0.3em] text-[#8aadf4] transition-all hover:border-[#8aadf4]/60 hover:bg-[#8aadf4]/10 hover:text-white hover:shadow-[0_0_30px_rgba(138,173,244,0.2)]"
        >
          <span className="relative z-10">START ENGINE</span>
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#8aadf4]/0 via-[#8aadf4]/5 to-[#8aadf4]/0 opacity-0 transition-opacity group-hover:opacity-100" />
        </Link>

        <div className="flex items-center gap-6 text-[9px] tracking-[0.2em] text-[#585b70]">
          <Link
            href="/garage"
            onClick={() => setRoute("/garage")}
            className="transition-all hover:text-[#cba6f7]"
          >
            GARAGE
          </Link>
          <span className="text-[#313244]">|</span>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-all hover:text-[#8aadf4]"
          >
            GITHUB
          </a>
        </div>
      </div>
    </div>
  );
}
