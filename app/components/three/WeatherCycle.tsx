"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useNarrative } from "@/app/lib/narrativeStore";

const RAIN_PARTICLES = 300;
const SNOW_PARTICLES = 200;

type WeatherType = "clear" | "rain" | "snow" | "aurora";

export default function WeatherCycle() {
  const { started, mood } = useNarrative();
  const [weather, setWeather] = useState<WeatherType>("clear");
  const rainRef = useRef<THREE.Points>(null);
  const snowRef = useRef<THREE.Points>(null);

  useEffect(() => {
    if (!started) return;

    const interval = setInterval(() => {
      const weathers: WeatherType[] = ["clear", "rain", "snow", "aurora"];
      setWeather(weathers[Math.floor(Math.random() * weathers.length)]);
    }, 30000);

    return () => clearInterval(interval);
  }, [started]);

  useEffect(() => {
    if (mood === "wonder") setWeather("aurora");
    else if (mood === "courage") setWeather("clear");
    else if (mood === "loss") setWeather("rain");
    else if (mood === "hope") setWeather("snow");
  }, [mood]);

  const rainPositions = useMemo(() => {
    const pos = new Float32Array(RAIN_PARTICLES * 3);
    for (let i = 0; i < RAIN_PARTICLES; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = Math.random() * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    return pos;
  }, []);

  const snowPositions = useMemo(() => {
    const pos = new Float32Array(SNOW_PARTICLES * 3);
    for (let i = 0; i < SNOW_PARTICLES; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = Math.random() * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    return pos;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (rainRef.current && weather === "rain") {
      const positions = rainRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < RAIN_PARTICLES; i++) {
        positions[i * 3 + 1] -= 0.5;
        if (positions[i * 3 + 1] < -5) {
          positions[i * 3 + 1] = 25;
        }
      }
      rainRef.current.geometry.attributes.position.needsUpdate = true;
    }

    if (snowRef.current && weather === "snow") {
      const positions = snowRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < SNOW_PARTICLES; i++) {
        positions[i * 3 + 1] -= 0.05;
        positions[i * 3] += Math.sin(t + i) * 0.01;
        if (positions[i * 3 + 1] < -5) {
          positions[i * 3 + 1] = 25;
        }
      }
      snowRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  if (!started) return null;

  return (
    <group>
      {weather === "rain" && (
        <points ref={rainRef} frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[rainPositions, 3]} />
          </bufferGeometry>
          <pointsMaterial
            size={0.05}
            color="#67e8f9"
            transparent
            opacity={0.4}
            sizeAttenuation
          />
        </points>
      )}

      {weather === "snow" && (
        <points ref={snowRef} frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[snowPositions, 3]} />
          </bufferGeometry>
          <pointsMaterial
            size={0.08}
            color="#ffffff"
            transparent
            opacity={0.5}
            sizeAttenuation
          />
        </points>
      )}
    </group>
  );
}
