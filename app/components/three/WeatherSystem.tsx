"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useNarrative } from "@/app/lib/narrativeStore";
import { CHAPTERS } from "@/app/lib/narrative";

const RAIN_COUNT = 2000;
const SNOW_COUNT = 800;

const WEATHER_MAP: Record<string, "rain" | "snow" | "clear" | "storm"> = {
  crystal: "clear",
  mushroom: "snow",
  ruins: "storm",
  garden: "rain",
};

function RainParticles({ intensity }: { intensity: number }) {
  const ref = useRef<THREE.Points>(null);
  const velocities = useRef<Float32Array>(new Float32Array(RAIN_COUNT * 3));

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(RAIN_COUNT * 3);
    for (let i = 0; i < RAIN_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = Math.random() * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
      velocities.current[i * 3 + 1] = -(Math.random() * 0.3 + 0.2);
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return geo;
  }, []);

  useFrame(() => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < RAIN_COUNT; i++) {
      const i3 = i * 3;
      pos.array[i3 + 1] += velocities.current[i3 + 1] * intensity;
      if (pos.array[i3 + 1] < -5) {
        pos.array[i3 + 1] = 35 + Math.random() * 10;
        pos.array[i3] = (Math.random() - 0.5) * 80;
        pos.array[i3 + 2] = (Math.random() - 0.5) * 80;
      }
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial color="#88ccff" size={0.08} transparent opacity={0.4 * intensity} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function SnowParticles({ intensity }: { intensity: number }) {
  const ref = useRef<THREE.Points>(null);
  const offsets = useRef<Float32Array>(new Float32Array(SNOW_COUNT));

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(SNOW_COUNT * 3);
    for (let i = 0; i < SNOW_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = Math.random() * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
      offsets.current[i] = Math.random() * Math.PI * 2;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return geo;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < SNOW_COUNT; i++) {
      const i3 = i * 3;
      pos.array[i3 + 1] -= 0.02 * intensity;
      pos.array[i3] += Math.sin(t * 0.5 + offsets.current[i]) * 0.01;
      if (pos.array[i3 + 1] < -5) {
        pos.array[i3 + 1] = 35 + Math.random() * 10;
        pos.array[i3] = (Math.random() - 0.5) * 80;
      }
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial color="#ffffff" size={0.15} transparent opacity={0.5 * intensity} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function LightningFlash() {
  const lightRef = useRef<THREE.PointLight>(null);
  const timer = useRef(0);

  useFrame((_, delta) => {
    if (!lightRef.current) return;
    timer.current += delta;
    if (timer.current > 3 + Math.random() * 5) {
      timer.current = 0;
      lightRef.current.intensity = 5;
    }
    lightRef.current.intensity *= 0.9;
  });

  return <pointLight ref={lightRef} position={[0, 20, 0]} color="#aaaaff" intensity={0} distance={100} />;
}

export default function WeatherSystem() {
  const { started, playing, currentChapter } = useNarrative();
  const chapter = CHAPTERS[currentChapter];
  const weather = chapter ? WEATHER_MAP[chapter.islandId] || "clear" : "clear";

  if (!started || !playing) return null;

  return (
    <>
      {weather === "rain" && <RainParticles intensity={0.8} />}
      {weather === "snow" && <SnowParticles intensity={1} />}
      {weather === "storm" && (
        <>
          <RainParticles intensity={1.5} />
          <LightningFlash />
        </>
      )}
    </>
  );
}
