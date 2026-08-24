"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const LINE_COUNT = 40;

export default function LightBeams() {
  const groupRef = useRef<THREE.Group>(null);

  const beams = useMemo(() => {
    return Array.from({ length: LINE_COUNT }, () => ({
      x: (Math.random() - 0.5) * 60,
      z: (Math.random() - 0.5) * 60,
      height: 10 + Math.random() * 20,
      width: 0.02 + Math.random() * 0.05,
      speed: 0.5 + Math.random() * 1,
      offset: Math.random() * Math.PI * 2,
    }));
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    groupRef.current.children.forEach((child, i) => {
      if (child instanceof THREE.Mesh) {
        const beam = beams[i];
        const pulse = 0.3 + Math.sin(t * beam.speed + beam.offset) * 0.3;
        child.material.opacity = pulse * 0.1;
        child.position.y = beam.height * 0.5 + Math.sin(t * 0.2 + i) * 2;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {beams.map((beam, i) => (
        <mesh key={i} position={[beam.x, beam.height * 0.5, beam.z]}>
          <planeGeometry args={[beam.width, beam.height]} />
          <meshBasicMaterial
            color="#fbbf24"
            transparent
            opacity={0.1}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
