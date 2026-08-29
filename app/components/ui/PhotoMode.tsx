"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import gsap from "gsap";

interface PhotoModeProps {
  active: boolean;
  onClose: () => void;
}

export default function PhotoMode({ active, onClose }: PhotoModeProps) {
  const [showGrid, setShowGrid] = useState(true);
  const [flash, setFlash] = useState(false);
  const [capturedCount, setCapturedCount] = useState(0);
  const [notification, setNotification] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (active) {
      window.dispatchEvent(new CustomEvent("camera-focus"));
      if (containerRef.current) {
        gsap.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      }
    }
  }, [active]);

  const capturePhoto = useCallback(() => {
    setFlash(true);
    window.dispatchEvent(new CustomEvent("camera-shutter"));
    setTimeout(() => setFlash(false), 200);

    // Find the Three.js WebGL canvas
    const canvas = document.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) return;

    try {
      // Create an offscreen canvas to compose a framed photo
      const offscreen = document.createElement("canvas");
      const pad = 40;
      const bottomPad = 100;
      offscreen.width = canvas.width + pad * 2;
      offscreen.height = canvas.height + pad + bottomPad;
      const ctx = offscreen.getContext("2d");
      if (!ctx) return;

      // Draw paper background
      ctx.fillStyle = "#fdf6e3";
      ctx.fillRect(0, 0, offscreen.width, offscreen.height);

      // Draw canvas image
      ctx.drawImage(canvas, pad, pad, canvas.width, canvas.height);

      // Draw thin ink border around image
      ctx.strokeStyle = "#1a1a2e";
      ctx.lineWidth = 4;
      ctx.strokeRect(pad, pad, canvas.width, canvas.height);

      // Draw Polaroid text
      ctx.fillStyle = "#1a1a2e";
      ctx.font = "bold 28px Georgia, serif";
      ctx.fillText("DRIFT — A Paper World", pad + 10, canvas.height + pad + 45);

      ctx.font = "16px monospace";
      ctx.fillStyle = "#78716c";
      const now = new Date().toLocaleDateString(undefined, {
        year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      });
      ctx.fillText(now, pad + 10, canvas.height + pad + 75);

      // Download
      const link = document.createElement("a");
      link.download = `drift-photo-${Date.now()}.png`;
      link.href = offscreen.toDataURL("image/png");
      link.click();

      setCapturedCount(prev => prev + 1);
      setNotification("Photo saved to downloads!");
      setTimeout(() => setNotification(null), 3000);
    } catch {
      // Direct canvas fallback
      const link = document.createElement("a");
      link.download = `drift-photo-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "p" || e.key === "P") {
        e.preventDefault();
        onClose();
      } else if (e.key === "g" || e.key === "G") {
        setShowGrid(prev => !prev);
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        capturePhoto();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, onClose, capturePhoto]);

  if (!active) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed", inset: 0, zIndex: 150,
        pointerEvents: "none",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: 32, boxSizing: "border-box",
      }}
    >
      {/* Flash overlay */}
      {flash && (
        <div style={{
          position: "fixed", inset: 0, background: "white", zIndex: 200, opacity: 0.9,
          transition: "opacity 0.2s ease-out", pointerEvents: "none",
        }} />
      )}

      {/* Top Bar */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        pointerEvents: "auto",
      }}>
        <div style={{
          display: "flex", gap: 12, alignItems: "center",
          background: "rgba(26, 26, 46, 0.75)", backdropFilter: "blur(8px)",
          border: "1.5px solid rgba(255, 255, 255, 0.2)", borderRadius: 10,
          padding: "6px 14px", color: "#fdf6e3", fontSize: 12, fontFamily: "monospace",
        }}>
          <span style={{ fontWeight: "bold", color: "#fbbf24" }}>[REC]</span>
          <span>PHOTO MODE</span>
          <span>&middot;</span>
          <span>35mm F/2.8</span>
          <span>&middot;</span>
          <span>ISO 100</span>
          <span>&middot;</span>
          <span>1/500s</span>
        </div>

        <button
          onClick={onClose}
          style={{
            background: "rgba(26, 26, 46, 0.75)", backdropFilter: "blur(8px)",
            border: "1.5px solid rgba(255, 255, 255, 0.2)", borderRadius: 10,
            padding: "8px 16px", color: "#fdf6e3", fontSize: 12, fontFamily: "sans-serif",
            cursor: "pointer", fontWeight: 600,
          }}
        >
          Exit (Esc / P)
        </button>
      </div>

      {/* Viewfinder Frame & Corners */}
      <div style={{
        position: "absolute", inset: 40, pointerEvents: "none",
        border: "1px solid rgba(255, 255, 255, 0.15)",
      }}>
        {/* Top-Left Corner */}
        <div style={{ position: "absolute", top: -2, left: -2, width: 24, height: 24, borderTop: "3px solid #fbbf24", borderLeft: "3px solid #fbbf24" }} />
        {/* Top-Right Corner */}
        <div style={{ position: "absolute", top: -2, right: -2, width: 24, height: 24, borderTop: "3px solid #fbbf24", borderRight: "3px solid #fbbf24" }} />
        {/* Bottom-Left Corner */}
        <div style={{ position: "absolute", bottom: -2, left: -2, width: 24, height: 24, borderBottom: "3px solid #fbbf24", borderLeft: "3px solid #fbbf24" }} />
        {/* Bottom-Right Corner */}
        <div style={{ position: "absolute", bottom: -2, right: -2, width: 24, height: 24, borderBottom: "3px solid #fbbf24", borderRight: "3px solid #fbbf24" }} />

        {/* Center Crosshair */}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 20, height: 20 }}>
          <div style={{ position: "absolute", top: 9, left: 0, right: 0, height: 2, background: "rgba(255, 255, 255, 0.4)" }} />
          <div style={{ position: "absolute", top: 0, bottom: 0, left: 9, width: 2, background: "rgba(255, 255, 255, 0.4)" }} />
        </div>

        {/* Rule of Thirds Grid */}
        {showGrid && (
          <>
            <div style={{ position: "absolute", top: "33.33%", left: 0, right: 0, height: 1, background: "rgba(255, 255, 255, 0.1)" }} />
            <div style={{ position: "absolute", top: "66.66%", left: 0, right: 0, height: 1, background: "rgba(255, 255, 255, 0.1)" }} />
            <div style={{ position: "absolute", left: "33.33%", top: 0, bottom: 0, width: 1, background: "rgba(255, 255, 255, 0.1)" }} />
            <div style={{ position: "absolute", left: "66.66%", top: 0, bottom: 0, width: 1, background: "rgba(255, 255, 255, 0.1)" }} />
          </>
        )}
      </div>

      {/* Notification toast */}
      {notification && (
        <div style={{
          alignSelf: "center",
          background: "#16a34a", color: "white", padding: "8px 20px",
          borderRadius: 8, fontSize: 13, fontWeight: "bold",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        }}>
          {notification}
        </div>
      )}

      {/* Bottom Controls */}
      <div style={{
        display: "flex", justifyContent: "center", alignItems: "center", gap: 16,
        pointerEvents: "auto",
      }}>
        <button
          onClick={() => setShowGrid(prev => !prev)}
          style={{
            background: showGrid ? "rgba(251, 191, 36, 0.2)" : "rgba(26, 26, 46, 0.75)",
            border: `1.5px solid ${showGrid ? "#fbbf24" : "rgba(255, 255, 255, 0.2)"}`,
            borderRadius: 10, padding: "10px 18px", color: showGrid ? "#fbbf24" : "#fdf6e3",
            fontSize: 12, fontFamily: "monospace", cursor: "pointer", fontWeight: 600,
          }}
        >
          Grid (G): {showGrid ? "ON" : "OFF"}
        </button>

        {/* Shutter Button */}
        <button
          onClick={capturePhoto}
          style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "#fff", border: "4px solid #1a1a2e",
            boxShadow: "0 0 0 3px #fbbf24, 0 4px 16px rgba(0,0,0,0.3)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform 0.1s, box-shadow 0.1s",
          }}
          onMouseDown={e => { e.currentTarget.style.transform = "scale(0.92)"; }}
          onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
          title="Take Photo (Space / Enter)"
        >
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#ef4444" }} />
        </button>

        <div style={{
          background: "rgba(26, 26, 46, 0.75)", backdropFilter: "blur(8px)",
          border: "1.5px solid rgba(255, 255, 255, 0.2)", borderRadius: 10,
          padding: "10px 16px", color: "#fdf6e3", fontSize: 12, fontFamily: "monospace",
        }}>
          Photos: {capturedCount}
        </div>
      </div>
    </div>
  );
}
