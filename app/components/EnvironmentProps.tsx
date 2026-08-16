"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

const PILLAR_COUNT = 120;
const PILLAR_X_MIN = 65;
const PILLAR_X_MAX = 180;
const PILLAR_Z_MIN = -100;
const PILLAR_Z_MAX = 2600;
const PILLAR_HEIGHT_MIN = 30;
const PILLAR_HEIGHT_MAX = 120;
const PILLAR_WIDTH = 3;
const PILLAR_DEPTH = 3;

interface PillarData {
  position: [number, number, number];
  height: number;
  color: string;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const PILLARS: PillarData[] = Array.from({ length: PILLAR_COUNT }, (_, i) => {
  const side = i % 2 === 0 ? 1 : -1;
  const x =
    side *
    (PILLAR_X_MIN + seededRandom(i * 3) * (PILLAR_X_MAX - PILLAR_X_MIN));
  const z =
    PILLAR_Z_MIN + seededRandom(i * 7 + 1) * (PILLAR_Z_MAX - PILLAR_Z_MIN);
  const height =
    PILLAR_HEIGHT_MIN +
    seededRandom(i * 11 + 2) * (PILLAR_HEIGHT_MAX - PILLAR_HEIGHT_MIN);
  const color = seededRandom(i * 13 + 3) > 0.5 ? "#cba6f7" : "#8aadf4";
  return { position: [x, height / 2, z], height, color };
});

const PURPLE_PILLARS = PILLARS.filter((p) => p.color === "#cba6f7");
const BLUE_PILLARS = PILLARS.filter((p) => p.color === "#8aadf4");

const PURPLE_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#1e1a2e",
  emissive: "#cba6f7",
  emissiveIntensity: 0.15,
  transparent: true,
  opacity: 0.7,
});

const BLUE_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#1a1e2e",
  emissive: "#8aadf4",
  emissiveIntensity: 0.15,
  transparent: true,
  opacity: 0.7,
});

export default function EnvironmentProps() {
  const purpleRef = useRef<THREE.InstancedMesh>(null);
  const blueRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const purpleGeometry = useMemo(
    () => new THREE.BoxGeometry(PILLAR_WIDTH, 1, PILLAR_DEPTH),
    [],
  );
  const blueGeometry = useMemo(
    () => new THREE.BoxGeometry(PILLAR_WIDTH, 1, PILLAR_DEPTH),
    [],
  );

  useLayoutEffect(() => {
    const purple = purpleRef.current;
    if (purple) {
      for (let i = 0; i < PURPLE_PILLARS.length; i++) {
        const pillar = PURPLE_PILLARS[i];
        dummy.position.set(
          pillar.position[0],
          pillar.position[1],
          pillar.position[2],
        );
        dummy.scale.set(1, pillar.height, 1);
        dummy.updateMatrix();
        purple.setMatrixAt(i, dummy.matrix);
      }
      purple.instanceMatrix.needsUpdate = true;
    }
    const blue = blueRef.current;
    if (blue) {
      for (let i = 0; i < BLUE_PILLARS.length; i++) {
        const pillar = BLUE_PILLARS[i];
        dummy.position.set(
          pillar.position[0],
          pillar.position[1],
          pillar.position[2],
        );
        dummy.scale.set(1, pillar.height, 1);
        dummy.updateMatrix();
        blue.setMatrixAt(i, dummy.matrix);
      }
      blue.instanceMatrix.needsUpdate = true;
    }
  }, [dummy]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pulse = 0.12 + Math.sin(t * 0.3) * 0.05;
    PURPLE_MATERIAL.emissiveIntensity = pulse;
    BLUE_MATERIAL.emissiveIntensity = pulse;
  });

  return (
    <group>
      <instancedMesh
        ref={purpleRef}
        args={[purpleGeometry, PURPLE_MATERIAL, PURPLE_PILLARS.length]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={blueRef}
        args={[blueGeometry, BLUE_MATERIAL, BLUE_PILLARS.length]}
        frustumCulled={false}
      />
    </group>
  );
}