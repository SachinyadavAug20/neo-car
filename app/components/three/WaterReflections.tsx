"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const WATER_SIZE = 100;
const WATER_SEGMENTS = 100;

export default function WaterReflections() {
  const meshRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color("#0a0e27") },
    uOpacity: { value: 0.6 },
  }), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    uniforms.uTime.value = t;

    const positions = meshRef.current.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const y = Math.sin(x * 0.1 + t) * 0.3 + Math.cos(z * 0.1 + t * 0.5) * 0.2;
      positions.setY(i, y);
    }
    positions.needsUpdate = true;
  });

  return (
    <group position={[0, -12, 0]}>
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[WATER_SIZE, WATER_SIZE, WATER_SEGMENTS, WATER_SEGMENTS]} />
        <meshStandardMaterial
          color="#0a0e27"
          transparent
          opacity={0.4}
          roughness={0.1}
          metalness={0.8}
          envMapIntensity={1}
        />
      </mesh>
    </group>
  );
}
