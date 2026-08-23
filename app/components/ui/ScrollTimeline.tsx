"use client";

import { useEffect, useRef, useCallback } from "react";
import { useNarrative } from "@/app/lib/narrativeStore";
import { CHAPTERS } from "@/app/lib/narrative";

export default function ScrollTimeline() {
  const { started, playing, currentBeat, currentChapter, nextBeat, showingChoice, setPlaying } = useNarrative();
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScroll = useRef(0);
  const cooldown = useRef(false);

  const handleWheel = useCallback((e: WheelEvent) => {
    if (!started || !playing || showingChoice) return;
    if (cooldown.current) return;

    const now = Date.now();
    if (now - lastScroll.current < 800) return;

    if (Math.abs(e.deltaY) > 30) {
      cooldown.current = true;
      lastScroll.current = now;
      nextBeat();
      setTimeout(() => { cooldown.current = false; }, 600);
    }
  }, [started, playing, showingChoice, nextBeat]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: true });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    lastScroll.current = Date.now();
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!started || !playing || showingChoice) return;
    const now = Date.now();
    if (now - lastScroll.current < 200) return;
    lastScroll.current = now;
    nextBeat();
  }, [started, playing, showingChoice, nextBeat]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!started || !playing) return;
      if (e.code === "Space" || e.code === "ArrowDown" || e.code === "ArrowRight") {
        e.preventDefault();
        if (!showingChoice) nextBeat();
      }
      if (e.code === "Escape") {
        setPlaying(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [started, playing, showingChoice, nextBeat, setPlaying]);

  const chapter = CHAPTERS[currentChapter];
  const progress = chapter ? (currentBeat / chapter.beats.length) : 0;
  const totalProgress = chapter ? ((currentChapter + progress) / CHAPTERS.length) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-20 pointer-events-auto"
      style={{ cursor: "none" }}
    >
      {/* Scroll hint */}
      {started && playing && currentBeat === 0 && currentChapter === 0 && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 text-center animate-bounce">
          <div className="text-[10px] tracking-[0.5em] text-white/20 uppercase">
            Scroll to continue
          </div>
          <div className="mt-2 text-white/10">
            <svg width="16" height="24" viewBox="0 0 16 24" fill="none" className="mx-auto">
              <rect x="1" y="1" width="14" height="22" rx="7" stroke="currentColor" strokeWidth="1" opacity="0.3" />
              <circle cx="8" cy="8" r="2" fill="currentColor" opacity="0.3">
                <animate attributeName="cy" values="8;16;8" dur="1.5s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {playing && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{
              width: `${totalProgress}%`,
              backgroundColor: chapter?.color + "40",
            }}
          />
        </div>
      )}
    </div>
  );
}
