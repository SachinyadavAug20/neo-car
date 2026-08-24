"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const GRID_SIZE = 60;
const GRID_SEGMENTS = 80;
const NOISE_SCALE = 0.05;
const AMPLITUDE = 3;

function noise2D(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return (n - Math.floor(n)) * 2 - 1;
}

function fbm(x: number, y: number): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let i = 0; i < 5; i++) {
    value += amplitude * noise2D(x * frequency, y * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

export default function ProceduralTerrain() {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE, GRID_SEGMENTS, GRID_SEGMENTS);
    const positions = geo.attributes.position;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const height = fbm(x * NOISE_SCALE, y * NOISE_SCALE) * AMPLITUDE;
      positions.setZ(i, height);
    }

    geo.computeVertexNormals();
    return geo;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    meshRef.current.rotation.z = t * 0.01;
  });

  return (
    <group position={[0, -15, -20]}>
      <mesh ref={meshRef} geometry={geometry} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <meshStandardMaterial
          color="#0a0e27"
          wireframe
          transparent
          opacity={0.15}
          emissive="#4ecdc4"
          emissiveIntensity={0.05}
        />
      </mesh>
    </group>
  );
}
