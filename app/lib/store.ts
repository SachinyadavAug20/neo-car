"use client";

import { create } from "zustand";
import { ISLANDS, type Island } from "./types";

export interface WorldNote {
  id: string;
  text: string;
  color: string;
  position: [number, number, number];
  rotation: [number, number, number];
  createdAt: number;
}

export interface Collectible {
  id: string;
  position: [number, number, number];
  collected: boolean;
}

interface AppState {
  activeIsland: Island | null;
  setActiveIsland: (island: Island | null) => void;
  isTransitioning: boolean;
  setIsTransitioning: (v: boolean) => void;
  loaded: boolean;
  setLoaded: () => void;
  hoveredIsland: string | null;
  setHoveredIsland: (id: string | null) => void;

  notes: WorldNote[];
  addNote: (note: WorldNote) => void;
  removeNote: (id: string) => void;
  editingNoteId: string | null;
  setEditingNoteId: (id: string | null) => void;

  collectibles: Collectible[];
  setCollectibles: (c: Collectible[]) => void;
  collectItem: (id: string) => void;
  collectedCount: number;

  isPlacingNote: boolean;
  setIsPlacingNote: (v: boolean) => void;
  notePlacementColor: string;
  setNotePlacementColor: (c: string) => void;

  audioEnabled: boolean;
  toggleAudio: () => void;

  dayPhase: number;
  setDayPhase: (v: number) => void;

  showMinimap: boolean;
  toggleMinimap: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  activeIsland: null,
  setActiveIsland: (island) => set({ activeIsland: island }),
  isTransitioning: false,
  setIsTransitioning: (v) => set({ isTransitioning: v }),
  loaded: false,
  setLoaded: () => set({ loaded: true }),
  hoveredIsland: null,
  setHoveredIsland: (id) => set({ hoveredIsland: id }),

  notes: [],
  addNote: (note) => set((s) => ({ notes: [...s.notes, note] })),
  removeNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
  editingNoteId: null,
  setEditingNoteId: (id) => set({ editingNoteId: id }),

  collectibles: [],
  setCollectibles: (c) => set({ collectibles: c }),
  collectItem: (id) =>
    set((s) => ({
      collectibles: s.collectibles.map((c) =>
        c.id === id ? { ...c, collected: true } : c,
      ),
      collectedCount: s.collectedCount + 1,
    })),
  collectedCount: 0,

  isPlacingNote: false,
  setIsPlacingNote: (v) => set({ isPlacingNote: v }),
  notePlacementColor: "#fde68a",
  setNotePlacementColor: (c) => set({ notePlacementColor: c }),

  audioEnabled: false,
  toggleAudio: () => set((s) => ({ audioEnabled: !s.audioEnabled })),

  dayPhase: 0,
  setDayPhase: (v) => set({ dayPhase: v }),

  showMinimap: false,
  toggleMinimap: () => set((s) => ({ showMinimap: !s.showMinimap })),
}));

export const useAppStore = useStore;
