"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const NODE_COUNT = 25;

export default function FloatingOrbs() {
  const groupRef = useRef<THREE.Group>(null);

  const orbs = useMemo(() => {
    return Array.from({ length: NODE_COUNT }, (_, i) => ({
      x: (Math.random() - 0.5) * 40,
      y: Math.random() * 20 - 5,
      z: (Math.random() - 0.5) * 40,
      scale: 0.1 + Math.random() * 0.3,
      speed: 0.3 + Math.random() * 0.5,
      offset: Math.random() * Math.PI * 2,
      color: ["#4ecdc4", "#a78bfa", "#f472b6", "#fbbf24", "#67e8f9"][i % 5],
    }));
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    groupRef.current.children.forEach((child, i) => {
      if (child instanceof THREE.Group) {
        const orb = orbs[i];
        child.position.set(
          orb.x + Math.sin(t * orb.speed + orb.offset) * 3,
          orb.y + Math.cos(t * orb.speed * 0.7 + orb.offset) * 2,
          orb.z + Math.sin(t * orb.speed * 0.5 + orb.offset) * 3,
        );
        child.rotation.y = t * orb.speed;
        child.rotation.x = t * orb.speed * 0.5;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {orbs.map((orb, i) => (
        <group key={i} position={[orb.x, orb.y, orb.z]}>
          <mesh scale={orb.scale}>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial
              color={orb.color}
              emissive={orb.color}
              emissiveIntensity={0.5}
              roughness={0.3}
              metalness={0.7}
              wireframe
            />
          </mesh>
          <pointLight color={orb.color} intensity={0.5} distance={5} decay={2} />
        </group>
      ))}
    </group>
  );
}
