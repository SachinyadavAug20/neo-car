"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";

export default function LoadingScreen() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) { clearInterval(interval); return 100; }
        return Math.min(prev + Math.random() * 15 + 5, 100);
      });
    }, 200);

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
      role="progressbar"
      aria-valuenow={Math.min(Math.round(progress), 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Loading DRIFT"
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        background: "var(--bg)", fontFamily: "Georgia, serif",
        transition: "background 0.3s ease",
      }}
    >
      <div style={{ marginBottom: 32, opacity: 0.6 }}>
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
          <path d="M30 8 L52 30 L30 26 L8 30 Z" fill="var(--text)" opacity="0.8"/>
          <path d="M30 26 L30 52" stroke="var(--text)" strokeWidth="2"/>
          <path d="M30 26 L52 30 L44 42" fill="var(--text)" opacity="0.6"/>
          <path d="M30 26 L8 30 L16 42" fill="var(--text)" opacity="0.6"/>
        </svg>
      </div>

      <div ref={textRef} style={{ textAlign: "center", opacity: 0 }}>
        <div style={{ fontSize: 32, fontWeight: "bold", color: "var(--text)", letterSpacing: -2, marginBottom: 8, transition: "color 0.3s" }}>
          DRIFT
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", opacity: 0.5, marginBottom: 24, fontStyle: "italic", transition: "color 0.3s" }}>
          Loading the paper world...
        </div>

        <div style={{
          width: 200, height: 4, background: "var(--border-light)", borderRadius: 2,
          overflow: "hidden", margin: "0 auto", transition: "background 0.3s",
        }}>
          <div style={{
            width: `${Math.min(progress, 100)}%`, height: "100%",
            background: "var(--text)", borderRadius: 2,
            transition: "width 0.3s ease-out, background 0.3s",
          }} />
        </div>

        <div style={{ fontSize: 11, color: "var(--text-muted)", opacity: 0.3, marginTop: 12, transition: "color 0.3s" }}>
          {Math.min(Math.round(progress), 100)}%
        </div>
      </div>

      <div style={{
        position: "absolute", bottom: 24, fontSize: 11, color: "var(--text-muted)", opacity: 0.25, transition: "color 0.3s",
      }}>
        Best experienced on desktop with sound
      </div>
    </div>
  );
}
