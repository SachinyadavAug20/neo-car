"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const SHAFT_COUNT = 8;

export default function FogLightShafts() {
  const groupRef = useRef<THREE.Group>(null);

  const shafts = useMemo(() => {
    return Array.from({ length: SHAFT_COUNT }, (_, i) => ({
      x: (Math.random() - 0.5) * 30,
      z: (Math.random() - 0.5) * 30,
      height: 15 + Math.random() * 20,
      width: 1 + Math.random() * 2,
      color: new THREE.Color().setHSL(0.55 + Math.random() * 0.1, 0.5, 0.6),
      speed: 0.2 + Math.random() * 0.3,
      offset: Math.random() * Math.PI * 2,
    }));
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      const shaft = child as THREE.Mesh;
      const mat = shaft.material as THREE.MeshBasicMaterial;
      const pulse = 0.03 + Math.sin(state.clock.elapsedTime * shafts[i].speed + shafts[i].offset) * 0.02;
      mat.opacity = pulse;
    });
  });

  return (
    <group ref={groupRef}>
      {shafts.map((shaft, i) => (
        <mesh
          key={i}
          position={[shaft.x, shaft.height / 2, shaft.z]}
          frustumCulled={false}
        >
          <cylinderGeometry args={[shaft.width * 0.3, shaft.width, shaft.height, 8, 1, true]} />
          <meshBasicMaterial
            color={shaft.color}
            transparent
            opacity={0.03}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
