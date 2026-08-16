import { createStore } from "zustand/vanilla";

const MAX_LOG = 5;
const STARTING_MEMORY = 100;
const OOB_TIMER_START = 10.0;

type GameStateValue = "boot" | "playing" | "gameover";

interface GameState {
  score: number;
  memory: number;
  panicked: boolean;
  sessionId: number;
  gameState: GameStateValue;
  log: string[];
  highScore: number;
  outOfBounds: boolean;
  oobTimer: number;
  oobTimerActive: boolean;
  incrementScore: () => void;
  subtractScore: (amount: number) => void;
  damageMemory: (amount: number) => void;
  resetScore: () => void;
  startGame: () => void;
  triggerGameOver: () => void;
  resetGame: () => void;
  reboot: () => void;
  addLog: (msg: string) => void;
  setOutOfBounds: (isOOB: boolean) => void;
  updateOobTimer: (delta: number) => void;
  resetOobTimer: () => void;
  checkAndSetHighScore: () => void;
}

export const gameStore = createStore<GameState>((set) => ({
  score: 0,
  memory: STARTING_MEMORY,
  panicked: false,
  sessionId: 0,
  gameState: "boot",
  log: [],
  highScore: 0,
  outOfBounds: false,
  oobTimer: OOB_TIMER_START,
  oobTimerActive: false,
  incrementScore: () => set((state) => ({ score: state.score + 1 })),
  subtractScore: (amount) =>
    set((state) => ({ score: Math.max(0, state.score - amount) })),
  damageMemory: (amount) =>
    set((state) => {
      const memory = Math.max(0, state.memory - amount);
      if (memory === 0) {
        return {
          memory,
          panicked: true,
          gameState: "gameover",
          highScore: Math.max(state.highScore, state.score),
        };
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
      highScore: Math.max(state.highScore, state.score),
      outOfBounds: false,
      oobTimer: OOB_TIMER_START,
      oobTimerActive: false,
      log: [...state.log, "[SYS] NEON_DRIVE.BIN EXECUTED"].slice(-MAX_LOG),
    })),
  triggerGameOver: () => set({ gameState: "gameover" }),
  resetGame: () =>
    set((state) => ({
      gameState: "boot",
      score: 0,
      memory: STARTING_MEMORY,
      panicked: false,
      sessionId: state.sessionId + 1,
      highScore: Math.max(state.highScore, state.score),
      outOfBounds: false,
      oobTimer: OOB_TIMER_START,
      oobTimerActive: false,
    })),
  reboot: () =>
    set((state) => ({
      score: 0,
      memory: STARTING_MEMORY,
      panicked: false,
      sessionId: state.sessionId + 1,
      gameState: "playing",
      highScore: Math.max(state.highScore, state.score),
      outOfBounds: false,
      oobTimer: OOB_TIMER_START,
      oobTimerActive: false,
      log: [...state.log, "[SYS] REBOOT SEQUENCE INITIATED"].slice(-MAX_LOG),
    })),
  addLog: (msg) =>
    set((state) => ({ log: [...state.log, msg].slice(-MAX_LOG) })),
  setOutOfBounds: (isOOB) =>
    set((state) => {
      if (isOOB && !state.outOfBounds) {
        return { outOfBounds: true, oobTimerActive: true, oobTimer: OOB_TIMER_START };
      }
      if (!isOOB && state.outOfBounds) {
        return { outOfBounds: false, oobTimerActive: false, oobTimer: OOB_TIMER_START };
      }
      return {};
    }),
  updateOobTimer: (delta) =>
    set((state) => {
      if (!state.oobTimerActive) return {};
      const newTimer = state.oobTimer - delta;
      if (newTimer <= 0) {
        return {
          oobTimer: 0,
          oobTimerActive: false,
          outOfBounds: false,
          panicked: true,
          gameState: "gameover",
          highScore: Math.max(state.highScore, state.score),
        };
      }
      return { oobTimer: newTimer };
    }),
  resetOobTimer: () =>
    set({ outOfBounds: false, oobTimerActive: false, oobTimer: OOB_TIMER_START }),
  checkAndSetHighScore: () =>
    set((state) => ({ highScore: Math.max(state.highScore, state.score) })),
}));