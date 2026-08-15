"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { useStore } from "zustand";
import { useFrame } from "@react-three/fiber";
import { KeyboardControls, Stars } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { EffectComposer, Bloom, Scanline, ChromaticAberration, Noise, Glitch } from "@react-three/postprocessing";
import type { BloomEffect, GlitchEffect } from "postprocessing";
import DrivableCar, { controlsMap } from "./DrivableCar";
import ProceduralTerrain from "./ProceduralTerrain";
import Portal from "./Portal";
import RetroSun from "./RetroSun";
import RingTrack from "./RingTrack";
import RogueDaemons from "./RogueDaemons";
import { useAudioAnalyzer } from "../hooks/useAudioAnalyzer";
import { onGlitch } from "../lib/glitchStore";
import { gameStore } from "../store/gameStore";

const CA_OFFSET = new THREE.Vector2(0.002, 0.002);
const GLITCH_DELAY = new THREE.Vector2(1.5, 3.5);
const GLITCH_DURATION = new THREE.Vector2(0.1, 0.3);

export default function Scene() {
  const bloomRef = useRef<BloomEffect>(null);
  const glitchRef = useRef<GlitchEffect>(null);
  const sessionId = useStore(gameStore, (state) => state.sessionId);
  const panicked = useStore(gameStore, (state) => state.panicked);
  const { getFrequencies } = useAudioAnalyzer();

  useEffect(() => {
    const unsubscribe = onGlitch(() => {
      const glitch = glitchRef.current;
      if (!glitch) return;
      gsap.fromTo(
        glitch.strength,
        { x: 0.3, y: 0.3 },
        { x: 1.0, y: 1.0, duration: 0.14, ease: "power2.out", yoyo: true, repeat: 1 },
      );
    });
    return unsubscribe;
  }, []);

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
      <fogExp2 attach="fog" args={["#12021f", 0.003]} />

      <Stars radius={300} depth={80} count={5000} factor={4} saturation={0} fade speed={0.5} />

      <RetroSun />

      <ambientLight intensity={1.2} color="#9ab6ff" />
      <hemisphereLight intensity={0.75} color="#00e5ff" groundColor="#ff2d95" />
      <directionalLight position={[20, 40, 10]} intensity={2.5} color="#ffffff" />
      <pointLight position={[-20, 10, -30]} intensity={200} distance={90} color="#ff2d95" />
      <pointLight position={[20, 10, -30]} intensity={200} distance={90} color="#00e5ff" />

      <Physics gravity={[0, -30, 0]} paused={panicked}>
        <DrivableCar key={sessionId} />
        <ProceduralTerrain />
        <Portal />
        <RingTrack key={sessionId} />
        <RogueDaemons key={sessionId} />
      </Physics>

      <EffectComposer>
        <Bloom
          ref={bloomRef}
          mipmapBlur
          intensity={1.25}
          luminanceThreshold={0.15}
          luminanceSmoothing={0.9}
        />
        <Scanline density={1.5} opacity={0.5} />
        <ChromaticAberration offset={CA_OFFSET} />
        <Noise opacity={0.1} />
        <Glitch ref={glitchRef} delay={GLITCH_DELAY} duration={GLITCH_DURATION} />
      </EffectComposer>
    </KeyboardControls>
  );
}
