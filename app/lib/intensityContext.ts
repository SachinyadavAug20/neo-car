"use client";

import { createContext, useContext } from "react";

export type IntensityMode = "chill" | "intense";

interface IntensityContextValue {
  mode: IntensityMode;
  setMode: (mode: IntensityMode) => void;
}

export const IntensityContext = createContext<IntensityContextValue>({
  mode: "chill",
  setMode: () => undefined,
});

export function useIntensity(): IntensityContextValue {
  return useContext(IntensityContext);
}

export function intensityBoost(mode: IntensityMode): number {
  return mode === "intense" ? 1.5 : 1;
}