"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { useStore } from "zustand";
import Scene from "./components/Scene";
import HUD from "./components/HUD";
import MainMenu from "./components/MainMenu";
import PortalFade from "./components/PortalFade";
import KernelPanic from "./components/KernelPanic";
import { gameStore } from "./store/gameStore";

export default function Home() {
  const sessionId = useStore(gameStore, (state) => state.sessionId);
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#12021f]">
      <Suspense fallback={<div className="h-screen w-screen bg-[#12021f]" />}>
        <Canvas
          className="absolute inset-0"
          dpr={[1, 2]}
          camera={{ position: [0, 8, 26], fov: 50, near: 0.1, far: 2500 }}
        >
          <Scene />
        </Canvas>
      </Suspense>
      <MainMenu key={sessionId} />
      <HUD />
      <PortalFade />
      <KernelPanic />
    </main>
  );
}