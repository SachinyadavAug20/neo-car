"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  Vignette,
  Noise,
  ChromaticAberration,
} from "@react-three/postprocessing";
import { type BloomEffect, type ChromaticAberrationEffect } from "postprocessing";
import { useAudioAnalyzer } from "../hooks/useAudioAnalyzer";
import { intensityBoost, useIntensity } from "../lib/intensityContext";

export function AudioEffects() {
  const bloomRef = useRef<BloomEffect>(null);
  const chromaticRef = useRef<ChromaticAberrationEffect>(null);
  const { getFrequencies } = useAudioAnalyzer();
  const { mode } = useIntensity();

  useFrame(() => {
    const [bass, mids] = getFrequencies();
    const boost = intensityBoost(mode);

    if (bloomRef.current) {
      bloomRef.current.intensity = (0.85 + bass * 0.9 + mids * 0.25) * boost;
    }

    if (chromaticRef.current) {
      const offset = 0.0004 + bass * 0.0007;
      chromaticRef.current.offset.set(offset, offset);
    }
  });

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        ref={bloomRef}
        mipmapBlur
        intensity={0.85}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.25}
      />
      <Vignette eskil={false} offset={0.3} darkness={0.55} />
      <Noise premultiply opacity={0.035} />
      <ChromaticAberration ref={chromaticRef} offset={[0.0004, 0.0004]} />
    </EffectComposer>
  );
}

export function AudioLights() {
  const bassLightRef = useRef<THREE.PointLight>(null);
  const midLightRef = useRef<THREE.PointLight>(null);
  const rimLightRef = useRef<THREE.DirectionalLight>(null);
  const { getFrequencies } = useAudioAnalyzer();
  const { mode } = useIntensity();

  useFrame(() => {
    const [bass, mids, highs] = getFrequencies();
    const boost = intensityBoost(mode);

    const bassLight = bassLightRef.current;
    if (bassLight) {
      bassLight.intensity = (25 + bass * 180) * boost;
      bassLight.color.setRGB(0.7 + bass * 0.2, 0.65 + bass * 0.2, 1.0);
    }

    const midLight = midLightRef.current;
    if (midLight) {
      midLight.intensity = (15 + mids * 100) * boost;
      midLight.color.setRGB(0.55 + mids * 0.2, 0.85 + mids * 0.08, 0.95 + mids * 0.04);
    }

    const rimLight = rimLightRef.current;
    if (rimLight) {
      rimLight.intensity = (0.9 + highs * 1.1) * boost;
    }
  });

  return (
    <>
      <pointLight ref={bassLightRef} position={[0, 14, -20]} distance={140} color="#b4befe" />
      <pointLight ref={midLightRef} position={[18, 8, -40]} distance={160} color="#8bd5ca" />
      <directionalLight ref={rimLightRef} position={[-30, 20, 0]} color="#f5c2e7" />
    </>
  );
}

export function AudioStars() {
  return (
    <Stars
      radius={300}
      depth={80}
      count={1500}
      factor={4}
      saturation={0}
      fade
      speed={0.3}
    />
  );
}