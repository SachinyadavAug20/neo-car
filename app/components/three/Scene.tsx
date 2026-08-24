"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import PaperWorld from "./PaperWorld";
import StoryCamera from "./StoryCamera";
import PaperUI from "../ui/PaperUI";

export default function Scene() {
  return (
    <>
      <Canvas
        camera={{ position: [0, 3, 8], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 1.5]}
        style={{ position: "absolute", inset: 0 }}
      >
        <color attach="background" args={["#fdf6e3"]} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={1} />
        <Suspense fallback={null}>
          <PaperWorld />
          <StoryCamera />
        </Suspense>
      </Canvas>
      <PaperUI />
    </>
  );
}
