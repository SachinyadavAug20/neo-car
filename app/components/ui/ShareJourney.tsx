"use client";

import { useState, useCallback } from "react";
import { Share2, Copy, Check } from "lucide-react";
import { useNarrative } from "@/app/lib/narrativeStore";
import { CHAPTERS } from "@/app/lib/narrative";

export default function ShareJourney() {
  const { started, collectedLore, storyLog, mood } = useNarrative();
  const [copied, setCopied] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  const generateSummary = useCallback(() => {
    const explored = collectedLore.map((id) => CHAPTERS[id - 1]?.title).filter(Boolean);
    const choices = storyLog.map((l) => l.split(": chose ")[1]?.split(" (")[0]).filter(Boolean);

    return {
      explored,
      choices,
      mood: mood || "uncharted",
      completion: Math.round((collectedLore.length / CHAPTERS.length) * 100),
      text: `I journeyed through Drift — floating sky islands of memory and light. Explored ${explored.length} of ${CHAPTERS.length} chapters. My mood: ${mood || "uncharted"}. ${choices.length > 0 ? `Choices made: ${choices.join(", ")}.` : ""} The universe is waiting to see what you become next.`,
    };
  }, [collectedLore, storyLog, mood]);

  const copyToClipboard = useCallback(() => {
    const summary = generateSummary();
    navigator.clipboard.writeText(summary.text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [generateSummary]);

  if (!started || collectedLore.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="fixed top-6 right-6 z-40 glass p-3 rounded-full text-white/30 hover:text-white/60 transition-colors pointer-events-auto"
      >
        <Share2 size={16} />
      </button>

      {showPanel && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#050816]/90 backdrop-blur-sm pointer-events-auto">
          <div className="glass rounded-2xl p-6 max-w-md w-full mx-4 relative">
            <button
              onClick={() => setShowPanel(false)}
              className="absolute top-4 right-4 text-white/30 hover:text-white/60 text-xs"
            >
              CLOSE
            </button>
            <h2 className="text-lg font-display tracking-[0.3em] text-cyan-400 mb-6">SHARE YOUR JOURNEY</h2>

            <div className="p-4 rounded-xl bg-white/3 mb-4">
              <div className="text-xs text-white/40 italic leading-relaxed">
                {generateSummary().text}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-white/3 text-center">
                <div className="text-lg font-display text-white/50">{generateSummary().completion}%</div>
                <div className="text-[8px] tracking-[0.3em] text-white/20">EXPLORED</div>
              </div>
              <div className="p-3 rounded-xl bg-white/3 text-center">
                <div className="text-lg font-display text-white/50 capitalize">{mood || "—"}</div>
                <div className="text-[8px] tracking-[0.3em] text-white/20">MOOD</div>
              </div>
            </div>

            <button
              onClick={copyToClipboard}
              className="w-full glass rounded-xl px-4 py-3 flex items-center justify-center gap-2 text-xs tracking-[0.2em] text-white/50 hover:text-white/80 transition-colors"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "COPIED!" : "COPY TO CLIPBOARD"}
            </button>

            <div className="mt-4 text-center text-[10px] text-white/15">
              Share your story with the world
            </div>
          </div>
        </div>
      )}
    </>
  );
}
