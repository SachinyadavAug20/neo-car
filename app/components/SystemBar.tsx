"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Pause, Play } from "lucide-react";
import { useRouteStore, ROUTE_CONFIG, type RouteId } from "../lib/routeStore";
import { useAudioAnalyzer } from "../hooks/useAudioAnalyzer";

const TERMINAL_FONT =
  "var(--font-geist-mono), 'Fira Code', 'JetBrains Mono', monospace";

const PATH_TO_ROUTE: Record<string, RouteId> = {
  "/": "home",
  "/about": "about",
  "/projects": "projects",
  "/drive": "drive",
};

export default function SystemBar() {
  const pathname = usePathname();
  const setRoute = useRouteStore((s) => s.setRoute);
  const { play, pause, getState } = useAudioAnalyzer();
  const [time, setTime] = useState("");
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const routeId = PATH_TO_ROUTE[pathname] ?? "home";
    setRoute(routeId);
  }, [pathname, setRoute]);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

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
      className="pointer-events-auto fixed top-0 left-0 right-0 z-50 flex h-8 items-center justify-between border-b border-[#8aadf4]/30 bg-[#0b0f19]/80 px-4 backdrop-blur-md"
      style={{ fontFamily: TERMINAL_FONT }}
    >
      <div className="flex items-center gap-1">
        <span className="mr-3 text-[10px] font-bold tracking-[0.2em] text-[#b4befe]">
          NEON_DRIVE
        </span>
        {Object.entries(ROUTE_CONFIG).map(([id, cfg]) => {
          const active = (PATH_TO_ROUTE[pathname] ?? "home") === id;
          return (
            <Link
              key={id}
              href={id === "home" ? "/" : `/${id}`}
              className={`rounded px-2 py-0.5 text-[10px] tracking-[0.15em] transition-all ${
                active
                  ? "bg-[#8aadf4]/20 text-[#b4befe] shadow-[0_0_8px_rgba(138,173,244,0.3)]"
                  : "text-[#6c7086] hover:bg-white/5 hover:text-[#a5adcb]"
              }`}
            >
              [{cfg.key}] {cfg.label}
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-3 text-[10px] tracking-[0.15em] text-[#6c7086]">
        <span className="text-[#a5adcb]">{time}</span>
        <span className="text-[#a6e3a1]">PING: 2ms</span>
        <button
          type="button"
          onClick={toggleAudio}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[#8aadf4] transition-all hover:bg-white/5 hover:text-white"
          aria-label={playing ? "Pause audio" : "Play audio"}
        >
          {playing ? <Pause size={10} /> : <Play size={10} />}
          <span className="text-[9px]">{playing ? "MUTE" : "PLAY"}</span>
        </button>
      </div>
    </nav>
  );
}
