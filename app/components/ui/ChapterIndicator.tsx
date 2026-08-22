"use client";

import { useNarrative } from "@/app/lib/narrativeStore";
import { CHAPTERS } from "@/app/lib/narrative";

export default function ChapterIndicator() {
  const { started, currentChapter, playing } = useNarrative();
  if (!started || !playing) return null;

  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-4">
      {CHAPTERS.map((ch, i) => (
        <div key={ch.id} className="group relative flex items-center">
          <div
            className={`w-2 h-2 rounded-full transition-all duration-500 ${
              i < currentChapter
                ? "scale-100"
                : i === currentChapter
                ? "scale-150 shadow-lg"
                : "scale-75 opacity-30"
            }`}
            style={{
              backgroundColor: i <= currentChapter ? ch.color : "rgba(255,255,255,0.2)",
              boxShadow:
                i === currentChapter ? `0 0 15px ${ch.color}60` : "none",
            }}
          />
          <div className="absolute left-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            <span className="text-[10px] tracking-[0.2em] text-white/50 uppercase">
              {ch.title}
            </span>
          </div>
          {i < CHAPTERS.length - 1 && (
            <div
              className={`absolute top-full left-[3px] w-px h-4 transition-all duration-500 ${
                i < currentChapter ? "opacity-40" : "opacity-10"
              }`}
              style={{ backgroundColor: ch.color }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
