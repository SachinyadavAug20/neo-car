"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import { createNoise2D } from "simplex-noise";
import { useAudioAnalyzer } from "../hooks/useAudioAnalyzer";

const TERRAIN_WIDTH = 200;
const TERRAIN_DEPTH = 1600;
const TERRAIN_SEGMENTS_X = 96;
const TERRAIN_SEGMENTS_Z = 160;
const TERRAIN_CENTER_Z = -800;
const NOISE_FREQUENCY = 0.04;
const NOISE_AMPLITUDE = 6;
const FBM_OCTAVES = 3;
const HIGHWAY_FALLOFF = 18;
const MIN_ELEVATION = 0.08;

export default function ProceduralTerrain() {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const { getFrequencies } = useAudioAnalyzer();

  const geometry = useMemo(() => {
    const noise2D = createNoise2D();
    const geo = new THREE.PlaneGeometry(
      TERRAIN_WIDTH,
      TERRAIN_DEPTH,
      TERRAIN_SEGMENTS_X,
      TERRAIN_SEGMENTS_Z,
    );
    geo.rotateX(-Math.PI / 2);

    const positions = geo.attributes.position.array as Float32Array;
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2];

      let height = 0;
      let maxAmplitude = 0;
      let amplitude = 1;
      let frequency = NOISE_FREQUENCY;
      for (let octave = 0; octave < FBM_OCTAVES; octave++) {
        height += noise2D(x * frequency, z * frequency) * amplitude;
        maxAmplitude += amplitude;
        frequency *= 2;
        amplitude *= 0.5;
      }
      const normalized = height / maxAmplitude;

      const highwayFalloff = 1 - Math.exp(-Math.abs(x) / HIGHWAY_FALLOFF);
      const elevation = MIN_ELEVATION + (1 - MIN_ELEVATION) * highwayFalloff;

      positions[i + 1] = normalized * NOISE_AMPLITUDE * elevation;
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
    <RigidBody type="fixed" colliders={false}>
      <mesh geometry={geometry} position={[0, 0, TERRAIN_CENTER_Z]}>
        <meshStandardMaterial color="#05010d" roughness={0.8} />
      </mesh>
      <mesh
        geometry={geometry}
        position={[0, 0, TERRAIN_CENTER_Z]}
        userData={{ r3RapierType: "MeshCollider" }}
      >
        <meshStandardMaterial
          ref={materialRef}
          color="#ff2d95"
          wireframe
          emissive="#ff2d95"
          emissiveIntensity={0.5}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>
    </RigidBody>
  );
}