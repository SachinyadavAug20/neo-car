"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const PARTICLE_COUNT = 200;
const TRAIL_LENGTH = 30;
const HARMONIC_MODES = [
  { f1: 1, f2: 2 },
  { f1: 2, f2: 3 },
  { f1: 3, f2: 4 },
  { f1: 3, f2: 5 },
  { f1: 4, f2: 5 },
];

export default function LissajousParticles() {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const modeRef = useRef(0);

  const [trailPositions, pointPositions, colors] = useMemo(() => {
    const trails = new Float32Array(PARTICLE_COUNT * TRAIL_LENGTH * 3);
    const points = new Float32Array(PARTICLE_COUNT * 3);
    const cols = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      points[i3] = 0;
      points[i3 + 1] = 0;
      points[i3 + 2] = 0;

      const hue = Math.random();
      const color = new THREE.Color().setHSL(hue, 0.8, 0.6);
      cols[i3] = color.r;
      cols[i3 + 1] = color.g;
      cols[i3 + 2] = color.b;

      for (let j = 0; j < TRAIL_LENGTH; j++) {
        const idx = (i * TRAIL_LENGTH + j) * 3;
        trails[idx] = 0;
        trails[idx + 1] = 0;
        trails[idx + 2] = 0;
      }
    }

    return [trails, points, cols];
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime * 0.5;
    const mode = HARMONIC_MODES[modeRef.current];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const phase = (i / PARTICLE_COUNT) * Math.PI * 2;
      const A = 8 + Math.sin(i * 0.1) * 3;
      const B = 6 + Math.cos(i * 0.15) * 2;

      const x = A * Math.sin(mode.f1 * t + phase);
      const y = B * Math.cos(mode.f2 * t + phase * 0.5);
      const z = Math.sin(t * 0.3 + i * 0.05) * 2;

      const trailOffset = i * TRAIL_LENGTH;
      for (let j = TRAIL_LENGTH - 1; j > 0; j--) {
        const idx = (trailOffset + j) * 3;
        const prevIdx = (trailOffset + j - 1) * 3;
        trailPositions[idx] = trailPositions[prevIdx];
        trailPositions[idx + 1] = trailPositions[prevIdx + 1];
        trailPositions[idx + 2] = trailPositions[prevIdx + 2];
      }

      trailPositions[trailOffset * 3] = x;
      trailPositions[trailOffset * 3 + 1] = y;
      trailPositions[trailOffset * 3 + 2] = z;

      pointPositions[i3] = x;
      pointPositions[i3 + 1] = y;
      pointPositions[i3 + 2] = z;

      const speed = Math.abs(Math.sin(mode.f1 * t + phase)) + Math.abs(Math.cos(mode.f2 * t + phase * 0.5));
      const hue = (speed * 0.3 + i * 0.005) % 1;
      const color = new THREE.Color().setHSL(hue, 0.9, 0.6);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    if (linesRef.current) {
      const attr = linesRef.current.geometry.attributes.position;
      attr.array.set(trailPositions);
      attr.needsUpdate = true;
      linesRef.current.geometry.setDrawRange(0, PARTICLE_COUNT * TRAIL_LENGTH * 2);
    }

    if (pointsRef.current) {
      const attr = pointsRef.current.geometry.attributes.position;
      attr.array.set(pointPositions);
      attr.needsUpdate = true;
      const colAttr = pointsRef.current.geometry.attributes.color;
      colAttr.array.set(colors);
      colAttr.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef} position={[0, 8, 0]}>
      <points ref={pointsRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[pointPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.1}
          vertexColors
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </group>
  );
}
