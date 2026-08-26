"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";

export default function LoadingScreen() {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress bar
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) { clearInterval(interval); return 100; }
        return prev + Math.random() * 15 + 5;
      });
    }, 200);

    // Animate text
    if (textRef.current) {
      gsap.fromTo(textRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out", delay: 0.3 }
      );
    }

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        background: "#fdf6e3", fontFamily: "Georgia, serif",
      }}
    >
      {/* Paper crane SVG */}
      <div style={{ marginBottom: 32, opacity: 0.6 }}>
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
          <path d="M30 8 L52 30 L30 26 L8 30 Z" fill="#1a1a2e" opacity="0.8"/>
          <path d="M30 26 L30 52" stroke="#1a1a2e" stroke-width="2"/>
          <path d="M30 26 L52 30 L44 42" fill="#1a1a2e" opacity="0.6"/>
          <path d="M30 26 L8 30 L16 42" fill="#1a1a2e" opacity="0.6"/>
        </svg>
      </div>

      <div ref={textRef} style={{ textAlign: "center", opacity: 0 }}>
        <div style={{ fontSize: 32, fontWeight: "bold", color: "#1a1a2e", letterSpacing: -2, marginBottom: 8 }}>
          DRIFT
        </div>
        <div style={{ fontSize: 13, color: "#1a1a2e", opacity: 0.5, marginBottom: 24, fontStyle: "italic" }}>
          Loading the paper world...
        </div>

        {/* Progress bar */}
        <div style={{
          width: 200, height: 4, background: "#e5e7eb", borderRadius: 2,
          overflow: "hidden", margin: "0 auto",
        }}>
          <div
            ref={progressRef}
            style={{
              width: `${Math.min(progress, 100)}%`, height: "100%",
              background: "#1a1a2e", borderRadius: 2,
              transition: "width 0.3s ease-out",
            }}
          />
        </div>

        <div style={{ fontSize: 11, color: "#1a1a2e", opacity: 0.3, marginTop: 12 }}>
          {Math.min(Math.round(progress), 100)}%
        </div>
      </div>

      {/* Bottom hint */}
      <div style={{
        position: "absolute", bottom: 24, fontSize: 11, color: "#1a1a2e", opacity: 0.25,
      }}>
        Best experienced on desktop with sound
      </div>
    </div>
  );
}
