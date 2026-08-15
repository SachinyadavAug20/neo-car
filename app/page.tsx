"use client";

import { Canvas } from "@react-three/fiber";
import Scene from "./components/Scene";
import HUD from "./components/HUD";

export default function Home() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#12021f]">
      <Canvas
        className="absolute inset-0"
        dpr={[1, 2]}
        camera={{ position: [0, 8, 26], fov: 50, near: 0.1, far: 200 }}
      >
        <Scene />
      </Canvas>
      <HUD />
    </main>
  );
}