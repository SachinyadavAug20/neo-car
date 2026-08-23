"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useNarrative } from "@/app/lib/narrativeStore";

export default function RuneCircles() {
  const { started } = useNarrative();
  const circlesRef = useRef<THREE.Group>(null);

  const circles = useMemo(() => {
    return [
      { x: 0, y: 0.1, z: 0, radius: 3, color: "#67e8f9", speed: 0.3, segments: 24 },
      { x: 8, y: 0.1, z: -3, radius: 2, color: "#a78bfa", speed: -0.2, segments: 16 },
      { x: -6, y: 0.1, z: 4, radius: 2.5, color: "#fbbf24", speed: 0.25, segments: 20 },
      { x: 4, y: 0.1, z: 6, radius: 1.8, color: "#f472b6", speed: -0.35, segments: 12 },
    ];
  }, []);

  useFrame((state) => {
    if (!circlesRef.current) return;
    circlesRef.current.children.forEach((child, i) => {
      child.rotation.y = state.clock.elapsedTime * circles[i].speed;
    });
  });

  if (!started) return null;

  return (
    <group ref={circlesRef}>
      {circles.map((circle, i) => (
        <group key={i} position={[circle.x, circle.y, circle.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
            <ringGeometry args={[circle.radius - 0.05, circle.radius + 0.05, circle.segments]} />
            <meshBasicMaterial color={circle.color} transparent opacity={0.3} side={THREE.DoubleSide} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
            <ringGeometry args={[circle.radius * 0.6 - 0.03, circle.radius * 0.6 + 0.03, circle.segments]} />
            <meshBasicMaterial color={circle.color} transparent opacity={0.2} side={THREE.DoubleSide} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
            <ringGeometry args={[circle.radius * 0.3 - 0.02, circle.radius * 0.3 + 0.02, 8]} />
            <meshBasicMaterial color={circle.color} transparent opacity={0.4} side={THREE.DoubleSide} />
          </mesh>
          <pointLight color={circle.color} intensity={0.2} distance={circle.radius * 2} decay={2} />
        </group>
      ))}
    </group>
  );
}
