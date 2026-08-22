"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useAppStore } from "../lib/appStore";

const PILLAR_COUNT = 80;
const PILLAR_SPACING = 40;
const PILLAR_TOTAL_DEPTH = PILLAR_COUNT * PILLAR_SPACING;

const dummy = new THREE.Object3D();
const pillarMaterial = new THREE.MeshStandardMaterial({
  color: "#181825",
  roughness: 0.85,
  metalness: 0.15,
  envMapIntensity: 0.3,
});

const PILLAR_WIDTH = 6;
const PILLAR_DEPTH = 8;
const PILLAR_BASE_HEIGHT = 80;
const PILLAR_X_MIN = 55;
const PILLAR_X_MAX = 120;

interface PillarData {
  z: number;
  side: number;
  xOffset: number;
  baseHeight: number;
}

const PILLARS: PillarData[] = Array.from({ length: PILLAR_COUNT }, (_, i) => ({
  z: -i * PILLAR_SPACING,
  side: i % 2 === 0 ? 1 : -1,
  xOffset: PILLAR_X_MIN + Math.random() * (PILLAR_X_MAX - PILLAR_X_MIN),
  baseHeight: PILLAR_BASE_HEIGHT * (0.7 + Math.random() * 0.6),
}));

const tmpColor = new THREE.Color();
const BAND_COUNT = 8;
const FREQUENCY_BINS_PER_BAND = Math.floor(128 / BAND_COUNT);

export default function Scenery() {
  const groupRef = useRef<THREE.Group>(null);
  const pillarRef = useRef<THREE.InstancedMesh>(null);
  const lastChunkRef = useRef<number | null>(null);

  const geometry = useMemo(
    () => new THREE.BoxGeometry(PILLAR_WIDTH, 1, PILLAR_DEPTH),
    [],
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useLayoutEffect(() => {
    const mesh = pillarRef.current;
    if (!mesh) return;

    for (let i = 0; i < PILLAR_COUNT; i++) {
      const p = PILLARS[i];
      const x = p.xOffset * p.side;

      dummy.position.set(x, p.baseHeight / 2, p.z);
      dummy.scale.set(1, p.baseHeight, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame((state) => {
    const group = groupRef.current;
    const mesh = pillarRef.current;
    const cameraZ = state.camera.position.z;
    const chunk = Math.round(cameraZ / PILLAR_TOTAL_DEPTH);

    if (group && lastChunkRef.current !== chunk) {
      lastChunkRef.current = chunk;
      group.position.z = chunk * PILLAR_TOTAL_DEPTH;
    }

    if (!mesh) return;

    const { bass, mids, highs } = useAppStore.getState().audioData;
    const audioData = useAppStore.getState().audioData;

    for (let i = 0; i < PILLAR_COUNT; i++) {
      const p = PILLARS[i];
      const x = p.xOffset * p.side;

      const bandIndex = i % BAND_COUNT;
      const binStart = bandIndex * FREQUENCY_BINS_PER_BAND;
      const binEnd = Math.min(binStart + FREQUENCY_BINS_PER_BAND, 128);
      const audioArr = Object.values(audioData);
      let bandEnergy = 0;
      for (let b = binStart; b < binEnd; b++) {
        bandEnergy += audioArr[b % audioArr.length] || 0;
      }
      bandEnergy /= binEnd - binStart;

      const yScale = p.baseHeight * (0.7 + bandEnergy * 2.5);

      dummy.position.set(x, yScale / 2, p.z);
      dummy.scale.set(1, yScale, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      <instancedMesh
        ref={pillarRef}
        args={[geometry, pillarMaterial, PILLAR_COUNT]}
        frustumCulled={false}
        receiveShadow
      />
    </group>
  );
}
