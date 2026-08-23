"use client";

import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useNarrative } from "@/app/lib/narrativeStore";
import { Html } from "@react-three/drei";

const STONE_POSITIONS: [number, number, number][] = [
  [2, 1.5, 1],
  [36, 0, -18],
  [-29, -6, -33],
  [16, -10, -48],
  [0, 2, 0],
  [37, 1, -22],
  [-31, -5, -36],
  [15, -9, -50],
];

const FRAGMENTS = [
  "The first light did not come from the sky. It came from below - a refusal to stay dark.",
  "Every mushroom is a library. Every spore is a book that reads itself.",
  "Connection is not something you find. It is something you become.",
  "The pillars do not mourn what they were. They celebrate what they held.",
  "Storms do not destroy. They translate.",
  "A garden is just a graveyard that learned to bloom.",
  "Wisdom is not knowing more. It is needing less.",
  "You did not find Drift. Drift found you - because it needed a witness.",
];

export default function MemoryStones() {
  const { started } = useNarrative();
  const [collectedStones, setCollectedStones] = useState<Set<number>>(new Set());
  const [hoveredStone, setHoveredStone] = useState<number | null>(null);
  const [activeFragment, setActiveFragment] = useState<string | null>(null);
  const groupRefs = useRef<(THREE.Group | null)[]>([]);

  useFrame((state) => {
    if (!started) return;
    const t = state.clock.elapsedTime;
    groupRefs.current.forEach((ref, i) => {
      if (ref && !collectedStones.has(i)) {
        ref.position.y = STONE_POSITIONS[i][1] + Math.sin(t * 0.8 + i * 1.5) * 0.2;
        ref.rotation.y = t * 0.3 + i;
      }
    });
  });

  const collectStone = (index: number) => {
    if (collectedStones.has(index)) return;
    setCollectedStones((prev) => new Set([...prev, index]));
    setActiveFragment(FRAGMENTS[index]);
    setTimeout(() => setActiveFragment(null), 6000);
  };

  if (!started) return null;

  return (
    <>
      {STONE_POSITIONS.map((pos, i) => (
        <group
          key={i}
          ref={(el) => { groupRefs.current[i] = el; }}
          position={pos}
          onClick={(e) => { e.stopPropagation(); collectStone(i); }}
          onPointerEnter={() => setHoveredStone(i)}
          onPointerLeave={() => setHoveredStone(null)}
        >
          {!collectedStones.has(i) ? (
            <>
              <mesh>
                <octahedronGeometry args={[0.25, 0]} />
                <meshStandardMaterial
                  color="#fbbf24"
                  emissive="#fbbf24"
                  emissiveIntensity={hoveredStone === i ? 1.5 : 0.5}
                  roughness={0.3}
                  metalness={0.7}
                  transparent
                  opacity={0.9}
                />
              </mesh>
              <pointLight color="#fbbf24" intensity={0.5} distance={4} decay={2} />
              {hoveredStone === i && (
                <Html center distanceFactor={10}>
                  <div className="glass px-3 py-1.5 rounded-full text-[10px] tracking-[0.2em] text-amber-400 whitespace-nowrap pointer-events-none">
                    MEMORY STONE
                  </div>
                </Html>
              )}
            </>
          ) : (
            <mesh>
              <octahedronGeometry args={[0.15, 0]} />
              <meshBasicMaterial color="#fbbf24" transparent opacity={0.2} />
            </mesh>
          )}
        </group>
      ))}

      {/* Fragment display */}
      {activeFragment && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 glass rounded-xl px-6 py-4 max-w-md animate-fadeIn pointer-events-none">
          <div className="text-[10px] tracking-[0.5em] text-amber-400/60 uppercase mb-2">Memory Fragment</div>
          <div className="text-sm text-white/50 italic leading-relaxed">{activeFragment}</div>
          <div className="mt-2 text-[10px] text-white/20">{collectedStones.size} / {STONE_POSITIONS.length} found</div>
        </div>
      )}
    </>
  );
}
