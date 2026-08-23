"use client";

import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useNarrative } from "@/app/lib/narrativeStore";

const FRAGMENTS = [
  { text: "She was here once.", pos: [5, 8, -3] as [number, number, number], color: "#67e8f9" },
  { text: "The crystal remembers.", pos: [-8, 6, 5] as [number, number, number], color: "#a78bfa" },
  { text: "Time flows differently.", pos: [0, 10, -8] as [number, number, number], color: "#fbbf24" },
  { text: "Listen to the wind.", pos: [7, 7, 7] as [number, number, number], color: "#4ecdc4" },
  { text: "You are not the first.", pos: [-5, 9, -5] as [number, number, number], color: "#f472b6" },
  { text: "The sky remembers.", pos: [3, 11, 3] as [number, number, number], color: "#c084fc" },
];

export default function StoryFragments() {
  const { started } = useNarrative();
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      child.position.y = FRAGMENTS[i].pos[1] + Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.5;
      child.rotation.y = state.clock.elapsedTime * 0.3 + i;
    });
  });

  if (!started) return null;

  return (
    <group ref={groupRef}>
      {FRAGMENTS.map((frag, i) => (
        <group key={i} position={frag.pos}>
          <mesh frustumCulled={false}>
            <octahedronGeometry args={[0.3, 0]} />
            <meshBasicMaterial color={frag.color} transparent opacity={0.4} wireframe />
          </mesh>
          <pointLight color={frag.color} intensity={0.15} distance={4} decay={2} />
        </group>
      ))}
    </group>
  );
}
