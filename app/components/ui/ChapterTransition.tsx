"use client";

import { useEffect, useState } from "react";
import { useNarrative } from "@/app/lib/narrativeStore";
import { CHAPTERS } from "@/app/lib/narrative";

export default function ChapterTransition() {
  const { started, currentChapter, playing } = useNarrative();
  const [show, setShow] = useState(false);
  const [chapterNum, setChapterNum] = useState(0);
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterColor, setChapterColor] = useState("#fff");

  useEffect(() => {
    if (!started || !playing) return;
    const ch = CHAPTERS[currentChapter];
    if (!ch) return;
    setChapterNum(ch.id);
    setChapterTitle(ch.title);
    setChapterColor(ch.color);
    setShow(true);
    const t = setTimeout(() => setShow(false), 3500);
    return () => clearTimeout(t);
  }, [currentChapter, started, playing]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-[#050816]/80 animate-fadeIn" />
      <div className="relative z-10 text-center animate-fadeIn">
        <div
          className="text-[10px] tracking-[0.8em] uppercase mb-4"
          style={{ color: chapterColor + "80" }}
        >
          Chapter {chapterNum}
        </div>
        <div
          className="text-3xl md:text-5xl font-display tracking-[0.2em] animate-fadeIn"
          style={{ color: chapterColor }}
        >
          {chapterTitle}
        </div>
        <div className="mt-6 w-20 h-px mx-auto" style={{ backgroundColor: chapterColor + "40" }} />
      </div>
    </div>
  );
}
