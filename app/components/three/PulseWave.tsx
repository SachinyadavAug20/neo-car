"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useNarrative } from "@/app/lib/narrativeStore";

const WAVE_COUNT = 6;

export default function PulseWave() {
  const { started } = useNarrative();
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    timeRef.current += delta;
    
    groupRef.current.children.forEach((child, i) => {
      const ring = child as THREE.Mesh;
      const mat = ring.material as THREE.MeshBasicMaterial;
      const phase = (timeRef.current * 0.5 + i / WAVE_COUNT) % 1;
      const scale = 1 + phase * 15;
      ring.scale.set(scale, scale, 1);
      mat.opacity = (1 - phase) * 0.15;
    });
  });

  if (!started) return null;

  return (
    <group ref={groupRef} position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {Array.from({ length: WAVE_COUNT }, (_, i) => (
        <mesh key={i} frustumCulled={false}>
          <ringGeometry args={[0.9, 1, 32]} />
          <meshBasicMaterial color="#67e8f9" transparent opacity={0.1} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}
