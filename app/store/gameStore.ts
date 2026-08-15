import { createStore } from "zustand/vanilla";

interface GameState {
  score: number;
  incrementScore: () => void;
  resetScore: () => void;
}

export const gameStore = createStore<GameState>((set) => ({
  score: 0,
  incrementScore: () => set((state) => ({ score: state.score + 1 })),
  resetScore: () => set({ score: 0 }),
}));