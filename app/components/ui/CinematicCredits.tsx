"use client";

import { useNarrative } from "@/app/lib/narrativeStore";
import { CHAPTERS } from "@/app/lib/narrative";

export default function CinematicCredits() {
  const { started, playing, currentChapter, collectedLore } = useNarrative();
  const isComplete = started && !playing && currentChapter >= CHAPTERS.length - 1;

  if (!isComplete) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#050816]/95 backdrop-blur-sm animate-fadeIn">
      <div className="text-center px-4 max-w-2xl animate-fadeIn">
        <div className="text-[10px] tracking-[0.8em] text-white/20 uppercase mb-8">The Story Continues</div>
        <h1 className="text-4xl md:text-6xl font-display tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
          DRIFT
        </h1>
        <p className="mt-6 text-sm text-white/30 italic leading-relaxed">
          &ldquo;You are not a visitor here. You are the story itself.&rdquo;
        </p>
        <div className="mt-12 space-y-3">
          <div className="text-[10px] tracking-[0.5em] text-white/20 uppercase">Experience Complete</div>
          <div className="text-xs text-white/30">
            {collectedLore.length} of {CHAPTERS.length} lore entries discovered
          </div>
        </div>
        <div className="mt-12 space-y-2">
          {CHAPTERS.map((ch, i) => (
            <div key={ch.id} className="flex items-center justify-center gap-3">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: collectedLore.includes(ch.id) ? ch.color : "rgba(255,255,255,0.1)",
                }}
              />
              <span className="text-[10px] tracking-[0.3em] text-white/30 uppercase">{ch.title}</span>
            </div>
          ))}
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
