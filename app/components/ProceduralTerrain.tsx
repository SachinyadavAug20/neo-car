"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import { createNoise2D } from "simplex-noise";
import { useAudioAnalyzer } from "../hooks/useAudioAnalyzer";

const TERRAIN_SIZE = 200;
const TERRAIN_SEGMENTS = 96;
const NOISE_FREQUENCY = 0.04;
const NOISE_AMPLITUDE = 4;

export default function ProceduralTerrain() {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const { getFrequencies } = useAudioAnalyzer();

  const geometry = useMemo(() => {
    const noise2D = createNoise2D();
    const geo = new THREE.PlaneGeometry(
      TERRAIN_SIZE,
      TERRAIN_SIZE,
      TERRAIN_SEGMENTS,
      TERRAIN_SEGMENTS,
    );
    geo.rotateX(-Math.PI / 2);

    const positions = geo.attributes.position.array as Float32Array;
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2];
      positions[i + 1] = noise2D(x * NOISE_FREQUENCY, z * NOISE_FREQUENCY) * NOISE_AMPLITUDE;
    }

    geo.computeVertexNormals();
    return geo;
  }, []);

  useFrame(() => {
    const [bass] = getFrequencies();
    if (!materialRef.current) return;
    const target = 0.5 + bass * 3.5;
    materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
      materialRef.current.emissiveIntensity,
      target,
      0.15,
    );
  });

  return (
    <RigidBody type="fixed" colliders="trimesh">
      <mesh geometry={geometry}>
        <meshStandardMaterial
          ref={materialRef}
          color="#ff2d95"
          wireframe
          emissive="#ff2d95"
          emissiveIntensity={0.5}
        />
      </mesh>
    </RigidBody>
  );
}