"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { useNarrative } from "@/app/lib/narrativeStore";

function seededRandom(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export default function IntroOverlay() {
  const { started, setStarted, setPlaying } = useNarrative();
  const [phase, setPhase] = useState<"title" | "subtitle" | "prompt">("title");
  const [fading, setFading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (started) return;
    const t1 = setTimeout(() => setPhase("subtitle"), 2000);
    const t2 = setTimeout(() => setPhase("prompt"), 4500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [started]);

  const particles = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      width: seededRandom(i * 7 + 1) * 3 + 1,
      height: seededRandom(i * 7 + 2) * 3 + 1,
      left: seededRandom(i * 7 + 3) * 100,
      top: seededRandom(i * 7 + 4) * 100,
      hue: 180 + seededRandom(i * 7 + 5) * 100,
      opacity: seededRandom(i * 7 + 6) * 0.5 + 0.1,
      duration: seededRandom(i * 7 + 7) * 3 + 2,
      delay: seededRandom(i * 7 + 8) * 3,
    }));
  }, []);

  const handleEnter = () => {
    setFading(true);
    setTimeout(() => {
      setStarted(true);
      setPlaying(true);
    }, 1200);
  };

  if (started) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050816] transition-opacity duration-1000 ${fading ? "opacity-0" : "opacity-100"}`}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {mounted && particles.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-pulse"
            style={{
              width: p.width + "px",
              height: p.height + "px",
              left: p.left + "%",
              top: p.top + "%",
              backgroundColor: `hsl(${p.hue}, 70%, 70%)`,
              opacity: p.opacity,
              animationDuration: p.duration + "s",
              animationDelay: p.delay + "s",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center px-4">
        <h1
          className={`font-display text-6xl md:text-8xl tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 transition-all duration-1000 ${phase !== "title" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          DRIFT
        </h1>
        <p
          className={`mt-6 text-sm md:text-base tracking-[0.5em] text-white/40 uppercase transition-all duration-1000 delay-300 ${phase !== "title" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          Floating Sky Islands
        </p>
        <p
          className={`mt-10 text-xs md:text-sm text-white/30 max-w-lg mx-auto leading-relaxed transition-all duration-1000 ${phase === "prompt" || phase === "subtitle" ? "opacity-100" : "opacity-0"}`}
        >
          {phase === "subtitle"
            ? "A world of memory, light, and forgotten dreams awaits..."
            : "Explore four floating islands. Uncover the story of their creation. Leave your mark on a world that remembers everything."}
        </p>
        <button
          onClick={handleEnter}
          className={`mt-12 px-8 py-3 border border-white/20 rounded-full text-sm tracking-[0.3em] text-white/60 hover:text-white hover:border-white/40 transition-all duration-500 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] ${phase === "prompt" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
        >
          ENTER THE SKY
        </button>
        <div className={`mt-8 text-[10px] text-white/20 tracking-widest transition-all duration-1000 ${phase === "prompt" ? "opacity-100" : "opacity-0"}`}>
          BEST EXPERIENCED WITH SOUND & FULLSCREEN
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}
