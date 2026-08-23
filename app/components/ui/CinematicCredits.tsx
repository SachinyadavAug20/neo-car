"use client";

import { useNarrative } from "@/app/lib/narrativeStore";
import { CHAPTERS } from "@/app/lib/narrative";

export default function CinematicCredits() {
  const { started, playing, currentChapter, collectedLore, storyLog, mood } = useNarrative();
  const isComplete = started && !playing && currentChapter >= CHAPTERS.length - 1;

  if (!isComplete) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#050816]/95 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="text-center px-4 max-w-2xl py-20 animate-fadeIn">
        <div className="text-[10px] tracking-[0.8em] text-white/20 uppercase mb-8">The Story Continues</div>
        <h1 className="text-4xl md:text-6xl font-display tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
          DRIFT
        </h1>
        <p className="mt-6 text-sm text-white/30 italic leading-relaxed">
          &ldquo;You are not a visitor here. You are the story itself.&rdquo;
        </p>

        {/* Chapter completion */}
        <div className="mt-12 space-y-3">
          {CHAPTERS.map((ch) => (
            <div key={ch.id} className="flex items-center justify-center gap-3">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: collectedLore.includes(ch.id) ? ch.color : "rgba(255,255,255,0.1)",
                }}
              />
              <span className="text-[10px] tracking-[0.3em] text-white/30 uppercase">{ch.title}</span>
              {collectedLore.includes(ch.id) && (
                <span className="text-[8px] text-white/15">{ch.irlTheme}</span>
              )}
            </div>
          ))}
        </div>

        {/* Story log */}
        {storyLog.length > 0 && (
          <div className="mt-12">
            <div className="text-[10px] tracking-[0.5em] text-white/20 uppercase mb-4">Your Journey</div>
            <div className="space-y-2">
              {storyLog.map((entry, i) => (
                <div key={i} className="text-xs text-white/20 italic">
                  {entry}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mt-12 grid grid-cols-3 gap-4 max-w-sm mx-auto">
          <div>
            <div className="text-lg font-display text-white/40">{collectedLore.length}</div>
            <div className="text-[8px] tracking-[0.3em] text-white/15">CHAPTERS</div>
          </div>
          <div>
            <div className="text-lg font-display text-white/40">{storyLog.length}</div>
            <div className="text-[8px] tracking-[0.3em] text-white/15">CHOICES</div>
          </div>
          <div>
            <div className="text-lg font-display text-white/40 uppercase">{mood || "none"}</div>
            <div className="text-[8px] tracking-[0.3em] text-white/15">MOOD</div>
          </div>
        </div>

        <div className="mt-16 text-[10px] text-white/15 tracking-widest">
          A 3D WEBSITES HACKATHON ENTRY
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-8 px-6 py-2 border border-white/10 rounded-full text-[10px] tracking-[0.3em] text-white/30 hover:text-white/60 hover:border-white/20 transition-all"
        >
          EXPERIENCE AGAIN
        </button>
      </div>
    </div>
  );
}
