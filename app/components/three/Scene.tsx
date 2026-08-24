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
import TerrainDetail from "./TerrainDetail";
import DustMotes from "./DustMotes";
import WindStreaks from "./WindStreaks";
import NeuralNetwork from "./NeuralNetwork";
import OrbitRings from "./OrbitRings";
import PulseWave from "./PulseWave";
import FogLightShafts from "./FogLightShafts";
import DepthLayers from "./DepthLayers";
import SpiralGalaxy from "./SpiralGalaxy";
import HologramEffect from "./HologramEffect";
import NoiseTerrain from "./NoiseTerrain";
import GodRays from "./GodRays";
import WireframeGrid from "./WireframeGrid";
import FireflySwarm from "./FireflySwarm";
import CursorRipple from "./CursorRipple";
import ScrollReveal from "./ScrollReveal";
import MagneticCursor from "./MagneticCursor";
import FloatingIslandHero from "./FloatingIslandHero";
import ProceduralTerrain from "./ProceduralTerrain";
import EnergyField from "./EnergyField";
import WaterReflections from "./WaterReflections";
import AtmosphericFog from "./AtmosphericFog";
import MusicReactive from "./MusicReactive";
import IslandConnections from "./IslandConnections";
import WeatherCycle from "./WeatherCycle";
import CollectibleEffects from "./CollectibleEffects";
import CursorTrail from "./CursorTrail";
import NoiseFog from "./NoiseFog";
import HexGrid from "./HexGrid";
import FilmGrain from "./FilmGrain";
import PortalRings from "./PortalRings";
import DepthParticles from "./DepthParticles";
import LightBeams from "./LightBeams";
import FloatingOrbs from "./FloatingOrbs";
import WaveLines from "./WaveLines";
import VignetteOverlay from "./VignetteOverlay";
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
        <SpiralGalaxy />
        <DynamicSky />
        <Aurora />
        <Lighting />
        <GodRays />
        <FogLightShafts />
        <DynamicAtmosphere />
        <AtmosphericFog />
        <DepthLayers />
        <FloatingParallax />
        <BeaconLights />
        <SkyIslands />
        <FloatingIslandHero />
        <ProceduralTerrain />
        <NoiseTerrain />
        <WireframeGrid />
        <TerrainDetail />
        <CrystalClusters />
        <RuneCircles />
        <OrbitRings />
        <NeuralNetwork />
        <HologramEffect />
        <IslandConnections />
        <EnergyField />
        <InteractiveObjects />
        <Particles />
        <Butterflies />
        <Collectibles />
        <CollectibleEffects />
        <MemoryStones />
        <CrystalPuzzle />
        <Clouds />
        <Water />
        <WaterReflections />
        <PulseWave />
        <DustMotes />
        <WindStreaks />
        <FireflySwarm />
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
        <MusicReactive />
        <WeatherCycle />
        <NoiseFog />
        <HexGrid />
        <PortalRings />
        <DepthParticles />
        <LightBeams />
        <FloatingOrbs />
        <WaveLines />
        {started && playing && <Companion />}
        {started && playing && <PlayerTrail />}
        {started && playing && <WeatherSystem />}
        {started && <LightPainting />}
        {started && <AudioVisualizer />}
        {started && <PortalSystem />}
        {started && <CursorLight />}
        {started && <TimeDilation />}
        {started && <ScrollReveal />}
      </Suspense>

      <ClickBurst />
      <MagneticCursor />
      {started && playing ? <ScrollCamera /> : <CameraController />}
      {started && <InkTransition />}
      {started && <FrostOverlay />}
      {started && <CursorRipple />}
      {started && <ParticleReveal />}
      {started && <RippleOverlay />}
      <Effects />
      <FilmGrain />
      <VignetteOverlay />
      <CursorTrail />
      <AudioEngine />
      <ProceduralAudio />
    </Canvas>
  );
}
