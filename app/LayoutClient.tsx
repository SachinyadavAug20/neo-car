"use client";

import { useState, type ReactNode } from "react";
import SmoothScroll from "./components/providers/SmoothScroll";
import GlobalCanvas from "./components/GlobalCanvas";
import MusicControls from "./components/MusicControls";
import NavBar from "./components/NavBar";
import PageTransition from "./components/PageTransition";
import {
  IntensityContext,
  type IntensityMode,
} from "./lib/intensityContext";

export default function LayoutClient({ children }: { children: ReactNode }) {
  const [intensity, setIntensity] = useState<IntensityMode>("chill");

  return (
    <IntensityContext.Provider value={{ mode: intensity, setMode: setIntensity }}>
      <GlobalCanvas />

      <SmoothScroll>
        <div className="relative z-10 w-full min-h-screen pointer-events-none">
          <NavBar />
          <main className="flex-1 flex flex-col items-center justify-center px-4 pt-10 pb-6">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </SmoothScroll>

      <MusicControls />
    </IntensityContext.Provider>
  );
}
