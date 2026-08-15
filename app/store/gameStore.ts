import { createStore } from "zustand/vanilla";

const MAX_LOG = 5;
const STARTING_MEMORY = 100;

interface GameState {
  score: number;
  memory: number;
  panicked: boolean;
  sessionId: number;
  log: string[];
  incrementScore: () => void;
  subtractScore: (amount: number) => void;
  damageMemory: (amount: number) => void;
  resetScore: () => void;
  reboot: () => void;
  addLog: (msg: string) => void;
}

export const gameStore = createStore<GameState>((set) => ({
  score: 0,
  memory: STARTING_MEMORY,
  panicked: false,
  sessionId: 0,
  log: [],
  incrementScore: () => set((state) => ({ score: state.score + 1 })),
  subtractScore: (amount) =>
    set((state) => ({ score: Math.max(0, state.score - amount) })),
  damageMemory: (amount) =>
    set((state) => {
      const memory = Math.max(0, state.memory - amount);
      return { memory, panicked: state.panicked || memory === 0 };
    }),
  resetScore: () => set({ score: 0 }),
  reboot: () =>
    set((state) => ({
      score: 0,
      memory: STARTING_MEMORY,
      panicked: false,
      sessionId: state.sessionId + 1,
      log: [
        ...state.log,
        "[SYS] KERNEL_PANIC RECOVERED",
      ].slice(-MAX_LOG),
    })),
  addLog: (msg) =>
    set((state) => ({ log: [...state.log, msg].slice(-MAX_LOG) })),
}));