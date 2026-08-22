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
  DepthOfField,
} from "@react-three/postprocessing";
import { type BloomEffect, type ChromaticAberrationEffect } from "postprocessing";
import { useAudioAnalyzer } from "../hooks/useAudioAnalyzer";
import { intensityBoost, useIntensity } from "../lib/intensityContext";
import { useAppStore, THEMES } from "../lib/appStore";

export function AudioEffects() {
  const bloomRef = useRef<BloomEffect>(null);
  const chromaticRef = useRef<ChromaticAberrationEffect>(null);
  const { getFrequencies } = useAudioAnalyzer();
  const { mode } = useIntensity();

  useFrame((state) => {
    const [bass, mids] = getFrequencies();
    const boost = intensityBoost(mode);
    const route = useAppStore.getState().currentRoute;

    if (bloomRef.current) {
      const routeBoost = route === "/drive" ? 1.1 : 1.0;
      bloomRef.current.intensity = (0.75 + bass * 0.55 + mids * 0.15) * boost * routeBoost;
    }

    if (chromaticRef.current) {
      const baseOffset = 0.0002 + bass * 0.0004;
      const routeOffset = route === "/drive" ? 0.00015 : 0;
      const offset = baseOffset + routeOffset;
      chromaticRef.current.offset.set(offset, offset);
    }
  });

  return (
    <EffectComposer multisampling={0}>
      <DepthOfField
        focusDistance={0.02}
        focalLength={0.05}
        bokehScale={3}
        height={480}
      />
      <Bloom
        ref={bloomRef}
        luminanceThreshold={0.75}
        luminanceSmoothing={0.35}
        intensity={0.9}
        mipmapBlur
      />
      <Vignette eskil={false} offset={0.25} darkness={0.55} />
      <Noise premultiply opacity={0.025} />
      <ChromaticAberration ref={chromaticRef} offset={[0.0002, 0.0002]} />
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
    const activeTheme = useAppStore.getState().activeTheme;
    const theme = THEMES[activeTheme];

    const bassLight = bassLightRef.current;
    if (bassLight) {
      bassLight.intensity = (25 + bass * 180) * boost;
      bassLight.color.setRGB(
        theme.primary[0] + bass * 0.2,
        theme.primary[1] + bass * 0.2,
        theme.primary[2],
      );
    }

    const midLight = midLightRef.current;
    if (midLight) {
      midLight.intensity = (15 + mids * 100) * boost;
      midLight.color.setRGB(
        theme.secondary[0] + mids * 0.2,
        theme.secondary[1] + mids * 0.08,
        theme.secondary[2] + mids * 0.04,
      );
    }

    const rimLight = rimLightRef.current;
    if (rimLight) {
      rimLight.intensity = (0.9 + highs * 1.1) * boost;
      rimLight.color.setRGB(theme.accent[0], theme.accent[1], theme.accent[2]);
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
