"use client";

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import { ISLANDS } from "@/app/lib/types";
import { useAppStore } from "@/app/lib/store";

function IslandBase({ color, scale = 1 }: { color: string; scale?: number }) {
  const geo = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(3 * scale, 3);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      if (y > 0.5 * scale) {
        pos.setY(i, y * 0.4);
      } else {
        pos.setY(i, y - Math.abs(y) * 0.3);
      }
      pos.setX(i, pos.getX(i) + (Math.random() - 0.5) * 0.3 * scale);
      pos.setZ(i, pos.getZ(i) + (Math.random() - 0.5) * 0.3 * scale);
    }
    g.computeVertexNormals();
    return g;
  }, [scale]);

  return (
    <mesh geometry={geo} position={[0, -1.5 * scale, 0]} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.85} metalness={0.1} />
    </mesh>
  );
}

function CrystalCluster({ color }: { color: string }) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.children.forEach((child, i) => {
        const m = child as THREE.Mesh;
        m.rotation.y = state.clock.elapsedTime * 0.3 + i;
        m.position.y = 1 + Math.sin(state.clock.elapsedTime * 0.8 + i * 1.5) * 0.15;
      });
    }
  });

  return (
    <group ref={ref}>
      {[0, 1.2, 2.4, 3.6].map((rot, i) => (
        <mesh key={i} rotation={[0, rot, 0.1 * (i % 2 ? 1 : -1)]} position={[Math.cos(rot) * 0.8, 1, Math.sin(rot) * 0.8]}>
          <octahedronGeometry args={[0.3 + i * 0.08, 0]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} roughness={0.2} metalness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function Mushroom({ height, capColor, stemColor }: { height: number; capColor: string; stemColor: string }) {
  return (
    <group>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.08, 0.12, height, 8]} />
        <meshStandardMaterial color={stemColor} roughness={0.7} />
      </mesh>
      <mesh position={[0, height, 0]} rotation={[0, 0, 0]}>
        <sphereGeometry args={[0.4, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={capColor} emissive={capColor} emissiveIntensity={0.3} roughness={0.5} />
      </mesh>
    </group>
  );
}

function Pillar({ height, color }: { height: number; color: string }) {
  return (
    <group>
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[0.4, height, 0.4]} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[0, height + 0.15, 0]}>
        <boxGeometry args={[0.6, 0.3, 0.6]} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.2} />
      </mesh>
    </group>
  );
}

function FloatingPetal({ color }: { color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  const offset = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime + offset;
      ref.current.position.y = 1.5 + Math.sin(t * 0.5) * 0.5;
      ref.current.position.x = Math.sin(t * 0.3) * 1.5;
      ref.current.rotation.z = Math.sin(t * 0.4) * 0.5;
    }
  });

  return (
    <mesh ref={ref}>
      <planeGeometry args={[0.3, 0.5]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} side={THREE.DoubleSide} transparent opacity={0.8} />
    </mesh>
  );
}

function CrystalIsland() {
  return (
    <group>
      <IslandBase color="#164e63" />
      <CrystalCluster color="#67e8f9" />
      <CrystalCluster color="#22d3ee" />
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.5, 32]} />
        <meshStandardMaterial color="#0e7490" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

function MushroomIsland() {
  return (
    <group>
      <IslandBase color="#3b0764" />
      <Mushroom height={2.5} capColor="#c084fc" stemColor="#a78bfa" />
      <Mushroom height={1.5} capColor="#e879f9" stemColor="#d946ef" />
      <Mushroom height={1.8} capColor="#a78bfa" stemColor="#8b5cf6" />
      <Mushroom height={1.0} capColor="#d946ef" stemColor="#c084fc" />
    </group>
  );
}

function RuinsIsland() {
  return (
    <group>
      <IslandBase color="#78350f" />
      <Pillar height={3} color="#d4a574" />
      <Pillar height={2} color="#c8956e" />
      <Pillar height={2.5} color="#b8866a" />
      <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 2, 6]} />
        <meshStandardMaterial color="#92400e" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

function GardenIsland() {
  return (
    <group>
      <IslandBase color="#831843" />
      {[0, 1, 2, 3, 4].map((i) => (
        <FloatingPetal key={i} color={i % 2 === 0 ? "#fda4af" : "#fb7185"} />
      ))}
      <mesh position={[0, 0.5, 0]}>
        <dodecahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial color="#f472b6" emissive="#f472b6" emissiveIntensity={0.5} roughness={0.3} />
      </mesh>
    </group>
  );
}

const ISLAND_COMPONENTS = [CrystalIsland, MushroomIsland, RuinsIsland, GardenIsland];

export default function SkyIslands() {
  const setHoveredIsland = useAppStore((s) => s.setHoveredIsland);
  const setActiveIsland = useAppStore((s) => s.setActiveIsland);
  const setIsTransitioning = useAppStore((s) => s.setIsTransitioning);

  return (
    <>
      {ISLANDS.map((island, i) => {
        const IslandComponent = ISLAND_COMPONENTS[i];
        return (
          <Float key={island.id} speed={0.8 + i * 0.15} rotationIntensity={0.1} floatIntensity={0.5}>
            <group
              position={island.position}
              onClick={(e) => {
                e.stopPropagation();
                if (useAppStore.getState().isTransitioning) return;
                setIsTransitioning(true);
                setActiveIsland(island);
              }}
              onPointerEnter={() => setHoveredIsland(island.id)}
              onPointerLeave={() => setHoveredIsland(null)}
            >
              <IslandComponent />

              <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[4, 32]} />
                <meshBasicMaterial color={island.color} transparent opacity={0.08} />
              </mesh>

              <pointLight position={[0, 3, 0]} intensity={0.5} color={island.color} distance={15} decay={2} />
            </group>
          </Float>
        );
      })}
    </>
  );
}
