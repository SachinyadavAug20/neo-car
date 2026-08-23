"use client";

import { useStore } from "@/app/lib/store";
import { useNarrative } from "@/app/lib/narrativeStore";
import { CHAPTERS } from "@/app/lib/narrative";
import { Compass, Volume2, VolumeX, Map, StickyNote, X, ChevronLeft, Pause, Play } from "lucide-react";
import Minimap from "./Minimap";

export default function HUD() {
  const {
    collectedCount, notes, activeIsland,
    isPlacingNote, setIsPlacingNote, notePlacementColor, setNotePlacementColor,
    audioEnabled, toggleAudio, showMinimap, toggleMinimap,
  } = useStore();

  const { started, playing, currentChapter, currentBeat, setPlaying, collectedLore, mood, showingChoice } = useNarrative();

  if (!started) return null;

  const chapter = CHAPTERS[currentChapter];

  return (
    <div className="fixed inset-0 z-30 pointer-events-none">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Compass className="text-white/30" size={16} />
          <span className="font-display text-sm tracking-[0.3em] text-white/40">DRIFT</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-[10px] tracking-[0.3em] text-white/20">
            {collectedCount}/24 CRYSTALS
          </div>
          {collectedLore.length > 0 && (
            <div className="text-[10px] tracking-[0.3em] text-white/20">
              {collectedLore.length}/{CHAPTERS.length} LORE
            </div>
          )}
          {mood && (
            <div className="text-[10px] tracking-[0.3em] text-white/20 uppercase">
              {mood}
            </div>
          )}
        </div>
      </div>

      {/* Chapter progress bar */}
      {playing && chapter && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/5">
          <div
            className="h-full transition-all duration-1000 ease-out"
            style={{
              width: `${((currentChapter + (currentBeat / chapter.beats.length)) / CHAPTERS.length) * 100}%`,
              backgroundColor: chapter.color + "60",
            }}
          />
        </div>
      )}

      {/* Story progress dots - top center */}
      {playing && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 pointer-events-auto">
          {CHAPTERS.map((ch, i) => (
            <button
              key={ch.id}
              onClick={() => useNarrative.getState().jumpToChapter(i)}
              className="group relative"
            >
              <div
                className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                  i < currentChapter
                    ? "scale-100"
                    : i === currentChapter
                    ? "scale-150"
                    : "scale-75 opacity-30"
                }`}
                style={{
                  backgroundColor: i <= currentChapter ? ch.color : "rgba(255,255,255,0.2)",
                  boxShadow: i === currentChapter ? `0 0 10px ${ch.color}40` : "none",
                }}
              />
              <div className="absolute top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                <span className="text-[8px] tracking-[0.15em] text-white/40 uppercase bg-[#050816]/80 px-2 py-0.5 rounded">
                  {ch.title}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* IRL Theme - bottom left during story */}
      {playing && chapter && !showingChoice && (
        <div className="absolute bottom-20 left-6 max-w-xs">
          <div className="text-[10px] tracking-[0.3em] text-white/15 uppercase mb-1">
            Inspired by
          </div>
          <div className="text-xs text-white/25 italic leading-relaxed">
            {chapter.irlTheme}
          </div>
        </div>
      )}

      {/* Active island info */}
      {activeIsland && !playing && (
        <div className="absolute top-1/2 right-6 -translate-y-1/2 text-right pointer-events-auto">
          <div className="text-[10px] tracking-[0.5em] text-white/20 uppercase mb-2">
            Island {CHAPTERS.findIndex((c) => c.islandId === activeIsland.id) + 1}
          </div>
          <div
            className="text-lg font-display tracking-[0.2em]"
            style={{ color: CHAPTERS.find((c) => c.islandId === activeIsland.id)?.color || "#fff" }}
          >
            {CHAPTERS.find((c) => c.islandId === activeIsland.id)?.title || activeIsland.name}
          </div>
          <div className="mt-1 text-[10px] text-white/20 tracking-widest">
            {CHAPTERS.find((c) => c.islandId === activeIsland.id)?.subtitle || ""}
          </div>
        </div>
      )}

      {/* Back button */}
      {activeIsland && !playing && (
        <div className="absolute top-6 right-6 pointer-events-auto">
          <button
            onClick={() => useStore.getState().setActiveIsland(null)}
            className="glass px-3 py-2 rounded-full flex items-center gap-2 text-[10px] tracking-[0.2em] text-white/40 hover:text-white/70 transition-colors"
          >
            <ChevronLeft size={12} />
            OVERVIEW
          </button>
        </div>
      )}

      {/* Bottom right controls */}
      <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3 pointer-events-auto">
        {!playing && (
          <>
            <button
              onClick={toggleMinimap}
              className="glass p-3 rounded-full text-white/30 hover:text-white/60 transition-colors"
            >
              {showMinimap ? <X size={16} /> : <Map size={16} />}
            </button>
            <button
              onClick={toggleAudio}
              className="glass p-3 rounded-full text-white/30 hover:text-white/60 transition-colors"
            >
              {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button
              onClick={() => setIsPlacingNote(!isPlacingNote)}
              className={`glass p-3 rounded-full transition-colors ${
                isPlacingNote ? "text-yellow-400" : "text-white/30 hover:text-white/60"
              }`}
            >
              <StickyNote size={16} />
            </button>
          </>
        )}
        {playing && !showingChoice && (
          <button
            onClick={() => setPlaying(!playing)}
            className="glass p-3 rounded-full text-white/30 hover:text-white/60 transition-colors"
          >
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>
        )}
      </div>

      {/* Note placement color picker */}
      {isPlacingNote && (
        <div className="absolute bottom-20 right-6 flex flex-col items-center gap-2 pointer-events-auto">
          {["#fbbf24", "#a78bfa", "#67e8f9", "#f472b6", "#4ecdc4", "#ff6b6b"].map((c) => (
            <button
              key={c}
              onClick={() => setNotePlacementColor(c)}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                notePlacementColor === c ? "scale-125 border-white" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
          <button
            onClick={() => setIsPlacingNote(false)}
            className="mt-2 text-[10px] text-white/30 hover:text-white/60"
          >
            ESC
          </button>
        </div>
      )}

      {/* Minimap */}
      {showMinimap && !playing && <Minimap />}

      {/* Bottom left - note count */}
      {!playing && (
        <div className="absolute bottom-6 left-16 text-[10px] tracking-[0.3em] text-white/20">
          {notes.length} NOTES
        </div>
      )}
    </div>
  );
}
