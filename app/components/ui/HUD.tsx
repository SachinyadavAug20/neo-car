"use client";

import { useStore } from "@/app/lib/store";
import { useNarrative } from "@/app/lib/narrativeStore";
import { CHAPTERS } from "@/app/lib/narrative";
import { Compass, Volume2, VolumeX, Map, StickyNote, X, ChevronLeft, Pause, Play } from "lucide-react";
import { useState } from "react";
import Minimap from "./Minimap";

export default function HUD() {
  const {
    collectedCount, notes, activeIsland,
    isPlacingNote, setIsPlacingNote, notePlacementColor, setNotePlacementColor,
    audioEnabled, toggleAudio, showMinimap, toggleMinimap,
  } = useStore();

  const { started, playing, currentChapter, currentBeat, setPlaying, collectedLore } = useNarrative();
  const [showInfo, setShowInfo] = useState(false);

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
              {collectedLore.length}/5 LORE
            </div>
          )}
        </div>
      </div>

      {/* Chapter progress */}
      {playing && chapter && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/5">
          <div
            className="h-full transition-all duration-1000"
            style={{
              width: `${((currentChapter + (currentBeat / chapter.beats.length)) / CHAPTERS.length) * 100}%`,
              backgroundColor: chapter.color + "60",
            }}
          />
        </div>
      )}

      {/* Active island info */}
      {activeIsland && !playing && (
        <div className="absolute top-1/2 right-6 -translate-y-1/2 text-right pointer-events-auto">
          <div className="text-[10px] tracking-[0.5em] text-white/20 uppercase mb-2">
            Island {CHAPTERS.findIndex((c) => c.islandId === activeIsland) + 1}
          </div>
          <div
            className="text-lg font-display tracking-[0.2em]"
            style={{ color: CHAPTERS.find((c) => c.islandId === activeIsland)?.color || "#fff" }}
          >
            {CHAPTERS.find((c) => c.islandId === activeIsland)?.title || activeIsland}
          </div>
          <div className="mt-1 text-[10px] text-white/20 tracking-widest">
            {CHAPTERS.find((c) => c.islandId === activeIsland)?.subtitle || ""}
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
        {playing && (
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
      <div className="absolute bottom-6 left-16 text-[10px] tracking-[0.3em] text-white/20">
        {notes.length} NOTES
      </div>
    </div>
  );
}
