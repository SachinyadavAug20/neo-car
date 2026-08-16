import { createStore } from "zustand/vanilla";

export type GraphicsState = "ok" | "lost" | "unavailable";

export interface GraphicsDiagnostic {
  webgl2: boolean;
  webgl1: boolean;
  renderer: string;
  support: string;
}

interface GraphicsStateStore {
  state: GraphicsState;
  diagnostic: GraphicsDiagnostic | null;
  setLost: () => void;
  setUnavailable: () => void;
  setDiagnostic: (diagnostic: GraphicsDiagnostic) => void;
  reset: () => void;
}

export const contextStore = createStore<GraphicsStateStore>((set) => ({
  state: "ok",
  diagnostic: null,
  setLost: () => set({ state: "lost" }),
  setUnavailable: () => set({ state: "unavailable" }),
  setDiagnostic: (diagnostic) => set({ diagnostic }),
  reset: () => set({ state: "ok" }),
}));