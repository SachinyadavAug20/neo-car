"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { useNarrative } from "@/app/lib/narrativeStore";

const GHOST_POSITIONS: { pos: [number, number, number]; text: string; rot: number }[] = [
  { pos: [5, 3, 0], text: "I was here.", rot: 0.1 },
  { pos: [35, 0, -18], text: "The spores remember.", rot: -0.2 },
  { pos: [-30, -4, -35], text: "We forgot, but the stones didn't.", rot: 0.15 },
  { pos: [15, -8, -48], text: "Every petal is a goodbye.", rot: -0.1 },
  { pos: [0, 4, -5], text: "The light found me.", rot: 0.05 },
  { pos: [37, 2, -20], text: "Growth hurts. But it's worth it.", rot: -0.15 },
  { pos: [-31, -3, -36], text: "Some things must fall.", rot: 0.2 },
  { pos: [15, -7, -50], text: "Bloom where you're planted.", rot: -0.05 },
];

export default function GhostMemories() {
  const { started } = useNarrative();
  const refs = useRef<(THREE.Group | null)[]>([]);

  useFrame((state) => {
    if (!started) return;
    const t = state.clock.elapsedTime;
    refs.current.forEach((ref, i) => {
      if (ref) {
        ref.position.y = GHOST_POSITIONS[i].pos[1] + Math.sin(t * 0.3 + i * 2) * 0.3;
        ref.rotation.y = GHOST_POSITIONS[i].rot + Math.sin(t * 0.2 + i) * 0.1;
      }
    });
  });

  if (!started) return null;

  return (
    <>
      {GHOST_POSITIONS.map((ghost, i) => (
        <group
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          position={ghost.pos}
        >
          <mesh>
            <planeGeometry args={[0.5, 0.15]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.08} side={THREE.DoubleSide} />
          </mesh>
          <Html center distanceFactor={15} style={{ pointerEvents: "none" }}>
            <div className="text-[8px] text-white/10 italic whitespace-nowrap tracking-wider">
              {ghost.text}
            </div>
          </Html>
        </group>
      ))}
    </>
  );
}
