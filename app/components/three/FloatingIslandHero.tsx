"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "@/app/lib/store";

const SEGMENTS = 64;
const RADIUS = 8;
const HEIGHT = 2;
const NOISE_SCALE = 0.3;

function noise2D(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return (n - Math.floor(n)) * 2 - 1;
}

function fbm(x: number, y: number): number {
  let value = 0;
  let amplitude = 0.5;
  for (let i = 0; i < 4; i++) {
    value += amplitude * noise2D(x, y);
    x *= 2.0;
    y *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

export default function FloatingIslandHero() {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const activeIsland = useStore((s) => s.activeIsland);

  const geometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(RADIUS, RADIUS * 0.8, HEIGHT, SEGMENTS, SEGMENTS);
    const positions = geo.attributes.position;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);

      if (y < 0) {
        const noise = fbm(x * NOISE_SCALE, z * NOISE_SCALE);
        const edgeFactor = Math.sqrt(x * x + z * z) / RADIUS;
        const taper = 1 - edgeFactor * 0.5;
        positions.setY(i, y * taper + noise * 0.5);
      }
    }

    geo.computeVertexNormals();
    return geo;
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    groupRef.current.position.y = Math.sin(t * 0.5) * 0.3;
    groupRef.current.rotation.y = t * 0.1;
  });

  return (
    <group ref={groupRef} position={[0, 5, 0]}>
      <mesh geometry={geometry} receiveShadow castShadow>
        <meshStandardMaterial
          color="#1a1a2e"
          roughness={0.8}
          metalness={0.2}
          flatShading
        />
      </mesh>

      <mesh position={[0, HEIGHT * 0.5 + 0.1, 0]} receiveShadow>
        <circleGeometry args={[RADIUS * 0.95, SEGMENTS]} />
        <meshStandardMaterial
          color="#0d4f3c"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      <group position={[0, HEIGHT * 0.5 + 0.5, 0]}>
        <mesh position={[0, 0, 0]} castShadow>
          <octahedronGeometry args={[0.8, 0]} />
          <meshStandardMaterial
            color="#67e8f9"
            emissive="#67e8f9"
            emissiveIntensity={0.5}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
        <pointLight color="#67e8f9" intensity={2} distance={10} decay={2} />
      </group>

      <group position={[2, HEIGHT * 0.5 + 0.3, 1]} scale={0.3}>
        <mesh castShadow>
          <coneGeometry args={[0.5, 1.5, 6]} />
          <meshStandardMaterial color="#a78bfa" emissive="#a78bfa" emissiveIntensity={0.3} />
        </mesh>
      </group>

      <group position={[-3, HEIGHT * 0.5 + 0.2, -1]} scale={0.4}>
        <mesh castShadow>
          <dodecahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial color="#f472b6" emissive="#f472b6" emissiveIntensity={0.3} />
        </mesh>
      </group>

      <group position={[1, HEIGHT * 0.5 + 0.4, -2]} scale={0.25}>
        <mesh castShadow>
          <icosahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.3} />
        </mesh>
      </group>
    </group>
  );
}
