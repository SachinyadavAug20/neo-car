"use client";

import { useRef, useState, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { useNarrative } from "@/app/lib/narrativeStore";

const CRYSTAL_POSITIONS: [number, number, number][] = [
  [0, 2, 3],
  [1.5, 2.5, 0],
  [-1.5, 2.5, 0],
  [0, 2.5, -1.5],
];

const CORRECT_ORDER = [0, 2, 3, 1];

export default function CrystalPuzzle() {
  const { started } = useNarrative();
  const [activated, setActivated] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const groupRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state) => {
    if (!started || solved) return;
    const t = state.clock.elapsedTime;
    groupRefs.current.forEach((ref, i) => {
      if (ref && !activated.includes(i)) {
        ref.rotation.y = t * 0.5 + i * Math.PI * 0.5;
        ref.position.y = CRYSTAL_POSITIONS[i][1] + Math.sin(t + i) * 0.1;
      }
    });
  });

  const activateCrystal = useCallback((index: number) => {
    if (solved || activated.includes(index)) return;

    const newActivated = [...activated, index];
    setActivated(newActivated);

    if (newActivated.length === CORRECT_ORDER.length) {
      const isCorrect = CORRECT_ORDER.every((v, i) => v === newActivated[i]);
      if (isCorrect) {
        setSolved(true);
      } else {
        setTimeout(() => setActivated([]), 1000);
      }
    }
  }, [activated, solved]);

  if (!started) return null;

  return (
    <group position={[-30, -5, -35]}>
      {!solved && (
        <Html center distanceFactor={15}>
          <div
            className="glass px-3 py-1.5 rounded-full text-[10px] tracking-[0.2em] text-amber-400/60 whitespace-nowrap cursor-pointer hover:text-amber-400/80 transition-colors"
            onClick={() => setShowHint(!showHint)}
          >
            {showHint ? "Light crystals in order: birth → growth → loss → renewal" : "ANCIENT PUZZLE"}
          </div>
        </Html>
      )}

      {CRYSTAL_POSITIONS.map((pos, i) => (
        <mesh
          key={i}
          ref={(el) => { groupRefs.current[i] = el; }}
          position={pos}
          onClick={(e) => { e.stopPropagation(); activateCrystal(i); }}
        >
          <octahedronGeometry args={[0.3, 0]} />
          <meshStandardMaterial
            color={activated.includes(i) ? "#fbbf24" : "#ffffff"}
            emissive={activated.includes(i) ? "#fbbf24" : "#333333"}
            emissiveIntensity={activated.includes(i) ? 1.5 : 0.2}
            transparent
            opacity={activated.includes(i) ? 1 : 0.5}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
      ))}

      {solved && (
        <Html center distanceFactor={15}>
          <div className="glass px-4 py-2 rounded-xl text-center animate-fadeIn">
            <div className="text-[10px] tracking-[0.5em] text-amber-400 uppercase mb-1">Puzzle Solved</div>
            <div className="text-xs text-white/40">The ancient stones remember your name.</div>
          </div>
        </Html>
      )}
    </group>
  );
}
