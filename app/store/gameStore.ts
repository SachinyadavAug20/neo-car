import { createStore } from "zustand/vanilla";

const MAX_LOG = 5;

interface GameState {
  score: number;
  log: string[];
  incrementScore: () => void;
  subtractScore: (amount: number) => void;
  resetScore: () => void;
  addLog: (msg: string) => void;
}

export const gameStore = createStore<GameState>((set) => ({
  score: 0,
  log: [],
  incrementScore: () => set((state) => ({ score: state.score + 1 })),
  subtractScore: (amount) =>
    set((state) => ({ score: Math.max(0, state.score - amount) })),
  resetScore: () => set({ score: 0 }),
  addLog: (msg) =>
    set((state) => ({ log: [...state.log, msg].slice(-MAX_LOG) })),
}));