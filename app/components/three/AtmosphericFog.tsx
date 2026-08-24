"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const FOG_LAYERS = 5;
const PARTICLES_PER_LAYER = 100;

export default function AtmosphericFog() {
  const groupRef = useRef<THREE.Group>(null);

  const layers = useMemo(() => {
    return Array.from({ length: FOG_LAYERS }, (_, i) => {
      const count = PARTICLES_PER_LAYER;
      const positions = new Float32Array(count * 3);
      const sizes = new Float32Array(count);

      for (let j = 0; j < count; j++) {
        const i3 = j * 3;
        positions[i3] = (Math.random() - 0.5) * 80;
        positions[i3 + 1] = i * 3 - 5 + Math.random() * 2;
        positions[i3 + 2] = (Math.random() - 0.5) * 80;
        sizes[j] = 0.5 + Math.random() * 1.5;
      }

      return { positions, sizes, offset: i * 0.5 };
    });
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    groupRef.current.children.forEach((child, i) => {
      if (child instanceof THREE.Points) {
        const positions = child.geometry.attributes.position.array as Float32Array;
        for (let j = 0; j < positions.length; j += 3) {
          positions[j] += Math.sin(t * 0.1 + i + j) * 0.01;
          positions[j + 1] += Math.cos(t * 0.05 + i + j) * 0.005;
        }
        child.geometry.attributes.position.needsUpdate = true;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {layers.map((layer, i) => (
        <points key={i} frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[layer.positions, 3]} />
          </bufferGeometry>
          <pointsMaterial
            size={0.8}
            color="#4ecdc4"
            transparent
            opacity={0.05}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            sizeAttenuation
          />
        </points>
      ))}
    </group>
  );
}
