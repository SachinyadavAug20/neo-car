"use client";

import { Physics } from "@react-three/rapier";
import DrivableCar from "./DrivableCar";
import CameraRig from "./CameraRig";
import ProceduralTerrain from "./ProceduralTerrain";
import EclipseHorizon from "./EclipseHorizon";
import Scenery from "./Scenery";
import EnvironmentProps from "./EnvironmentProps";
import GridFloor from "./GridFloor";
import SpectrumRing from "./SpectrumRing";
import Road from "./Road";
import StreetLights from "./StreetLights";
import GradientSky from "./GradientSky";
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

      <EclipseHorizon />

      <Scenery />

      <ambientLight intensity={1.2} color="#9ab6ff" />
      <hemisphereLight intensity={0.75} color="#7dc4e4" groundColor="#cba6f7" />
      <AudioLights />

      <GridFloor />
      <SpectrumRing />
      <GradientSky />

      <Physics gravity={[0, 0, 0]}>
        <DrivableCar />
      </Physics>
      <Road />
      <StreetLights />
      <ProceduralTerrain />

      <CameraRig />
      <AudioEffects />
    </>
  );
}
