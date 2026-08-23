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
import DynamicSky from "./DynamicSky";
import GhostMemories from "./GhostMemories";
import EmberParticles from "./EmberParticles";
import HiddenSecrets from "./HiddenSecrets";
import InkTransition from "./InkTransition";
import FrostOverlay from "./FrostOverlay";
import CursorLight from "./CursorLight";
import FloatingBottles from "./FloatingBottles";
import InteractiveFireflies from "./InteractiveFireflies";
import TimeDilation from "./TimeDilation";
import FloatingParallax from "./FloatingParallax";
import CrystalClusters from "./CrystalClusters";
import RuneCircles from "./RuneCircles";
import LightRibbons from "./LightRibbons";
import StoryFragments from "./StoryFragments";
import BeaconLights from "./BeaconLights";
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
        <DynamicSky />
        <Aurora />
        <Lighting />
        <DynamicAtmosphere />
        <FloatingParallax />
        <BeaconLights />
        <SkyIslands />
        <CrystalClusters />
        <RuneCircles />
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
        <GhostMemories />
        <EmberParticles />
        <HiddenSecrets />
        <FloatingBottles />
        <StoryFragments />
        <LightRibbons />
        <InteractiveFireflies />
        {started && playing && <Companion />}
        {started && playing && <PlayerTrail />}
        {started && playing && <WeatherSystem />}
        {started && <LightPainting />}
        {started && <AudioVisualizer />}
        {started && <PortalSystem />}
        {started && <CursorLight />}
        {started && <TimeDilation />}
      </Suspense>

      <ClickBurst />
      {started && playing ? <ScrollCamera /> : <CameraController />}
      {started && <InkTransition />}
      {started && <FrostOverlay />}
      {started && <ParticleReveal />}
      {started && <RippleOverlay />}
      <Effects />
      <AudioEngine />
      <ProceduralAudio />
    </Canvas>
  );
}
