"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const RING_COUNT = 5;
const PARTICLES_PER_RING = 80;

export default function PortalRings() {
  const groupRef = useRef<THREE.Group>(null);

  const rings = useMemo(() => {
    return Array.from({ length: RING_COUNT }, (_, i) => {
      const positions = new Float32Array(PARTICLES_PER_RING * 3);
      const radius = 2 + i * 0.5;

      for (let j = 0; j < PARTICLES_PER_RING; j++) {
        const angle = (j / PARTICLES_PER_RING) * Math.PI * 2;
        const i3 = j * 3;
        positions[i3] = Math.cos(angle) * radius;
        positions[i3 + 1] = 0;
        positions[i3 + 2] = Math.sin(angle) * radius;
      }

      return { positions, radius, offset: i * 0.2 };
    });
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    groupRef.current.children.forEach((child, i) => {
      if (child instanceof THREE.Points) {
        child.rotation.y = t * 0.5 + rings[i].offset;
        child.rotation.x = Math.sin(t * 0.3 + i) * 0.3;

        const positions = child.geometry.attributes.position.array as Float32Array;
        for (let j = 0; j < positions.length; j += 3) {
          const angle = (j / 3 / PARTICLES_PER_RING) * Math.PI * 2 + t;
          positions[j + 1] = Math.sin(angle + i) * 0.3;
        }
        child.geometry.attributes.position.needsUpdate = true;
      }
    });
  });

  return (
    <group ref={groupRef} position={[0, 8, 0]}>
      {rings.map((ring, i) => (
        <points key={i} frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[ring.positions, 3]} />
          </bufferGeometry>
          <pointsMaterial
            size={0.06}
            color="#a78bfa"
            transparent
            opacity={0.4}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            sizeAttenuation
          />
        </points>
      ))}
    </group>
  );
}
