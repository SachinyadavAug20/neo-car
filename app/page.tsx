"use client";

import Link from "next/link";
import TilingWindow from "./components/TilingWindow";
import { FlameWrap } from "./components/canvasui/FlameWrap";

const TERMINAL_FONT =
  "var(--font-geist-mono), 'Fira Code', 'JetBrains Mono', monospace";

const ASCII_LOGO = `
 ███╗   ██╗███████╗ ██████╗ ███╗   ██╗
 ████╗  ██║██╔════╝██╔═══██╗████╗  ██║
 ██╔██╗ ██║█████╗  ██║   ██║██╔██╗ ██║
 ██║╚██╗██║██╔══╝  ██║   ██║██║╚██╗██║
 ██║ ╚████║███████╗╚██████╔╝██║ ╚████║
 ╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝
`;

export default function HomePage() {
  return (
    <div className="pointer-events-auto flex w-full max-w-5xl flex-col items-center gap-6">
      <TilingWindow title="welcome.sh" className="w-full max-w-2xl">
        <pre
          className="mb-4 text-[10px] leading-tight text-[#8aadf4] sm:text-xs"
          style={{ fontFamily: TERMINAL_FONT }}
        >
          {ASCII_LOGO}
        </pre>
        <p
          className="mb-2 text-xs tracking-[0.2em] text-[#a5adcb]"
          style={{ fontFamily: TERMINAL_FONT }}
        >
          AMBIENT VISUALIZER &amp; INTERACTIVE PORTFOLIO
        </p>
        <p
          className="mb-4 text-[11px] leading-relaxed text-[#6c7086]"
          style={{ fontFamily: TERMINAL_FONT }}
        >
          A persistent 3D world living behind your browser. Navigate with the
          workspace bar above. Drive with WASD. Feel the bass.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/drive"
            className="rounded border border-[#a6e3a1]/40 bg-[#a6e3a1]/10 px-3 py-1.5 text-[10px] font-bold tracking-[0.2em] text-[#a6e3a1] transition-all hover:bg-[#a6e3a1]/20"
            style={{ fontFamily: TERMINAL_FONT }}
          >
            &gt; BOOT SYSTEM_
          </Link>
          <Link
            href="/about"
            className="rounded border border-[#8aadf4]/30 px-3 py-1.5 text-[10px] tracking-[0.2em] text-[#8aadf4] transition-all hover:bg-white/5"
            style={{ fontFamily: TERMINAL_FONT }}
          >
            about.md
          </Link>
          <Link
            href="/projects"
            className="rounded border border-[#cba6f7]/30 px-3 py-1.5 text-[10px] tracking-[0.2em] text-[#cba6f7] transition-all hover:bg-white/5"
            style={{ fontFamily: TERMINAL_FONT }}
          >
            ./projects
          </Link>
        </div>
      </TilingWindow>

      <TilingWindow title="sys_stats.sh" className="w-full max-w-sm self-end">
        <div
          className="space-y-1 text-[10px] tracking-[0.15em] text-[#6c7086]"
          style={{ fontFamily: TERMINAL_FONT }}
        >
          <p>
            <span className="text-[#a6e3a1]">OS</span>{" "}
            <span className="text-[#a5adcb]">NeonDrive 3.0</span>
          </p>
          <p>
            <span className="text-[#a6e3a1]">WM</span>{" "}
            <span className="text-[#a5adcb]">Hyprland (Web)</span>
          </p>
          <p>
            <span className="text-[#a6e3a1]">GPU</span>{" "}
            <span className="text-[#a5adcb]">WebGL2 / R3F</span>
          </p>
          <p>
            <span className="text-[#a6e3a1]">CPU</span>{" "}
            <span className="text-[#a5adcb]">React 19 + Next.js 16</span>
          </p>
          <p>
            <span className="text-[#a6e3a1]">AUDIO</span>{" "}
            <span className="text-[#a5adcb]">Web Audio API + FFT</span>
          </p>
        </div>
      </TilingWindow>
    </div>
  );
}
