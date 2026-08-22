"use client";

import { useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useAppStore, type Collectible } from "@/app/lib/store";

const COUNT = 24;
const SPREAD = 60;

function generateCollectibles(): Collectible[] {
  const items: Collectible[] = [];
  for (let i = 0; i < COUNT; i++) {
    const angle = (i / COUNT) * Math.PI * 2;
    const radius = 8 + Math.random() * SPREAD;
    items.push({
      id: `c-${i}`,
      position: [
        Math.cos(angle) * radius,
        2 + Math.random() * 8,
        Math.sin(angle) * radius - 20,
      ],
      collected: false,
    });
  }
  return items;
}

function Crystal({ position, id }: { position: [number, number, number]; id: string }) {
  const ref = useRef<THREE.Mesh>(null);
  const collectItem = useAppStore((s) => s.collectItem);
  const collected = useAppStore((s) =>
    s.collectibles.find((c) => c.id === id)?.collected,
  );

  useFrame((state) => {
    if (!ref.current || collected) return;
    ref.current.rotation.y = state.clock.elapsedTime * 1.5;
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.2 + position[0]) * 0.3;
  });

  if (collected) return null;

  return (
    <mesh
      ref={ref}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        collectItem(id);
      }}
      onPointerEnter={() => (document.body.style.cursor = "pointer")}
      onPointerLeave={() => (document.body.style.cursor = "auto")}
    >
      <octahedronGeometry args={[0.35, 0]} />
      <meshStandardMaterial
        color="#fde68a"
        emissive="#fbbf24"
        emissiveIntensity={1.2}
        roughness={0.15}
        metalness={0.9}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

export default function Collectibles() {
  const collectibles = useAppStore((s) => s.collectibles);
  const setCollectibles = useAppStore((s) => s.setCollectibles);

  useEffect(() => {
    if (collectibles.length === 0) {
      setCollectibles(generateCollectibles());
    }
  }, [collectibles.length, setCollectibles]);

  return (
    <>
      {collectibles.map((c) => (
        <Crystal key={c.id} position={c.position} id={c.id} />
      ))}
    </>
  );
}
