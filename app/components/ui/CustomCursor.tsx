"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";

type CursorState = "default" | "inspect" | "grab" | "interact" | "magnify" | "pointer";

const CURSOR_SVGS: Record<CursorState, string> = {
  default: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 3l14 8-6 1-3 6z" fill="white" stroke="white" stroke-width="1.5"/></svg>`,
  inspect: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="11" cy="11" r="7" stroke="white" stroke-width="2.5"/><line x1="16" y1="16" x2="24" y2="24" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  grab: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2v6m0 0l-2 2m2-2l2 2M8 10h8v2a4 4 0 01-4 4h0a4 4 0 01-4-4v-2zm0 0V6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  interact: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" fill="#fbbf24" stroke="white" stroke-width="2"/><circle cx="12" cy="12" r="8" stroke="white" stroke-width="1.5" stroke-dasharray="3 3"/></svg>`,
  magnify: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="13" cy="13" r="8" stroke="white" stroke-width="2.5" fill="rgba(251,191,36,0.15)"/><line x1="19" y1="19" x2="28" y2="28" stroke="white" stroke-width="2.5" stroke-linecap="round"/><path d="M10 13h6M13 10v6" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  pointer: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 3l14 8-6 1-3 6z" fill="#fbbf24" stroke="white" stroke-width="2"/></svg>`,
};

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const [cursorState, setCursorState] = useState<CursorState>("default");
  const [cursorLabel, setCursorLabel] = useState<string | null>(null);

  const updateCursorState = useCallback((state: CursorState, label?: string) => {
    setCursorState(state);
    setCursorLabel(label || null);
    document.body.style.cursor = "none";
  }, []);

  useEffect(() => {
    document.body.style.cursor = "none";

    const onMouseMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (cursorRef.current) {
        gsap.set(cursorRef.current, { x: e.clientX, y: e.clientY, xPercent: -50, yPercent: -50 });
      }
      if (ringRef.current) {
        gsap.to(ringRef.current, { x: e.clientX, y: e.clientY, xPercent: -50, yPercent: -50, duration: 0.2, ease: "power2.out" });
      }
      if (labelRef.current) {
        gsap.to(labelRef.current, { x: e.clientX + 16, y: e.clientY + 12, duration: 0.15, ease: "power2.out" });
      }
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || target === document.body || target === document.documentElement) return;

      // Check data-cursor attribute on elements
      const cursorEl = target.closest("[data-cursor]") as HTMLElement;
      if (cursorEl) {
        updateCursorState(cursorEl.dataset.cursor as CursorState, cursorEl.dataset.cursorLabel);
        return;
      }

      // Auto-detect based on element type
      if (target.closest("button, a, [role='button']")) {
        updateCursorState("pointer");
      } else if (target.closest("input, textarea, select")) {
        updateCursorState("inspect");
      } else {
        updateCursorState("default");
      }
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mouseover", onMouseOver, { passive: true });

    // Listen for cursor state events from 3D scene
    const onCursorChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const state = detail?.cursor as CursorState;
      const label = detail?.label as string | undefined;
      if (state) updateCursorState(state, label);
    };
    window.addEventListener("cursor-change", onCursorChange);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseover", onMouseOver);
      window.removeEventListener("cursor-change", onCursorChange);
      document.body.style.cursor = "default";
    };
  }, [updateCursorState]);

  return (
    <>
      <div
        ref={cursorRef}
        style={{
          position: "fixed", top: 0, left: 0, zIndex: 9999,
          pointerEvents: "none", mixBlendMode: "difference",
          transition: "transform 0.05s linear",
        }}
        dangerouslySetInnerHTML={{ __html: CURSOR_SVGS[cursorState] }}
      />
      <div
        ref={ringRef}
        style={{
          position: "fixed", top: 0, left: 0, zIndex: 9998,
          pointerEvents: "none",
          width: cursorState === "magnify" ? 44 : cursorState === "interact" ? 38 : 32,
          height: cursorState === "magnify" ? 44 : cursorState === "interact" ? 38 : 32,
          border: `2px solid ${cursorState === "interact" ? "#fbbf24" : "white"}`,
          borderRadius: "50%",
          opacity: 0.5,
          transition: "width 0.2s, height 0.2s, border-color 0.2s",
        }}
      />
      {cursorLabel && (
        <div
          ref={labelRef}
          style={{
            position: "fixed", top: 0, left: 0, zIndex: 9997,
            pointerEvents: "none",
            background: "rgba(26, 26, 46, 0.85)", backdropFilter: "blur(4px)",
            border: "1px solid rgba(255, 255, 255, 0.3)", borderRadius: 6,
            padding: "2px 8px", fontSize: 10, fontFamily: "monospace",
            color: "#fbbf24", fontWeight: 700, letterSpacing: 1,
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          }}
        >
          {cursorLabel}
        </div>
      )}
    </>
  );
}
