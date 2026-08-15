"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { KeyboardControls } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import type { BloomEffect } from "postprocessing";
import DrivableCar, { controlsMap } from "./DrivableCar";
import ProceduralTerrain from "./ProceduralTerrain";
import { useAudioAnalyzer } from "../hooks/useAudioAnalyzer";

export default function Scene() {
  const bloomRef = useRef<BloomEffect>(null);
  const { getFrequencies } = useAudioAnalyzer();

  useFrame(() => {
    const [bass] = getFrequencies();
    if (!bloomRef.current) return;
    const target = 1.0 + bass * 2.5;
    bloomRef.current.intensity = THREE.MathUtils.lerp(
      bloomRef.current.intensity,
      target,
      0.2,
    );
  });

  return (
    <KeyboardControls map={controlsMap}>
      <color attach="background" args={["#12021f"]} />
      <fog attach="fog" args={["#12021f", 40, 150]} />

      <ambientLight intensity={1.5} color="#9ab6ff" />
      <hemisphereLight intensity={0.6} color="#00e5ff" groundColor="#ff2d95" />
      <directionalLight position={[20, 40, 10]} intensity={2.5} color="#ffffff" />
      <pointLight position={[-20, 10, -30]} intensity={200} distance={90} color="#ff2d95" />
      <pointLight position={[20, 10, -30]} intensity={200} distance={90} color="#00e5ff" />

      <Physics gravity={[0, -30, 0]}>
        <DrivableCar />
        <ProceduralTerrain />
      </Physics>

      <EffectComposer>
        <Bloom
          ref={bloomRef}
          mipmapBlur
          intensity={1.25}
          luminanceThreshold={0.15}
          luminanceSmoothing={0.9}
        />
      </EffectComposer>
    </KeyboardControls>
  );
}