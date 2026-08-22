"use client";

import { useRef, useCallback } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useAppStore, type WorldNote } from "@/app/lib/store";

const NOTE_COLORS = ["#fde68a", "#fca5a5", "#a5b4fc", "#86efac", "#fdba74", "#c4b5fd"];

export default function NotePlacer() {
  const isPlacing = useAppStore((s) => s.isPlacingNote);
  const setIsPlacing = useAppStore((s) => s.setIsPlacingNote);
  const addNote = useAppStore((s) => s.addNote);
  const color = useAppStore((s) => s.notePlacementColor);

  const ghostRef = useRef<THREE.Mesh>(null);
  const { raycaster, camera, scene } = useThree();

  useFrame((state) => {
    if (!isPlacing || !ghostRef.current) return;
    const mat = ghostRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 3) * 0.15;
  });

  const handleClick = useCallback(
    (e: any) => {
      if (!isPlacing) return;
      const point = e.point as THREE.Vector3;
      if (!point) return;

      const note: WorldNote = {
        id: Date.now().toString(),
        text: "New note",
        color,
        position: [point.x, point.y + 0.5, point.z],
        rotation: [
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.15,
        ],
        createdAt: Date.now(),
      };

      addNote(note);
      setIsPlacing(false);
    },
    [isPlacing, color, addNote, setIsPlacing],
  );

  if (!isPlacing) return null;

  return (
    <>
      <mesh
        ref={ghostRef}
        visible={isPlacing}
        position={[0, 5, 0]}
        onClick={handleClick}
      >
        <planeGeometry args={[1.2, 0.9]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>

      <mesh visible={isPlacing} position={[0, 5.5, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} />
      </mesh>
    </>
  );
}

export { NOTE_COLORS };
