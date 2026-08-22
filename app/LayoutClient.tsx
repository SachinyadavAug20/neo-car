"use client";

import { useState, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./components/Scene";
import MusicControls from "./components/MusicControls";
import SystemBar from "./components/SystemBar";
import {
  IntensityContext,
  type IntensityMode,
} from "./lib/intensityContext";

export default function LayoutClient({ children }: { children: ReactNode }) {
  const [intensity, setIntensity] = useState<IntensityMode>("chill");

  return (
    <IntensityContext.Provider value={{ mode: intensity, setMode: setIntensity }}>
      {/* Layer 1: Fullscreen 3D Canvas */}
      <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#050505]">
        <Canvas
          className="absolute inset-0 w-full h-full"
          dpr={[1, 2]}
          camera={{ position: [0, 8, 26], fov: 50, near: 0.1, far: 2500 }}
        >
          <Scene />
        </Canvas>
      </div>

      {/* Layer 2: UI overlay */}
      <div className="relative z-10 w-full h-screen flex flex-col pointer-events-none overflow-hidden">
        <SystemBar />
        <main className="flex-1 flex flex-col items-center justify-center px-4 pt-10 pb-6 overflow-y-auto">
          {children}
        </main>
      </div>

      <MusicControls />
    </IntensityContext.Provider>
  );
}
