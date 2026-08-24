"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const SPHERE_COUNT = 15;

export default function FloatingSpheres() {
  const groupRef = useRef<THREE.Group>(null);

  const spheres = useMemo(() => {
    return Array.from({ length: SPHERE_COUNT }, (_, i) => {
      const radius = 0.5 + Math.random() * 1.5;
      const distance = 8 + Math.random() * 20;
      const angle = (i / SPHERE_COUNT) * Math.PI * 2;
      const height = (Math.random() - 0.5) * 15;

      return {
        radius,
        distance,
        angle,
        height,
        speed: 0.1 + Math.random() * 0.3,
        offset: Math.random() * Math.PI * 2,
        color: ["#4ecdc4", "#a78bfa", "#f472b6", "#fbbf24", "#67e8f9"][i % 5],
      };
    });
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    groupRef.current.children.forEach((child, i) => {
      if (child instanceof THREE.Mesh) {
        const sphere = spheres[i];
        const currentAngle = sphere.angle + t * sphere.speed;

        child.position.set(
          Math.cos(currentAngle) * sphere.distance,
          sphere.height + Math.sin(t * 0.5 + sphere.offset) * 2,
          Math.sin(currentAngle) * sphere.distance,
        );

        child.rotation.x = t * 0.3;
        child.rotation.y = t * 0.2;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {spheres.map((sphere, i) => (
        <mesh key={i} position={[0, sphere.height, sphere.distance]}>
          <sphereGeometry args={[sphere.radius, 32, 32]} />
          <meshStandardMaterial
            color={sphere.color}
            emissive={sphere.color}
            emissiveIntensity={0.3}
            roughness={0.2}
            metalness={0.8}
            transparent
            opacity={0.7}
          />
          <pointLight color={sphere.color} intensity={0.5} distance={8} decay={2} />
        </mesh>
      ))}
    </group>
  );
}
