"use client";

import { useEffect } from "react";
import { useStore } from "zustand";
import { gameStore } from "../store/gameStore";

const TERMINAL_FONT =
  "var(--font-geist-mono), 'Fira Code', 'JetBrains Mono', monospace";

export default function MainMenu() {
  const gameState = useStore(gameStore, (state) => state.gameState);

  useEffect(() => {
    if (gameState !== "menu") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") gameStore.getState().startGame();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [gameState]);

  if (gameState !== "menu") return null;

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-[#050505]/80 backdrop-blur-md"
      style={{ fontFamily: TERMINAL_FONT, color: "#cad3f5" }}
    >
      <div className="flex flex-col items-center gap-6 text-center">
        <p className="text-[10px] font-bold tracking-[0.25em] text-[#cba6f7] sm:text-sm">
          +---[ MEOW_TUI OS ]---+
        </p>
        <h1 className="text-4xl font-black tracking-[0.2em] text-[#b4befe] drop-shadow-[0_0_16px_rgba(180,190,254,0.6)] sm:text-7xl">
          &gt; NEON_DRIVE
        </h1>
        <p className="max-w-md text-xs leading-relaxed tracking-[0.15em] text-[#a5adcb] sm:text-sm">
          AN ENDLESS BIOLUMINESCENT FLIGHT THROUGH THE DATA STREAM
        </p>
        <p className="animate-pulse text-sm font-bold tracking-[0.3em] text-[#94e2d5] sm:text-base">
          [ PRESS ENTER TO BOOT ]
        </p>
      </div>
    </div>
  );
}