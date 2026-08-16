import { createStore } from "zustand/vanilla";

export type GraphicsState = "ok" | "lost" | "unavailable";

interface GraphicsStateStore {
  state: GraphicsState;
  setLost: () => void;
  setUnavailable: () => void;
  reset: () => void;
}

export const contextStore = createStore<GraphicsStateStore>((set) => ({
  state: "ok",
  setLost: () => set({ state: "lost" }),
  setUnavailable: () => set({ state: "unavailable" }),
  reset: () => set({ state: "ok" }),
}));