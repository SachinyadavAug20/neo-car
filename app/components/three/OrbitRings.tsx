"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const RING_COUNT = 5;

export default function OrbitRings() {
  const groupRef = useRef<THREE.Group>(null);

  const rings = useMemo(() => {
    return Array.from({ length: RING_COUNT }, (_, i) => ({
      radius: 4 + i * 3,
      tube: 0.03 + i * 0.01,
      color: new THREE.Color().setHSL(i / RING_COUNT, 0.7, 0.6),
      speed: 0.2 + i * 0.1,
      tilt: (i * Math.PI) / RING_COUNT,
      rotSpeed: 0.3 + i * 0.1,
    }));
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      child.rotation.y = state.clock.elapsedTime * rings[i].rotSpeed;
      child.rotation.x = rings[i].tilt + Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    });
  });

  return (
    <group ref={groupRef}>
      {rings.map((ring, i) => (
        <mesh key={i} position={[0, 8, 0]} frustumCulled={false}>
          <torusGeometry args={[ring.radius, ring.tube, 8, 48]} />
          <meshBasicMaterial color={ring.color} transparent opacity={0.15} />
        </mesh>
      ))}
    </group>
  );
}
