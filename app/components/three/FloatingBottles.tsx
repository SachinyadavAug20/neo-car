"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "@/app/lib/store";

export default function FloatingBottles() {
  const notes = useStore((s) => s.notes);
  const groupRef = useRef<THREE.Group>(null);

  const bottlePositions = useMemo(() => {
    return notes.map((_, i) => ({
      x: (i % 5) * 4 - 8,
      y: 8 + Math.random() * 5,
      z: (Math.floor(i / 5)) * 4 - 4,
      speed: 0.3 + Math.random() * 0.4,
      offset: Math.random() * Math.PI * 2,
    }));
  }, [notes.length]);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      const pos = bottlePositions[i];
      if (!pos) return;
      child.position.y = pos.y + Math.sin(state.clock.elapsedTime * pos.speed + pos.offset) * 0.5;
      child.rotation.y = state.clock.elapsedTime * pos.speed * 0.5;
      child.rotation.z = Math.sin(state.clock.elapsedTime * pos.speed * 0.3) * 0.15;
    });
  });

  if (notes.length === 0) return null;

  return (
    <group ref={groupRef}>
      {notes.map((note, i) => {
        const pos = bottlePositions[i];
        if (!pos) return null;
        return (
          <group key={i} position={[pos.x, pos.y, pos.z]}>
            <mesh>
              <cylinderGeometry args={[0.15, 0.25, 0.6, 8]} />
              <meshStandardMaterial color="#67e8f9" transparent opacity={0.5} roughness={0.1} />
            </mesh>
            <mesh position={[0, 0.4, 0]}>
              <cylinderGeometry args={[0.08, 0.15, 0.2, 8]} />
              <meshStandardMaterial color="#4ecdc4" transparent opacity={0.6} roughness={0.1} />
            </mesh>
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.08, 6, 6]} />
              <meshBasicMaterial color="#fbbf24" transparent opacity={0.8} />
            </mesh>
            <pointLight color="#fbbf24" intensity={0.3} distance={3} decay={2} />
          </group>
        );
      })}
    </group>
  );
}
