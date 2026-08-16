"use client";

import { Physics } from "@react-three/rapier";
import DrivableCar from "./DrivableCar";
import ProceduralTerrain from "./ProceduralTerrain";
import RetroSun from "./RetroSun";
import EnvironmentProps from "./EnvironmentProps";
import GridFloor from "./GridFloor";
import FloatingParticles from "./FloatingParticles";
import SpectrumRing from "./SpectrumRing";
import Road from "./Road";
import {
  AudioEffects,
  AudioLights,
  AudioStars,
} from "./AudioEffects";

export default function Scene() {
  return (
    <>
      <color attach="background" args={["#0b0f19"]} />
      <fogExp2 attach="fog" args={["#0b0f19", 0.003]} />

      <AudioStars />

      <RetroSun />

      <EnvironmentProps />

      <ambientLight intensity={1.2} color="#9ab6ff" />
      <hemisphereLight intensity={0.75} color="#7dc4e4" groundColor="#cba6f7" />
      <AudioLights />

      <GridFloor />
      <FloatingParticles />
      <SpectrumRing />

      <Physics gravity={[0, 0, 0]}>
        <DrivableCar />
      </Physics>
      <Road />
      <ProceduralTerrain />

      <AudioEffects />
    </>
  );
}