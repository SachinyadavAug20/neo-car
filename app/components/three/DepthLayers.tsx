"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function DepthLayers() {
  const group1Ref = useRef<THREE.Group>(null);
  const group2Ref = useRef<THREE.Group>(null);
  const group3Ref = useRef<THREE.Group>(null);

  const farIslands = useMemo(() => {
    return Array.from({ length: 8 }, () => ({
      x: (Math.random() - 0.5) * 150,
      y: 20 + Math.random() * 30,
      z: -60 - Math.random() * 40,
      scale: 0.4 + Math.random() * 0.3,
      speed: 0.02 + Math.random() * 0.03,
      offset: Math.random() * Math.PI * 2,
    }));
  }, []);

  const midIslands = useMemo(() => {
    return Array.from({ length: 5 }, () => ({
      x: (Math.random() - 0.5) * 100,
      y: 15 + Math.random() * 20,
      z: -30 - Math.random() * 30,
      scale: 0.5 + Math.random() * 0.4,
      speed: 0.05 + Math.random() * 0.05,
      offset: Math.random() * Math.PI * 2,
    }));
  }, []);

  const nearIslands = useMemo(() => {
    return Array.from({ length: 3 }, () => ({
      x: (Math.random() - 0.5) * 60,
      y: 10 + Math.random() * 15,
      z: 10 + Math.random() * 20,
      scale: 0.6 + Math.random() * 0.3,
      speed: 0.08 + Math.random() * 0.07,
      offset: Math.random() * Math.PI * 2,
    }));
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    [
      { ref: group1Ref, speed: 0.1 },
      { ref: group2Ref, speed: 0.2 },
      { ref: group3Ref, speed: 0.3 },
    ].forEach(({ ref, speed }) => {
      if (ref.current) ref.current.rotation.y = t * speed * 0.05;
    });
  });

  return (
    <>
      <group ref={group1Ref}>
        {farIslands.map((island, i) => (
          <FarIsland key={`far-${i}`} {...island} />
        ))}
      </group>
      <group ref={group2Ref}>
        {midIslands.map((island, i) => (
          <FarIsland key={`mid-${i}`} {...island} color="#1a1a4e" />
        ))}
      </group>
      <group ref={group3Ref}>
        {nearIslands.map((island, i) => (
          <FarIsland key={`near-${i}`} {...island} color="#2a2a5e" />
        ))}
      </group>
    </>
  );
}

function FarIsland({
  x, y, z, scale, speed, offset, color = "#151540"
}: {
  x: number; y: number; z: number; scale: number; speed: number; offset: number; color?: string;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = y + Math.sin(state.clock.elapsedTime * speed + offset) * 0.8;
  });

  return (
    <mesh ref={ref} position={[x, y, z]} scale={scale} frustumCulled={false}>
      <dodecahedronGeometry args={[3, 1]} />
      <meshStandardMaterial color={color} roughness={0.9} emissive="#4ecdc4" emissiveIntensity={0.05} />
    </mesh>
  );
}
