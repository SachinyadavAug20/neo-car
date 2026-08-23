"use client";

import { useState } from "react";
import { BookOpen, X } from "lucide-react";
import { useNarrative } from "@/app/lib/narrativeStore";
import { CHAPTERS } from "@/app/lib/narrative";

export default function StoryJournal() {
  const { started, collectedLore, storyLog, mood, choiceMade, currentChapter } = useNarrative();
  const [open, setOpen] = useState(false);

  if (!started || collectedLore.length === 0) return null;

  const diary = CHAPTERS.slice(0, currentChapter + 1).map((ch, i) => ({
    chapter: ch.title,
    color: ch.color,
    irlTheme: ch.irlTheme,
    explored: collectedLore.includes(ch.id),
  }));

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-6 left-16 z-40 glass p-3 rounded-full text-white/30 hover:text-white/60 transition-colors pointer-events-auto"
      >
        <BookOpen size={16} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#050816]/90 backdrop-blur-sm pointer-events-auto">
          <div className="glass rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto relative">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-white/30 hover:text-white/60"
            >
              <X size={16} />
            </button>

            <h2 className="text-lg font-display tracking-[0.3em] text-cyan-400 mb-6">JOURNAL</h2>

            {/* Current mood */}
            {mood && (
              <div className="mb-6 p-3 rounded-xl bg-white/3">
                <div className="text-[10px] tracking-[0.3em] text-white/20 mb-1">CURRENT MOOD</div>
                <div className="text-sm text-white/50 capitalize">{mood}</div>
              </div>
            )}

            {/* Diary entries */}
            <div className="space-y-4">
              {diary.map((entry, i) => (
                <div
                  key={i}
                  className="border-l-2 pl-4 py-2"
                  style={{ borderColor: entry.explored ? entry.color + "60" : "rgba(255,255,255,0.05)" }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: entry.explored ? entry.color : "rgba(255,255,255,0.1)" }}
                    />
                    <span className="text-xs tracking-[0.15em] text-white/40">{entry.chapter}</span>
                  </div>
                  <div className="mt-1 text-[10px] text-white/20 italic">{entry.irlTheme}</div>
                  {entry.explored && (
                    <div className="mt-1 text-[10px] text-white/15">Explored</div>
                  )}
                </div>
              ))}
            </div>

            {/* Story log */}
            {storyLog.length > 0 && (
              <div className="mt-6 pt-4 border-t border-white/5">
                <div className="text-[10px] tracking-[0.3em] text-white/20 mb-3">YOUR CHOICES</div>
                {storyLog.map((entry, i) => (
                  <div key={i} className="text-[10px] text-white/25 italic mb-1">{entry}</div>
                ))}
              </div>
            )}

            <div className="mt-6 text-center text-[10px] text-white/15">
              {collectedLore.length} of {CHAPTERS.length} chapters explored
            </div>
          </div>
        </div>
      )}
    </>
  );
}
