"use client";

import { useEffect, useRef, useState } from "react";
import { getAudioFrequencyData, setMuted } from "@/app/lib/audio";

export function AudioVisualizer() {
  const [muted, setLocalMuted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animIdRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const barCount = 14;
    const barWidth = 3;
    const gap = 2;

    const render = () => {
      const freq = getAudioFrequencyData();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < barCount; i++) {
        let val = 0;
        if (freq && freq.length > 0 && !muted) {
          // Sample lower-mid frequencies for pleasant musical reaction
          const idx = Math.floor((i / barCount) * Math.min(freq.length, 24));
          val = (freq[idx] || 0) / 255;
        }

        const h = Math.max(3, val * (canvas.height - 4));
        const x = i * (barWidth + gap);
        const y = canvas.height - h;

        // Gradient from accent to text
        ctx.fillStyle = val > 0.4 ? "#fbbf24" : "rgba(26, 26, 46, 0.65)";
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, h, [2]);
        ctx.fill();
      }

      animIdRef.current = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animIdRef.current);
  }, [muted]);

  const toggleMute = () => {
    const next = !muted;
    setLocalMuted(next);
    setMuted(next);
  };

  return (
    <button
      onClick={toggleMute}
      title={muted ? "Unmute Audio" : "Mute Audio"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "var(--bg-card)",
        border: "1.5px solid var(--border)",
        borderRadius: 8,
        padding: "5px 10px",
        cursor: "pointer",
        boxShadow: "1px 1px 0 var(--shadow)",
        transition: "background 0.3s, border-color 0.3s, transform 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.04)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      <canvas
        ref={canvasRef}
        width={70}
        height={18}
        style={{ display: "block", opacity: muted ? 0.3 : 0.85 }}
      />
      <span
        style={{
          fontSize: 10,
          fontFamily: "monospace",
          fontWeight: 700,
          color: muted ? "var(--text-muted)" : "var(--text)",
        }}
      >
        {muted ? "MUTED" : "LIVE AUDIO"}
      </span>
    </button>
  );
}
