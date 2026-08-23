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
import ParticleReveal from "./ParticleReveal";
import RippleOverlay from "./RippleOverlay";
import Companion from "./Companion";
import DynamicAtmosphere from "./DynamicAtmosphere";
import MemoryStones from "./MemoryStones";
import PlayerTrail from "./PlayerTrail";
import CrystalPuzzle from "./CrystalPuzzle";
import ProceduralAudio from "./ProceduralAudio";
import WeatherSystem from "./WeatherSystem";
import LightPainting from "./LightPainting";
import AudioVisualizer from "./AudioVisualizer";
import PortalSystem from "./PortalSystem";
import InteractiveFlora from "./InteractiveFlora";
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

      <Suspense fallback={null}>
        <Stars />
        <Aurora />
        <Lighting />
        <DynamicAtmosphere />
        <SkyIslands />
        <InteractiveObjects />
        <Particles />
        <Butterflies />
        <Collectibles />
        <MemoryStones />
        <CrystalPuzzle />
        <Clouds />
        <Water />
        <UserNotes />
        <NotePlacer />
        <InteractiveFlora />
        {started && playing && <Companion />}
        {started && playing && <PlayerTrail />}
        {started && playing && <WeatherSystem />}
        {started && <LightPainting />}
        {started && <AudioVisualizer />}
        {started && <PortalSystem />}
      </Suspense>

      <ClickBurst />
      {started && playing ? <ScrollCamera /> : <CameraController />}
      {started && <ParticleReveal />}
      {started && <RippleOverlay />}
      <Effects />
      <AudioEngine />
      <ProceduralAudio />
    </Canvas>
  );
}
