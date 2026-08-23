"use client";

import { useNarrative } from "@/app/lib/narrativeStore";
import { CHAPTERS } from "@/app/lib/narrative";
import { SkipForward, RotateCcw, BookOpen, List, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function StoryNavigation() {
  const { started, playing, currentChapter, skipChapter, jumpToChapter, reset, collectedLore } = useNarrative();
  const [showChapterList, setShowChapterList] = useState(false);

  if (!started) return null;

  return (
    <>
      {/* Skip button */}
      {playing && (
        <button
          onClick={skipChapter}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 glass px-4 py-2 rounded-full flex items-center gap-2 text-[10px] tracking-[0.3em] text-white/30 hover:text-white/60 transition-all pointer-events-auto"
        >
          <SkipForward size={12} />
          SKIP CHAPTER
        </button>
      )}

      {/* Chapter list toggle */}
      <button
        onClick={() => setShowChapterList(!showChapterList)}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-40 glass px-4 py-2 rounded-full flex items-center gap-2 text-[10px] tracking-[0.3em] text-white/30 hover:text-white/60 transition-all pointer-events-auto"
      >
        <List size={12} />
        CHAPTER {currentChapter + 1} / {CHAPTERS.length}
      </button>

      {/* Chapter list panel */}
      {showChapterList && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center pt-20 bg-[#050816]/80 backdrop-blur-sm pointer-events-auto">
          <div className="glass rounded-2xl p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm tracking-[0.3em] text-white/40">CHAPTERS</h3>
              <button onClick={() => setShowChapterList(false)} className="text-white/30 hover:text-white/60 text-xs">
                CLOSE
              </button>
            </div>
            <div className="space-y-2">
              {CHAPTERS.map((ch, i) => (
                <button
                  key={ch.id}
                  onClick={() => {
                    jumpToChapter(i);
                    setShowChapterList(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${
                    i === currentChapter
                      ? "bg-white/5 border border-white/10"
                      : "hover:bg-white/3"
                  }`}
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: collectedLore.includes(ch.id) ? ch.color : "rgba(255,255,255,0.1)",
                    }}
                  />
                  <div className="flex-1">
                    <div className="text-xs tracking-[0.15em]" style={{ color: i === currentChapter ? ch.color : "rgba(255,255,255,0.4)" }}>
                      {ch.title}
                    </div>
                    <div className="text-[10px] text-white/20 mt-0.5">{ch.irlTheme}</div>
                  </div>
                  {i === currentChapter && (
                    <ChevronRight size={14} style={{ color: ch.color }} />
                  )}
                </button>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between">
              <button
                onClick={() => {
                  reset();
                  setShowChapterList(false);
                }}
                className="flex items-center gap-2 text-[10px] text-white/20 hover:text-white/40 tracking-widest"
              >
                <RotateCcw size={10} />
                RESTART
              </button>
              <div className="text-[10px] text-white/20">
                {collectedLore.length} / {CHAPTERS.length} explored
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
