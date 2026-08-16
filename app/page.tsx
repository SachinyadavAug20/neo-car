"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./components/Scene";
import MusicControls from "./components/MusicControls";
import { IntensityContext, type IntensityMode } from "./lib/intensityContext";

export default function Home() {
  const [intensity, setIntensity] = useState<IntensityMode>("chill");

  return (
    <IntensityContext.Provider value={{ mode: intensity, setMode: setIntensity }}>
      <main className="relative h-screen w-screen overflow-hidden bg-[#12021f]">
        <Canvas
          className="absolute inset-0"
          dpr={[1, 2]}
          camera={{ position: [0, 8, 26], fov: 50, near: 0.1, far: 2500 }}
        >
          <Scene />
        </Canvas>
        <MusicControls />
      </main>
    </IntensityContext.Provider>
  );
}