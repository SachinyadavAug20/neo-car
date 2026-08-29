"use client";

import { useMemo } from "react";
import * as THREE from "three";

interface LightShaftsProps {
  position?: [number, number, number];
  count?: number;
  color?: string;
  intensity?: number;
}

export function LightShafts({
  position = [15, 20, -10],
  count = 3,
  color = "#fffbeb",
  intensity = 0.12,
}: LightShaftsProps) {
  const shafts = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const width = 3 + i * 1.5;
      const height = 35;
      const slant = -0.45;
      return { width, height, slant };
    });
  }, [count]);

  const geo = useMemo(() => new THREE.PlaneGeometry(3, 35), []);
  const mat = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: intensity,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [color, intensity]);

  return (
    <group position={position} rotation={[0.2, 0.4, -0.6]}>
      {shafts.map((s, i) => (
        <mesh
          key={i}
          geometry={geo}
          material={mat}
          position={[(i - count / 2) * 6, -s.height / 2, 0]}
          rotation={[0, 0, s.slant]}
        />
      ))}
    </group>
  );
}
