"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useStore } from "zustand";
import { useFrame } from "@react-three/fiber";
import { KeyboardControls, Stars } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import type { BloomEffect } from "postprocessing";
import DrivableCar, { controlsMap } from "./DrivableCar";
import ProceduralTerrain from "./ProceduralTerrain";
import Portal from "./Portal";
import RetroSun from "./RetroSun";
import LevelManager from "./LevelManager";
import RogueDaemons from "./RogueDaemons";
import EnvironmentProps from "./EnvironmentProps";
import { useAudioAnalyzer } from "../hooks/useAudioAnalyzer";
import { gameStore } from "../store/gameStore";
import ContextLossGuard from "./ContextLossGuard";
import ContextHealthGate from "./ContextHealthGate";
import EffectBoundary from "./EffectBoundary";

export default function Scene() {
  const bloomRef = useRef<BloomEffect>(null);
  const sessionId = useStore(gameStore, (state) => state.sessionId);
  const gameState = useStore(gameStore, (state) => state.gameState);
  const { getFrequencies } = useAudioAnalyzer();

  useFrame((_, delta) => {
    const [bass] = getFrequencies();
    if (!bloomRef.current) return;
    const target = 0.8 + bass * 1.5;
    const bloomSmoothing = 1 - Math.exp(-6 * delta);
    bloomRef.current.intensity = THREE.MathUtils.lerp(
      bloomRef.current.intensity,
      target,
      bloomSmoothing,
    );
  });

  return (
    <KeyboardControls map={controlsMap}>
      <color attach="background" args={["#0b0f19"]} />
      <fogExp2 attach="fog" args={["#0b0f19", 0.003]} />

      <ContextLossGuard />

      <Stars radius={300} depth={80} count={3000} factor={4} saturation={0} fade speed={0.5} />

      <RetroSun />

      <EnvironmentProps />

      <ambientLight intensity={1.2} color="#9ab6ff" />
      <hemisphereLight intensity={0.75} color="#7dc4e4" groundColor="#cba6f7" />
      <directionalLight position={[20, 40, 10]} intensity={2.5} color="#e8f0ff" />
      <pointLight position={[-20, 10, -30]} intensity={200} distance={90} color="#cba6f7" />
      <pointLight position={[20, 10, -30]} intensity={200} distance={90} color="#7dc4e4" />

      <Physics gravity={[0, -30, 0]} paused={gameState !== "playing"}>
        <DrivableCar key={`car-${sessionId}`} />
        <ProceduralTerrain />
        <Portal key={`portal-${sessionId}`} />
        <LevelManager key={`rings-${sessionId}`} />
        <RogueDaemons key={`daemons-${sessionId}`} />
      </Physics>

      <ContextHealthGate>
        <EffectBoundary fallback={null}>
          <EffectComposer>
            <Bloom
              ref={bloomRef}
              mipmapBlur
              intensity={0.8}
              luminanceThreshold={0.4}
              luminanceSmoothing={0.9}
            />
          </EffectComposer>
        </EffectBoundary>
      </ContextHealthGate>
    </KeyboardControls>
  );
}