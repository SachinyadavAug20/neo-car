"use client";

import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { useStore } from "@/app/lib/store";
import { useNarrative } from "@/app/lib/narrativeStore";

interface CollectibleEffect {
  id: string;
  position: THREE.Vector3;
  startTime: number;
}

export default function CollectibleEffects() {
  const { collectLore } = useNarrative();
  const [effects, setEffects] = useState<CollectibleEffect[]>([]);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    groupRef.current.children.forEach((child, i) => {
      if (child instanceof THREE.Group) {
        const elapsed = (performance.now() - effects[i]?.startTime) / 1000;
        if (elapsed < 2) {
          child.scale.setScalar(1 + elapsed * 0.5);
          child.position.y += 0.02;
        } else {
          child.visible = false;
        }
      }
    });
  });

  return (
    <group ref={groupRef}>
      {effects.map((effect) => (
        <group key={effect.id} position={effect.position.toArray()}>
          <mesh>
            <ringGeometry args={[0.3, 0.35, 32]} />
            <meshBasicMaterial
              color="#fbbf24"
              transparent
              opacity={0.5}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          <Html center distanceFactor={10}>
            <div className="text-[10px] tracking-[0.3em] text-amber-400/60 whitespace-nowrap pointer-events-none">
              +1
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}
