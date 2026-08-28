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
        <div style={{
          position: "fixed", top: 60, left: "50%", transform: "translateX(-50%)",
          background: "var(--text)", color: "var(--bg)",
          borderRadius: 10, padding: "10px 20px", fontSize: 12, fontFamily: "Georgia, serif",
          zIndex: 90, display: "flex", alignItems: "center", gap: 8,
          boxShadow: "3px 3px 0 var(--shadow)", cursor: "pointer",
          border: "2px solid var(--border)",
          transition: "background 0.3s, color 0.3s",
        }}
          onClick={() => { initAudio(); setStarted(true); setShowPrompt(false); window.dispatchEvent(new CustomEvent("power-up")); }}
        >
          <span>Click anywhere to enable sound</span>
          <span style={{ fontSize: 10, opacity: 0.5 }}>(optional)</span>
        </div>
      )}

      <button
        onClick={toggle}
        data-cursor="pointer"
        onMouseEnter={(e) => { e.currentTarget.style.transform = "translate(-1px,-1px)"; e.currentTarget.style.boxShadow = "3px 3px 0 var(--shadow)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "translate(0,0)"; e.currentTarget.style.boxShadow = "2px 2px 0 var(--shadow)"; }}
        style={{
          position: "fixed", top: 14, right: 80, zIndex: 90,
          background: "var(--bg-card)", border: "2px solid var(--border)", borderRadius: 8,
          width: 28, height: 28, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, color: "var(--text)",
          boxShadow: "2px 2px 0 var(--shadow)",
          transition: "transform 0.15s, box-shadow 0.15s, background 0.3s, color 0.3s",
        }}
        title={muted ? "Unmute" : "Mute"}
      >
        {muted ? "x" : "~"}
      </button>
    </>
  );
}
