"use client";

import { create } from "zustand";

export type GameMode = "portfolio" | "drive";

interface GameState {
  mode: GameMode;
  setMode: (mode: GameMode) => void;

  scrollProgress: number;
  setScrollProgress: (p: number) => void;

  speedMultiplier: number;
  setSpeedMultiplier: (s: number) => void;

  audioFrequencies: [number, number, number];
  setAudioFrequencies: (f: [number, number, number]) => void;
}

export const useGameStore = create<GameState>((set) => ({
  mode: "portfolio",
  setMode: (mode) => set({ mode }),

  scrollProgress: 0,
  setScrollProgress: (scrollProgress) => set({ scrollProgress }),

  speedMultiplier: 1,
  setSpeedMultiplier: (speedMultiplier) => set({ speedMultiplier }),

  audioFrequencies: [0, 0, 0],
  setAudioFrequencies: (audioFrequencies) => set({ audioFrequencies }),
}));
