"use client";

import { create } from "zustand";

export type AppRoute = "/" | "/garage" | "/drive";
export type ThemeId = "midnight" | "vaporwave" | "matrix";

export interface ThemeConfig {
  name: string;
  primary: [number, number, number];
  secondary: [number, number, number];
  accent: [number, number, number];
  emissive: string;
  fogColor: string;
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  midnight: {
    name: "MIDNIGHT OBSIDIAN",
    primary: [0.54, 0.67, 0.96],
    secondary: [0.76, 0.49, 0.93],
    accent: [0.65, 0.89, 0.63],
    emissive: "#8aadf4",
    fogColor: "#0b0f19",
  },
  vaporwave: {
    name: "VAPORWAVE PINK",
    primary: [0.95, 0.27, 0.37],
    secondary: [0.97, 0.76, 0.65],
    accent: [0.65, 0.89, 0.63],
    emissive: "#f38ba8",
    fogColor: "#0f0515",
  },
  matrix: {
    name: "MATRIX CYAN",
    primary: [0.65, 0.89, 0.63],
    secondary: [0.53, 0.84, 0.77],
    accent: [0.97, 0.86, 0.67],
    emissive: "#a6e3a1",
    fogColor: "#050f08",
  },
};

export interface AudioData {
  bass: number;
  mids: number;
  highs: number;
}

export interface GameStats {
  speed: number;
  isOOB: boolean;
  carPosition: [number, number, number];
}

interface AppState {
  currentRoute: AppRoute;
  setRoute: (route: AppRoute) => void;

  audioData: AudioData;
  setAudioData: (data: AudioData) => void;

  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;

  progress: number;
  setProgress: (progress: number) => void;

  currentTrackIndex: number;
  setCurrentTrackIndex: (index: number) => void;

  gameStats: GameStats;
  setGameStats: (stats: Partial<GameStats>) => void;

  speedMultiplier: number;
  setSpeedMultiplier: (s: number) => void;

  activeTheme: ThemeId;
  setTheme: (theme: ThemeId) => void;

  scrollProgress: number;
  scrollVelocity: number;
  setScrollMetrics: (progress: number, velocity: number) => void;

  pointerX: number;
  pointerY: number;
  setPointer: (x: number, y: number) => void;

  cameraTarget: [number, number, number];
  cameraLookTarget: [number, number, number];
  cameraFovTarget: number;
  setCameraTarget: (
    pos: [number, number, number],
    look: [number, number, number],
    fov: number,
  ) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentRoute: "/",
  setRoute: (route) => set({ currentRoute: route }),

  audioData: { bass: 0, mids: 0, highs: 0 },
  setAudioData: (audioData) => set({ audioData }),

  isPlaying: false,
  setIsPlaying: (isPlaying) => set({ isPlaying }),

  progress: 0,
  setProgress: (progress) => set({ progress }),

  currentTrackIndex: 0,
  setCurrentTrackIndex: (currentTrackIndex) => set({ currentTrackIndex }),

  gameStats: {
    speed: 0,
    isOOB: false,
    carPosition: [0, 15, 0],
  },
  setGameStats: (stats) =>
    set((state) => ({ gameStats: { ...state.gameStats, ...stats } })),

  speedMultiplier: 1,
  setSpeedMultiplier: (speedMultiplier) => set({ speedMultiplier }),

  activeTheme: "midnight" as ThemeId,
  setTheme: (activeTheme) => set({ activeTheme }),

  scrollProgress: 0,
  scrollVelocity: 0,
  setScrollMetrics: (scrollProgress, scrollVelocity) =>
    set({ scrollProgress, scrollVelocity }),

  pointerX: 0,
  pointerY: 0,
  setPointer: (pointerX, pointerY) => set({ pointerX, pointerY }),

  cameraTarget: [0, 8, 26],
  cameraLookTarget: [0, 3, 15],
  cameraFovTarget: 50,
  setCameraTarget: (cameraTarget, cameraLookTarget, cameraFovTarget) =>
    set({ cameraTarget, cameraLookTarget, cameraFovTarget }),
}));
