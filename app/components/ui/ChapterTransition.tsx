"use client";

import { useEffect, useState } from "react";
import { useNarrative } from "@/app/lib/narrativeStore";
import { CHAPTERS } from "@/app/lib/narrative";

export default function ChapterTransition() {
  const { started, currentChapter, playing } = useNarrative();
  const [show, setShow] = useState(false);
  const [data, setData] = useState<{ num: number; title: string; subtitle: string; color: string; irlTheme: string } | null>(null);

  useEffect(() => {
    if (!started || !playing) return;
    const ch = CHAPTERS[currentChapter];
    if (!ch) return;
    setData({ num: ch.id, title: ch.title, subtitle: ch.subtitle, color: ch.color, irlTheme: ch.irlTheme });
    setShow(true);
    const t = setTimeout(() => setShow(false), 5000);
    return () => clearTimeout(t);
  }, [currentChapter, started, playing]);

  if (!show || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-[#050816]/85 animate-fadeIn" />
      <div className="relative z-10 text-center animate-fadeIn max-w-xl px-4">
        <div
          className="text-[10px] tracking-[0.8em] uppercase mb-6"
          style={{ color: data.color + "80" }}
        >
          Chapter {data.num} of {CHAPTERS.length}
        </div>
        <div
          className="text-3xl md:text-5xl font-display tracking-[0.2em] mb-4"
          style={{ color: data.color }}
        >
          {data.title}
        </div>
        <div className="text-xs md:text-sm text-white/30 tracking-[0.15em] italic mb-6">
          {data.subtitle}
        </div>
        <div className="w-20 h-px mx-auto mb-6" style={{ backgroundColor: data.color + "40" }} />
        <div className="text-[10px] text-white/15 tracking-[0.3em] uppercase">
          {data.irlTheme}
        </div>
      </div>
    </div>
  );
}
