"use client";

import { useRef, useEffect, useCallback } from "react";

/**
 * Tracks mouse position and dispatches parallax events
 * for paper layers to react to cursor movement.
 */
export function useMouseParallax() {
  const mouseRef = useRef({ x: 0, y: 0, nx: 0, ny: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.nx = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.ny = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return mouseRef;
}

/**
 * Keyboard secrets — type specific words to trigger hidden events.
 * Words: "wind", "paper", "fold", "pip", "milo", "crane", "sage", "sudo", "help"
 */
export function useKeyboardSecrets(onSecret: (word: string) => void) {
  const bufferRef = useRef<string[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const SECRET_WORDS = ["wind", "paper", "fold", "pip", "milo", "crane", "sage", "sudo", "help", "drift"];

  const checkBuffer = useCallback(() => {
    const word = bufferRef.current.join("").toLowerCase();
    for (const secret of SECRET_WORDS) {
      if (word.endsWith(secret)) {
        onSecret(secret);
        bufferRef.current = [];
        return;
      }
    }
  }, [onSecret]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Skip if typing in input
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length !== 1) return;

      bufferRef.current.push(e.key);
      if (bufferRef.current.length > 12) bufferRef.current.shift();

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => { bufferRef.current = []; }, 2000);

      checkBuffer();
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [checkBuffer]);
}
