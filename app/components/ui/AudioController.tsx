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
    if (newMuted) { stopMusic(); stopAmbient(); }
    else { startMusic(mood); startAmbient(mood); }
  };

  if (!visible) return null;

  return (
    <>
      {showPrompt && (
        <div
          style={{
            position: "fixed",
            top: 50,
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--bg-card)",
            color: "var(--text)",
            borderRadius: 8,
            padding: "8px 18px",
            fontSize: 13,
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            zIndex: 90,
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "3px 3px 0 var(--shadow)",
            cursor: "pointer",
            border: "2px solid var(--border)",
            transition: "background 0.3s, color 0.3s, border-color 0.3s, box-shadow 0.3s",
          }}
          onClick={() => {
            initAudio();
            setStarted(true);
            setShowPrompt(false);
            window.dispatchEvent(new CustomEvent("power-up"));
          }}
        >
          <span>🔊 Click anywhere to enable sound</span>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>(optional)</span>
        </div>
      )}

      <button
        onClick={toggle}
        aria-label={muted ? "Unmute audio" : "Mute audio"}
        aria-pressed={!muted}
        style={{
          position: "fixed",
          bottom: 14,
          left: 14,
          zIndex: 90,
          background: "var(--bg-card)",
          border: "2px solid var(--border)",
          borderRadius: 8,
          width: 32,
          height: 32,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: 800,
          color: "var(--text)",
          boxShadow: "2px 2px 0 var(--shadow)",
          transition: "background 0.3s, color 0.3s, border-color 0.3s, box-shadow 0.3s",
        }}
        title={muted ? "Unmute" : "Mute"}
      >
        {muted ? "🔇" : "🔊"}
      </button>
    </>
  );
}
