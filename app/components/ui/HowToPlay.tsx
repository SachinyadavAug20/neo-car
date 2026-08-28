"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";

interface HowToPlayProps {
  onClose: () => void;
}

const CONTROLS = [
  { key: "W A S D", action: "Move camera" },
  { key: "Click", action: "Interact with objects" },
  { key: "Hover", action: "Discover hidden things" },
  { key: "Space / Enter", action: "Advance story" },
  { key: "J K H L", action: "Vim-style movement" },
  { key: "Shift", action: "Sprint faster" },
  { key: "Ctrl K", action: "Command palette" },
  { key: "Type words", action: "Secret discoveries" },
];

export default function HowToPlay({ onClose }: HowToPlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25 });
    }
    cardsRef.current.forEach((card, i) => {
      if (card) {
        gsap.fromTo(card,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.3, delay: 0.08 + i * 0.04, ease: "power2.out" }
        );
      }
    });
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleClose = () => {
    if (containerRef.current) {
      gsap.to(containerRef.current, { opacity: 0, duration: 0.15, onComplete: onClose });
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="How to Play"
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(253, 246, 227, 0.88)", backdropFilter: "blur(10px)",
      }}
    >
      <div style={{
        background: "#fff", border: "2px solid #1a1a2e", borderRadius: 16,
        padding: "36px 40px", boxShadow: "6px 6px 0 #1a1a2e",
        maxWidth: 440, width: "90%", position: "relative",
      }}>
        <button onClick={handleClose} style={{
          position: "absolute", top: 12, right: 12, background: "none", border: "none",
          fontSize: 18, cursor: "pointer", color: "#1a1a2e", opacity: 0.3, padding: 4,
        }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.3")}
        >
          x
        </button>

        <div style={{ fontSize: 22, fontWeight: "bold", color: "#1a1a2e", letterSpacing: -1, marginBottom: 4 }}>
          How to Play
        </div>
        <div style={{ fontSize: 13, color: "#1a1a2e", opacity: 0.45, marginBottom: 24 }}>
          DRIFT is an interactive story. Here&apos;s how to explore it.
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          {CONTROLS.map((ctrl, i) => (
            <div
              key={i}
              ref={(el) => { cardsRef.current[i] = el; }}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "10px 14px", borderRadius: 10,
                background: i % 2 === 0 ? "#fdf6e3" : "#fff",
                border: "1px solid #e5e7eb",
                opacity: 0,
              }}
            >
              <kbd style={{
                padding: "3px 10px", border: "1.5px solid #1a1a2e", borderRadius: 6,
                fontSize: 11, fontFamily: "monospace", fontWeight: 700, color: "#1a1a2e",
                background: "#fff", boxShadow: "1px 1px 0 #1a1a2e",
                flexShrink: 0, minWidth: 90, textAlign: "center",
              }}>
                {ctrl.key}
              </kbd>
              <span style={{ fontSize: 13, color: "#1a1a2e", opacity: 0.6 }}>{ctrl.action}</span>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 20, padding: "12px 16px", borderRadius: 10,
          background: "#fdf6e3", border: "1px dashed #d1d5db",
          fontSize: 12, color: "#1a1a2e", opacity: 0.5, textAlign: "center",
        }}>
          Type secret words like &ldquo;wind&rdquo;, &ldquo;fold&rdquo;, or &ldquo;milo&rdquo; for hidden surprises
        </div>

        <button onClick={handleClose} style={{
          marginTop: 20, width: "100%", background: "#1a1a2e", color: "#fff",
          border: "none", borderRadius: 10, padding: "12px 0", fontSize: 14,
          fontFamily: "Georgia, serif", cursor: "pointer", fontWeight: 700,
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
