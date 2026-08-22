"use client";

import { Canvas } from "@react-three/fiber";
import Scene from "./Scene";

function getAdaptiveDPR(): [number, number] {
  if (typeof window === "undefined") return [1, 2];
  const dpr = window.devicePixelRatio || 1;
  if (dpr <= 1) return [1, 1.5];
  if (dpr <= 1.5) return [1, 1.5];
  return [1, 2];
}

export default function GlobalCanvas() {
  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#050505]">
      <Canvas
        className="absolute inset-0 w-full h-full"
        dpr={getAdaptiveDPR()}
        camera={{ position: [0, 8, 26], fov: 50, near: 0.1, far: 2500 }}
        gl={{
          antialias: false,
          powerPreference: "high-performance",
          alpha: false,
        }}
        frameloop="always"
      >
        <Scene />
      </Canvas>
    </div>
  );
}
