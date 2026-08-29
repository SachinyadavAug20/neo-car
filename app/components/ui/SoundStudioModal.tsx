"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import gsap from "gsap";

interface SoundStudioModalProps {
  visible: boolean;
  onClose: () => void;
}

const NOTES: { name: string; freq: number; key: string; color: string }[] = [
  { name: "C4", freq: 261.63, key: "1", color: "#f87171" },
  { name: "D4", freq: 293.66, key: "2", color: "#fb923c" },
  { name: "E4", freq: 329.63, key: "3", color: "#fbbf24" },
  { name: "G4", freq: 392.0, key: "4", color: "#4ade80" },
  { name: "A4", freq: 440.0, key: "5", color: "#2dd4bf" },
  { name: "C5", freq: 523.25, key: "6", color: "#38bdf8" },
  { name: "D5", freq: 587.33, key: "7", color: "#818cf8" },
  { name: "E5", freq: 659.25, key: "8", color: "#c084fc" },
];

export function SoundStudioModal({ visible, onClose }: SoundStudioModalProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [instrument, setInstrument] = useState<"chime" | "crystal" | "flute">("chime");
  const modalRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getStudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playNote = useCallback((freq: number, keyName: string) => {
    setActiveKey(keyName);
    setTimeout(() => setActiveKey(null), 250);

    const ctx = getStudioCtx();
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (instrument === "chime") {
      osc.type = "sine";
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
    } else if (instrument === "crystal") {
      osc.type = "triangle";
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
      // Harmonic overtone
      const o2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      o2.type = "sine";
      o2.frequency.setValueAtTime(freq * 2.75, t);
      g2.gain.setValueAtTime(0.15, t);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
      o2.connect(g2);
      g2.connect(ctx.destination);
      o2.start(t);
      o2.stop(t + 0.9);
    } else {
      osc.type = "sine";
      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.35, t + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
    }

    osc.frequency.setValueAtTime(freq, t);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 2);

    window.dispatchEvent(new CustomEvent("sparkle-particle", { detail: { count: 3 } }));
  }, [getStudioCtx, instrument]);

  // Keyboard controls
  useEffect(() => {
    if (!visible) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      const note = NOTES.find((n) => n.key === e.key);
      if (note) {
        playNote(note.freq, note.name);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [visible, onClose, playNote]);

  // Animation open
  useEffect(() => {
    if (visible && modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { scale: 0.9, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
      );
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(26, 26, 46, 0.65)",
        backdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-card)",
          border: "2px solid var(--border)",
          borderRadius: 20,
          padding: "32px 36px",
          width: "90%",
          maxWidth: 620,
          boxShadow: "0 20px 50px rgba(0,0,0,0.3), 4px 4px 0 var(--shadow)",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "var(--text)" }}>
              Origami Sound Studio
            </h2>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "4px 0 0", fontFamily: "monospace" }}>
              Play the pentatonic chime keys (1–8 or Click)
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 22,
              cursor: "pointer",
              color: "var(--text-muted)",
            }}
          >
            ×
          </button>
        </div>

        {/* Instrument Preset Selector */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          {(["chime", "crystal", "flute"] as const).map((inst) => (
            <button
              key={inst}
              onClick={() => setInstrument(inst)}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 8,
                border: "1.5px solid var(--border)",
                background: instrument === inst ? "var(--text)" : "var(--bg)",
                color: instrument === inst ? "var(--bg)" : "var(--text)",
                fontSize: 12,
                fontFamily: "monospace",
                fontWeight: 700,
                cursor: "pointer",
                textTransform: "capitalize",
                transition: "all 0.2s",
              }}
            >
              {inst === "chime" ? "🎐 Wind Chime" : inst === "crystal" ? "💎 Paper Crystal" : "🎋 Bamboo Flute"}
            </button>
          ))}
        </div>

        {/* Chime Keys */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(8, 1fr)",
            gap: 10,
            height: 180,
            alignItems: "end",
            marginBottom: 24,
            padding: "16px 8px",
            background: "var(--bg)",
            borderRadius: 14,
            border: "1.5px solid var(--border-light)",
          }}
        >
          {NOTES.map((n, i) => {
            const isPressed = activeKey === n.name;
            const barHeight = 100 + i * 8;
            return (
              <button
                key={n.name}
                onClick={() => playNote(n.freq, n.name)}
                style={{
                  height: `${barHeight}%`,
                  background: isPressed ? n.color : "var(--bg-elevated)",
                  border: `2px solid ${isPressed ? n.color : "var(--border)"}`,
                  borderRadius: 10,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 4px",
                  transition: "transform 0.1s, background 0.15s, border-color 0.15s",
                  transform: isPressed ? "translateY(6px) scale(0.98)" : "translateY(0) scale(1)",
                  boxShadow: isPressed ? "none" : "0 4px 8px var(--shadow)",
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "monospace", color: isPressed ? "#fff" : "var(--text)" }}>
                  {n.name}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    fontFamily: "monospace",
                    background: "rgba(0,0,0,0.1)",
                    borderRadius: 4,
                    padding: "2px 5px",
                    color: isPressed ? "#fff" : "var(--text-muted)",
                  }}
                >
                  {n.key}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>
          Press keys 1–8 on your keyboard to create paper melodies &middot; Esc to close
        </div>
      </div>
    </div>
  );
}
