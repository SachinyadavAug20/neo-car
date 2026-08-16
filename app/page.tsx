"use client";

import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useStore } from "zustand";
import GameCanvas3D from "./components/GameCanvas3D";
import GameCanvas2D from "./components/GameCanvas2D";
import HUD from "./components/HUD";
import MainMenu from "./components/MainMenu";
import PortalFade from "./components/PortalFade";
import KernelPanic from "./components/KernelPanic";
import GraphicsOverlay from "./components/GraphicsOverlay";
import { gameStore } from "./store/gameStore";
import { contextStore } from "./store/contextStore";

const SAFE_GL = {
  antialias: false,
  alpha: false,
  stencil: false,
  depth: true,
  powerPreference: "default",
  failIfMajorPerformanceCaveat: false,
} as const;

type Mode = "auto" | "2d" | "3d";

export default function Home() {
  const sessionId = useStore(gameStore, (state) => state.sessionId);
  const gfxState = useStore(contextStore, (state) => state.state);
  const [mode] = useState<Mode>(() => {
    if (typeof window === "undefined") return "auto";
    const m = new URLSearchParams(window.location.search).get("mode");
    return m === "2d" || m === "3d" ? m : "auto";
  });

  const use2D = mode === "2d" || (mode === "auto" && gfxState !== "ok");

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#12021f]">
      {use2D ? (
        <GameCanvas2D key={`2d-${sessionId}`} />
      ) : (
        <Suspense fallback={<div className="h-screen w-screen bg-[#12021f]" />}>
          <Canvas
            className="absolute inset-0"
            dpr={[1, 1]}
            gl={SAFE_GL}
            flat
            camera={{ position: [0, 3, 14], fov: 60, near: 0.1, far: 250 }}
          >
            <GameCanvas3D />
          </Canvas>
        </Suspense>
      )}
      <MainMenu key={sessionId} />
      <HUD />
      <PortalFade />
      <KernelPanic />
      {!use2D && <GraphicsOverlay />}
    </main>
  );
}