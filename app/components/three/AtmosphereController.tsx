"use client";

import { useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";

export type TimeOfDay = "dawn" | "day" | "dusk" | "night";

interface AtmospherePreset {
  background: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  sunColor: string;
  sunIntensity: number;
  sunPosition: [number, number, number];
  ambientColor: string;
  ambientIntensity: number;
  rimColor: string;
}

const PRESETS: Record<TimeOfDay, AtmospherePreset> = {
  dawn: {
    background: "#fce7f3",
    fogColor: "#fdf2f8",
    fogNear: 20,
    fogFar: 75,
    sunColor: "#fbcfe8",
    sunIntensity: 1.1,
    sunPosition: [12, 8, 8],
    ambientColor: "#fed7aa",
    ambientIntensity: 0.55,
    rimColor: "#c084fc",
  },
  day: {
    background: "#fdf6e3",
    fogColor: "#fdf6e3",
    fogNear: 25,
    fogFar: 85,
    sunColor: "#fff8e7",
    sunIntensity: 1.3,
    sunPosition: [8, 14, 8],
    ambientColor: "#fdf6e3",
    ambientIntensity: 0.65,
    rimColor: "#c4b5fd",
  },
  dusk: {
    background: "#fed7aa",
    fogColor: "#ffedd5",
    fogNear: 20,
    fogFar: 70,
    sunColor: "#f97316",
    sunIntensity: 1.2,
    sunPosition: [-12, 6, 8],
    ambientColor: "#fb923c",
    ambientIntensity: 0.5,
    rimColor: "#ec4899",
  },
  night: {
    background: "#0f172a",
    fogColor: "#1e1b4b",
    fogNear: 15,
    fogFar: 60,
    sunColor: "#38bdf8",
    sunIntensity: 0.5,
    sunPosition: [-6, 12, -8],
    ambientColor: "#1e293b",
    ambientIntensity: 0.35,
    rimColor: "#818cf8",
  },
};

export function AtmosphereController({ timeOfDay = "day" }: { timeOfDay?: TimeOfDay }) {
  const { scene } = useThree();
  const sunLightRef = useRef<THREE.DirectionalLight>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  const rimLightRef = useRef<THREE.DirectionalLight>(null);

  const preset = PRESETS[timeOfDay] || PRESETS.day;

  // Static lightweight stars
  const starGeo = useMemo(() => new THREE.OctahedronGeometry(0.12, 0), []);
  const starMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#fbbf24" }), []);

  const stars = useMemo(() => {
    return Array.from({ length: 30 }, () => ({
      pos: [
        (Math.random() - 0.5) * 120,
        20 + Math.random() * 25,
        (Math.random() - 0.5) * 120,
      ] as [number, number, number],
      scale: 0.6 + Math.random() * 0.6,
    }));
  }, []);

  // Update atmosphere on timeOfDay change only
  useEffect(() => {
    const bgCol = new THREE.Color(preset.background);
    const fogCol = new THREE.Color(preset.fogColor);

    if (scene.background instanceof THREE.Color) {
      gsap.to(scene.background, { r: bgCol.r, g: bgCol.g, b: bgCol.b, duration: 1 });
    } else {
      scene.background = bgCol;
    }

    if (scene.fog instanceof THREE.Fog) {
      gsap.to(scene.fog.color, { r: fogCol.r, g: fogCol.g, b: fogCol.b, duration: 1 });
      gsap.to(scene.fog, { near: preset.fogNear, far: preset.fogFar, duration: 1 });
    } else {
      scene.fog = new THREE.Fog(preset.fogColor, preset.fogNear, preset.fogFar);
    }

    if (sunLightRef.current) {
      const sunCol = new THREE.Color(preset.sunColor);
      gsap.to(sunLightRef.current.color, { r: sunCol.r, g: sunCol.g, b: sunCol.b, duration: 1 });
      gsap.to(sunLightRef.current, { intensity: preset.sunIntensity, duration: 1 });
      gsap.to(sunLightRef.current.position, { x: preset.sunPosition[0], y: preset.sunPosition[1], z: preset.sunPosition[2], duration: 1 });
    }

    if (ambientLightRef.current) {
      const ambCol = new THREE.Color(preset.ambientColor);
      gsap.to(ambientLightRef.current.color, { r: ambCol.r, g: ambCol.g, b: ambCol.b, duration: 1 });
      gsap.to(ambientLightRef.current, { intensity: preset.ambientIntensity, duration: 1 });
    }

    if (rimLightRef.current) {
      const rimCol = new THREE.Color(preset.rimColor);
      gsap.to(rimLightRef.current.color, { r: rimCol.r, g: rimCol.g, b: rimCol.b, duration: 1 });
    }
  }, [preset, scene]);

  return (
    <>
      <ambientLight ref={ambientLightRef} intensity={preset.ambientIntensity} color={preset.ambientColor} />
      <directionalLight
        ref={sunLightRef}
        position={preset.sunPosition}
        intensity={preset.sunIntensity}
        color={preset.sunColor}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <directionalLight ref={rimLightRef} position={[0, 3, -10]} intensity={0.2} color={preset.rimColor} />
      <directionalLight position={[-5, 6, -3]} intensity={0.25} color="#e0e7ff" />

      {/* Lightweight Origami Stars */}
      {(timeOfDay === "night" || timeOfDay === "dusk") && (
        <group>
          {stars.map((s, i) => (
            <mesh key={i} position={s.pos} scale={s.scale} geometry={starGeo} material={starMat} />
          ))}
        </group>
      )}
    </>
  );
}
