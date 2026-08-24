"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const STAR_COUNT = 500;
const NEBULA_LAYERS = 4;

export default function ProceduralNebula() {
  const groupRef = useRef<THREE.Group>(null);

  const [starPositions, starColors, starSizes] = useMemo(() => {
    const pos = new Float32Array(STAR_COUNT * 3);
    const col = new Float32Array(STAR_COUNT * 3);
    const siz = new Float32Array(STAR_COUNT);

    for (let i = 0; i < STAR_COUNT; i++) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const radius = 30 + Math.random() * 70;

      pos[i3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i3 + 2] = radius * Math.cos(phi);

      const hue = Math.random() * 0.2 + 0.55;
      const color = new THREE.Color().setHSL(hue, 0.7, 0.8);
      col[i3] = color.r;
      col[i3 + 1] = color.g;
      col[i3 + 2] = color.b;

      siz[i] = 0.05 + Math.random() * 0.15;
    }

    return [pos, col, siz];
  }, []);

  const nebulaLayers = useMemo(() => {
    return Array.from({ length: NEBULA_LAYERS }, (_, i) => {
      const positions = new Float32Array(6 * 3);
      const size = 40 + i * 15;

      positions[0] = -size; positions[1] = -size; positions[2] = -50 - i * 10;
      positions[3] = size; positions[4] = -size; positions[5] = -50 - i * 10;
      positions[6] = size; positions[7] = size; positions[8] = -50 - i * 10;
      positions[9] = -size; positions[10] = -size; positions[11] = -50 - i * 10;
      positions[12] = size; positions[13] = size; positions[14] = -50 - i * 10;
      positions[15] = -size; positions[16] = size; positions[17] = -50 - i * 10;

      const hue = (i / NEBULA_LAYERS) * 0.3 + 0.6;
      const color = new THREE.Color().setHSL(hue, 0.6, 0.3);

      return { positions, color, offset: i * 0.5 };
    });
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    groupRef.current.rotation.y = t * 0.005;
  });

  return (
    <group ref={groupRef}>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[starColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          vertexColors
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      {nebulaLayers.map((layer, i) => (
        <mesh key={i} position={[0, 0, -50 - i * 10]} frustumCulled={false}>
          <planeGeometry args={[80 + i * 15, 80 + i * 15]} />
          <meshBasicMaterial
            color={layer.color}
            transparent
            opacity={0.03}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
