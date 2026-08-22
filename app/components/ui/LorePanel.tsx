"use client";

import { useNarrative } from "@/app/lib/narrativeStore";
import { CHAPTERS } from "@/app/lib/narrative";
import { BookOpen, X } from "lucide-react";
import { useState } from "react";

export default function LorePanel() {
  const { started, collectedLore } = useNarrative();
  const [open, setOpen] = useState(false);

  if (!started || collectedLore.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-40 glass px-3 py-2 rounded-full flex items-center gap-2 text-xs text-white/50 hover:text-white/80 transition-colors"
      >
        <BookOpen size={14} />
        <span className="tracking-widest">{collectedLore.length} / {CHAPTERS.length}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#050816]/90 backdrop-blur-sm">
          <div className="glass rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto relative">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-display tracking-[0.3em] text-cyan-400 mb-6">CODEX</h2>
            <div className="space-y-6">
              {CHAPTERS.filter((ch) => collectedLore.includes(ch.id)).map((ch) => (
                <div key={ch.id} className="border-l-2 pl-4" style={{ borderColor: ch.color + "40" }}>
                  <h3 className="text-sm tracking-[0.2em] uppercase" style={{ color: ch.color }}>
                    {ch.lore.title}
                  </h3>
                  <p className="mt-2 text-xs text-white/40 leading-relaxed">
                    {ch.lore.text}
                  </p>
                </div>
              ))}
            </div>
            {collectedLore.length < CHAPTERS.length && (
              <div className="mt-6 text-center text-[10px] text-white/20 tracking-widest">
                {CHAPTERS.length - collectedLore.length} ENTRIES REMAINING
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
