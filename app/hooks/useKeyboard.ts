"use client";

import { useEffect, useRef } from "react";

export function useKeyboard(): React.RefObject<Set<string>> {
  const keysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);
    };
    const onUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };
    const onBlur = () => {
      keysRef.current.clear();
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  return keysRef;
}