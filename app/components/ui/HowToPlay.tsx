"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";

interface HowToPlayProps {
  onClose: () => void;
}

const CONTROLS = [
  { key: "W A S D", action: "Move camera", icon: "⌨️" },
  { key: "Click", action: "Interact with objects", icon: " " },
  { key: "Hover", action: "Discover hidden things", icon: "✨" },
  { key: "Space / Enter", action: "Advance story", icon: "▶️" },
  { key: "J K H L", action: "Vim-style movement", icon: " " },
  { key: "Shift", action: "Sprint faster", icon: "⚡" },
  { key: "Ctrl K", action: "Command palette", icon: " " },
  { key: "Type words", action: "Secret discoveries", icon: " " },
];

export default function HowToPlay({ onClose }: HowToPlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    }
    cardsRef.current.forEach((card, i) => {
      if (card) {
        gsap.fromTo(card,
          { opacity: 0, y: 20, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.4, delay: 0.1 + i * 0.05, ease: "power2.out" }
        );
      }
    });
  }, []);

  const handleClose = () => {
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        opacity: 0, duration: 0.2, onComplete: onClose
      });
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(253, 246, 227, 0.85)", backdropFilter: "blur(12px)",
      }}
    >
      <div style={{
        background: "#fff", border: "3px solid #1a1a2e", borderRadius: 20,
        padding: "40px 48px", boxShadow: "8px 8px 0 #1a1a2e",
        maxWidth: 480, width: "90%", position: "relative",
      }}>
        {/* Close button */}
        <button onClick={handleClose} style={{
          position: "absolute", top: 12, right: 12, background: "none", border: "none",
          fontSize: 20, cursor: "pointer", color: "#1a1a2e", opacity: 0.4,
          width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 8, transition: "opacity 0.2s",
        }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.4")}
        >
          ✕
        </button>

        <div style={{ fontSize: 28, fontWeight: "bold", color: "#1a1a2e", letterSpacing: -2, marginBottom: 4 }}>
          How to Play
        </div>
        <div style={{ fontSize: 13, color: "#1a1a2e", opacity: 0.5, marginBottom: 24 }}>
          DRIFT is an interactive story. Here&apos;s how to explore it.
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {CONTROLS.map((ctrl, i) => (
            <div
              key={i}
              ref={(el) => { cardsRef.current[i] = el; }}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "10px 14px", borderRadius: 10,
                background: i % 2 === 0 ? "#fdf6e3" : "#fff",
                border: "1px solid #e5e7eb",
              }}
            >
              <span style={{ fontSize: 18, width: 28, textAlign: "center" }}>{ctrl.icon}</span>
              <div style={{ flex: 1 }}>
                <kbd style={{
                  padding: "3px 10px", border: "1.5px solid #1a1a2e", borderRadius: 6,
                  fontSize: 12, fontFamily: "monospace", fontWeight: 700, color: "#1a1a2e",
                  background: "#fff", boxShadow: "1px 1px 0 #1a1a2e",
                }}>
                  {ctrl.key}
                </kbd>
              </div>
              <span style={{ fontSize: 13, color: "#1a1a2e", opacity: 0.7 }}>{ctrl.action}</span>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 24, padding: "12px 16px", borderRadius: 10,
          background: "#fdf6e3", border: "1px dashed #d1d5db",
          fontSize: 12, color: "#1a1a2e", opacity: 0.6, textAlign: "center",
        }}>
          Type secret words like &ldquo;wind&rdquo;, &ldquo;fold&rdquo;, or &ldquo;milo&rdquo; for hidden surprises
        </div>

        <button onClick={handleClose} style={{
          marginTop: 20, width: "100%", background: "#1a1a2e", color: "#fff",
          border: "none", borderRadius: 12, padding: "12px 0", fontSize: 14,
          fontFamily: "Georgia, serif", cursor: "pointer", fontWeight: 600,
          boxShadow: "3px 3px 0 #6b7280", transition: "transform 0.15s, box-shadow 0.15s",
        }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translate(-1px,-1px)"; e.currentTarget.style.boxShadow = "4px 4px 0 #6b7280"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translate(0,0)"; e.currentTarget.style.boxShadow = "3px 3px 0 #6b7280"; }}
        >
          Got it, let&apos;s go!
        </button>
      </div>
    </div>
  );
}
