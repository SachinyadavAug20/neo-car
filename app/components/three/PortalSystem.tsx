"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { useStore } from "@/app/lib/store";
import { useNarrative } from "@/app/lib/narrativeStore";
import { ISLANDS } from "@/app/lib/types";

export default function PortalSystem() {
  const { started } = useNarrative();
  const { setActiveIsland, setIsTransitioning } = useStore();
  const [hoveredPortal, setHoveredPortal] = useState<number | null>(null);
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state) => {
    if (!started) return;
    const t = state.clock.elapsedTime;
    refs.current.forEach((ref, i) => {
      if (ref) {
        ref.rotation.y = t * 0.5;
        ref.rotation.z = Math.sin(t + i) * 0.2;
        const scale = hoveredPortal === i ? 1.3 : 1;
        ref.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
      }
    });
  });

  if (!started) return null;

  return (
    <>
      {ISLANDS.map((island, i) => {
        const portalPos: [number, number, number] = [
          island.position[0] + 5,
          island.position[1] + 3,
          island.position[2] + 5,
        ];
        return (
          <group key={island.id} position={portalPos}>
            <mesh
              ref={(el) => { refs.current[i] = el; }}
              onClick={(e) => {
                e.stopPropagation();
                setIsTransitioning(true);
                setActiveIsland(island);
              }}
              onPointerEnter={() => setHoveredPortal(i)}
              onPointerLeave={() => setHoveredPortal(null)}
            >
              <torusGeometry args={[0.5, 0.08, 8, 24]} />
              <meshStandardMaterial
                color={island.color}
                emissive={island.color}
                emissiveIntensity={hoveredPortal === i ? 2 : 0.8}
                transparent
                opacity={0.7}
              />
            </mesh>
            <pointLight color={island.color} intensity={0.5} distance={5} />
            {hoveredPortal === i && (
              <Html center distanceFactor={10}>
                <div className="glass px-3 py-1.5 rounded-full text-[10px] tracking-[0.2em] whitespace-nowrap pointer-events-none" style={{ color: island.color }}>
                  PORTAL TO {island.name.toUpperCase()}
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </>
  );
}
