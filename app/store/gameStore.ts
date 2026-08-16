import { createStore } from "zustand/vanilla";

const MAX_LOG = 5;
const STARTING_MEMORY = 100;

type GameStateValue = "menu" | "playing" | "gameover";

interface GameState {
  score: number;
  memory: number;
  panicked: boolean;
  sessionId: number;
  gameState: GameStateValue;
  log: string[];
  incrementScore: () => void;
  subtractScore: (amount: number) => void;
  damageMemory: (amount: number) => void;
  resetScore: () => void;
  startGame: () => void;
  triggerGameOver: () => void;
  returnToMenu: () => void;
  addLog: (msg: string) => void;
}

export const gameStore = createStore<GameState>((set) => ({
  score: 0,
  memory: STARTING_MEMORY,
  panicked: false,
  sessionId: 0,
  gameState: "menu",
  log: [],
  incrementScore: () => set((state) => ({ score: state.score + 1 })),
  subtractScore: (amount) =>
    set((state) => ({ score: Math.max(0, state.score - amount) })),
  damageMemory: (amount) =>
    set((state) => {
      const memory = Math.max(0, state.memory - amount);
      if (memory === 0) {
        return { memory, panicked: true, gameState: "gameover" };
      }
      return { memory };
    }),
  resetScore: () => set({ score: 0 }),
  startGame: () =>
    set((state) => ({
      gameState: "playing",
      score: 0,
      memory: STARTING_MEMORY,
      panicked: false,
      sessionId: state.sessionId + 1,
      log: [...state.log, "[SYS] NEON_DRIVE.BIN EXECUTED"].slice(-MAX_LOG),
    })),
  triggerGameOver: () => set({ gameState: "gameover" }),
  returnToMenu: () =>
    set((state) => ({
      gameState: "menu",
      score: 0,
      memory: STARTING_MEMORY,
      panicked: false,
      sessionId: state.sessionId + 1,
    })),
  addLog: (msg) =>
    set((state) => ({ log: [...state.log, msg].slice(-MAX_LOG) })),
}));