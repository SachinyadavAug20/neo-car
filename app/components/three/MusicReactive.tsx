"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useNarrative } from "@/app/lib/narrativeStore";

const BAND_COUNT = 8;
const PARTICLES_PER_BAND = 50;

export default function MusicReactive() {
  const { started, mood } = useNarrative();
  const groupRef = useRef<THREE.Group>(null);

  const bands = useMemo(() => {
    return Array.from({ length: BAND_COUNT }, (_, i) => {
      const positions = new Float32Array(PARTICLES_PER_BAND * 3);
      const sizes = new Float32Array(PARTICLES_PER_BAND);

      for (let j = 0; j < PARTICLES_PER_BAND; j++) {
        const i3 = j * 3;
        const angle = (j / PARTICLES_PER_BAND) * Math.PI * 2;
        const radius = 3 + i * 0.8;

        positions[i3] = Math.cos(angle) * radius;
        positions[i3 + 1] = i * 0.5 - 2;
        positions[i3 + 2] = Math.sin(angle) * radius;

        sizes[j] = 0.03 + Math.random() * 0.05;
      }

      return { positions, sizes, radius: 3 + i * 0.8 };
    });
  }, []);

  useFrame((state) => {
    if (!groupRef.current || !started) return;
    const t = state.clock.elapsedTime;

    groupRef.current.children.forEach((child, i) => {
      if (child instanceof THREE.Points) {
        const positions = child.geometry.attributes.position.array as Float32Array;
        const reactivity = mood === "wonder" ? 1.5 : mood === "courage" ? 1.2 : 0.8;

        for (let j = 0; j < positions.length; j += 3) {
          const angle = (j / 3 / PARTICLES_PER_BAND) * Math.PI * 2 + t * 0.2;
          const radius = bands[i].radius + Math.sin(t * 2 + i) * 0.3 * reactivity;
          positions[j] = Math.cos(angle) * radius;
          positions[j + 1] = i * 0.5 - 2 + Math.sin(t * 1.5 + j * 0.1) * 0.2;
          positions[j + 2] = Math.sin(angle) * radius;
        }
        child.geometry.attributes.position.needsUpdate = true;
      }
    });
  });

  if (!started) return null;

  return (
    <group ref={groupRef}>
      {bands.map((band, i) => (
        <points key={i} frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[band.positions, 3]} />
          </bufferGeometry>
          <pointsMaterial
            size={0.05}
            color="#67e8f9"
            transparent
            opacity={0.3}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            sizeAttenuation
          />
        </points>
      ))}
    </group>
  );
}
