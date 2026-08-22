"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import Lighting from "./Lighting";
import SkyIslands from "./SkyIslands";
import Particles from "./Particles";
import Clouds from "./Clouds";
import Stars from "./Stars";
import Aurora from "./Aurora";
import Water from "./Water";
import Butterflies from "./Butterflies";
import Collectibles from "./Collectibles";
import InteractiveObjects from "./InteractiveObjects";
import UserNotes from "./UserNotes";
import NotePlacer from "./NotePlacer";
import ClickBurst from "./ClickBurst";
import CameraController from "./CameraController";
import ScrollCamera from "./ScrollCamera";
import Effects from "./Effects";
import AudioEngine from "./AudioEngine";
import { useStore } from "@/app/lib/store";
import { useNarrative } from "@/app/lib/narrativeStore";

export default function Scene() {
  const setLoaded = useStore((s) => s.setLoaded);
  const { started, playing } = useNarrative();

  return (
    <Canvas
      camera={{ position: [25, 30, 45], fov: 55, near: 0.1, far: 500 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      dpr={[1, 1.5]}
      onCreated={() => setTimeout(() => setLoaded(), 800)}
      style={{ position: "absolute", inset: 0 }}
    >
      <color attach="background" args={["#0a0e27"]} />
      <fog attach="fog" args={["#0a0e27", 40, 120]} />

      <Suspense fallback={null}>
        <Stars />
        <Aurora />
        <Lighting />
        <SkyIslands />
        <InteractiveObjects />
        <Particles />
        <Butterflies />
        <Collectibles />
        <Clouds />
        <Water />
        <UserNotes />
        <NotePlacer />
      </Suspense>

      <ClickBurst />
      {started && playing ? <ScrollCamera /> : <CameraController />}
      <Effects />
      <AudioEngine />
    </Canvas>
  );
}
