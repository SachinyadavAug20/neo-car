"use client";

import { useState, useEffect } from "react";
import { setMuted, initAudio, startMusic, stopMusic, startAmbient, stopAmbient } from "@/app/lib/audio";
import { Mood } from "@/app/lib/narrative";

interface AudioControllerProps {
  mood: Mood;
  visible?: boolean;
}

export default function AudioController({ mood, visible = true }: AudioControllerProps) {
  const [muted, setMutedState] = useState(false);
  const [started, setStarted] = useState(false);
  const [showPrompt, setShowPrompt] = useState(true);

  // Start audio on first user interaction
  useEffect(() => {
    const start = () => {
      if (!started) {
        initAudio();
        setStarted(true);
        setShowPrompt(false);
      }
    };
    window.addEventListener("click", start, { once: true });
    window.addEventListener("keydown", start, { once: true });
    return () => {
      window.removeEventListener("click", start);
      window.removeEventListener("keydown", start);
    };
  }, [started]);

  // Update music/ambient on mood change
  useEffect(() => {
    if (started && !muted) {
      startMusic(mood);
      startAmbient(mood);
    }
  }, [mood, started, muted]);

  const toggle = () => {
    const newMuted = !muted;
    setMutedState(newMuted);
    setMuted(newMuted);
    if (newMuted) {
      stopMusic();
      stopAmbient();
    } else {
      startMusic(mood);
      startAmbient(mood);
    }
  };

  if (!visible) return null;

  return (
    <>
      {/* Audio enable prompt */}
      {showPrompt && (
        <div style={{
          position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)",
          background: "rgba(26,26,46,0.85)", color: "#fdf6e3",
          borderRadius: 12, padding: "10px 20px", fontSize: 12, fontFamily: "Georgia, serif",
          zIndex: 90, display: "flex", alignItems: "center", gap: 10,
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)", animation: "pulse 2s ease-in-out infinite",
          cursor: "pointer",
        }}
          onClick={() => { initAudio(); setStarted(true); setShowPrompt(false); }}
        >
          <span style={{ fontSize: 16 }}> </span>
          <span>Click anywhere to enable sound</span>
          <span style={{ fontSize: 10, opacity: 0.5 }}>(optional)</span>
        </div>
      )}

      {/* Mute/unmute button */}
      <button
        onClick={toggle}
        data-cursor="pointer"
        style={{
          position: "fixed", top: 16, right: 70, zIndex: 90,
          background: "#fff", border: "2px solid #1a1a2e", borderRadius: 10,
          width: 36, height: 36, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, boxShadow: "2px 2px 0 #1a1a2e",
          transition: "transform 0.15s, box-shadow 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "translate(-1px,-1px)"; e.currentTarget.style.boxShadow = "3px 3px 0 #1a1a2e"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "translate(0,0)"; e.currentTarget.style.boxShadow = "2px 2px 0 #1a1a2e"; }}
        title={muted ? "Unmute" : "Mute"}
      >
        {muted ? "🔇" : "🔊"}
      </button>
    </>
  );
}
