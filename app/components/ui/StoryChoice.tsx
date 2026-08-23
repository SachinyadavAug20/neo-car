"use client";

import { useNarrative } from "@/app/lib/narrativeStore";
import { CHAPTERS } from "@/app/lib/narrative";
import { useState } from "react";

export default function StoryChoice() {
  const { started, showingChoice, currentChapter, makeChoice } = useNarrative();
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  if (!started || !showingChoice) return null;

  const chapter = CHAPTERS[currentChapter];
  if (!chapter?.choice) return null;

  const choice = chapter.choice;

  const handleChoice = (mood: "hope" | "loss" | "wonder" | "courage") => {
    setSelected(mood);
    setTimeout(() => {
      makeChoice(choice.id, mood);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050816]/80 backdrop-blur-sm animate-fadeIn">
      <div className="text-center px-4 max-w-xl">
        <div className="text-[10px] tracking-[0.8em] text-white/20 uppercase mb-8">
          A Choice Awaits
        </div>
        <p className="text-lg md:text-xl font-display text-white/70 leading-relaxed mb-10 italic">
          &ldquo;{choice.text}&rdquo;
        </p>
        <div className="flex flex-col gap-3">
          {[
            { mood: "courage" as const, label: "Let it burn", desc: "Embrace the fire", color: "#ef4444" },
            { mood: "wonder" as const, label: "Breathe it in", desc: "Accept the mystery", color: "#a78bfa" },
            { mood: "loss" as const, label: "Let it break", desc: "Release what was", color: "#fbbf24" },
            { mood: "hope" as const, label: "Step through", desc: "Choose what comes next", color: "#4ecdc4" },
          ].filter(opt => opt.mood === "courage" || opt.mood === "wonder" || opt.mood === "loss" || opt.mood === "hope").map((opt) => (
            <button
              key={opt.mood}
              onClick={() => handleChoice(opt.mood)}
              onMouseEnter={() => setHovered(opt.mood)}
              onMouseLeave={() => setHovered(null)}
              disabled={selected !== null}
              className={`group relative glass rounded-xl px-6 py-4 text-left transition-all duration-500 ${
                selected === opt.mood
                  ? "scale-105 border-white/20"
                  : selected
                  ? "opacity-30"
                  : "hover:scale-[1.02] hover:border-white/15"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-3 h-3 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: opt.color,
                    boxShadow: hovered === opt.mood || selected === opt.mood ? `0 0 20px ${opt.color}60` : "none",
                  }}
                />
                <div>
                  <div className="text-sm tracking-[0.15em] text-white/70">{opt.label}</div>
                  <div className="text-[10px] text-white/30 mt-0.5">{opt.desc}</div>
                </div>
              </div>
              {selected === opt.mood && (
                <div className="absolute inset-0 rounded-xl animate-pulse" style={{ backgroundColor: opt.color + "10" }} />
              )}
            </button>
          ))}
        </div>
        <div className="mt-6 text-[10px] text-white/15 tracking-widest">
          YOUR CHOICE SHAPES THE STORY
        </div>
      </div>
    </div>
  );
}
