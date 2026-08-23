"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function FloatingParallax() {
  const group1Ref = useRef<THREE.Group>(null);
  const group2Ref = useRef<THREE.Group>(null);
  const group3Ref = useRef<THREE.Group>(null);

  const islands1 = useMemo(() => Array.from({ length: 6 }, () => ({
    x: (Math.random() - 0.5) * 80,
    y: 35 + Math.random() * 20,
    z: (Math.random() - 0.5) * 80,
    scale: 0.3 + Math.random() * 0.5,
    speed: 0.1 + Math.random() * 0.2,
    offset: Math.random() * Math.PI * 2,
  })), []);

  const islands2 = useMemo(() => Array.from({ length: 4 }, () => ({
    x: (Math.random() - 0.5) * 100,
    y: 45 + Math.random() * 15,
    z: (Math.random() - 0.5) * 100,
    scale: 0.2 + Math.random() * 0.3,
    speed: 0.05 + Math.random() * 0.1,
    offset: Math.random() * Math.PI * 2,
  })), []);

  const islands3 = useMemo(() => Array.from({ length: 3 }, () => ({
    x: (Math.random() - 0.5) * 120,
    y: 55 + Math.random() * 10,
    z: (Math.random() - 0.5) * 120,
    scale: 0.15 + Math.random() * 0.2,
    speed: 0.02 + Math.random() * 0.05,
    offset: Math.random() * Math.PI * 2,
  })), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    [group1Ref, group2Ref, group3Ref].forEach((ref, idx) => {
      if (!ref.current) return;
      const speed = 0.3 - idx * 0.1;
      ref.current.rotation.y = t * speed * 0.1;
    });
  });

  return (
    <>
      <group ref={group1Ref}>
        {islands1.map((island, i) => (
          <FloatingIslandChunk key={`1-${i}`} {...island} />
        ))}
      </group>
      <group ref={group2Ref}>
        {islands2.map((island, i) => (
          <FloatingIslandChunk key={`2-${i}`} {...island} />
        ))}
      </group>
      <group ref={group3Ref}>
        {islands3.map((island, i) => (
          <FloatingIslandChunk key={`3-${i}`} {...island} />
        ))}
      </group>
    </>
  );
}

function FloatingIslandChunk({
  x, y, z, scale, speed, offset
}: {
  x: number; y: number; z: number; scale: number; speed: number; offset: number;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = y + Math.sin(state.clock.elapsedTime * speed + offset) * 1;
    ref.current.rotation.y = state.clock.elapsedTime * speed * 0.3;
  });

  return (
    <mesh ref={ref} position={[x, y, z]} scale={scale} frustumCulled={false}>
      <dodecahedronGeometry args={[2, 0]} />
      <meshStandardMaterial
        color="#1a1a4e"
        roughness={0.8}
        emissive="#4ecdc4"
        emissiveIntensity={0.1}
      />
    </mesh>
  );
}
