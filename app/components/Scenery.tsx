"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

const ARCH_COUNT = 40;
const ARCH_SPACING = 50;
const ARCH_START_Z = 0;
const ARCH_TOTAL_DEPTH = ARCH_COUNT * ARCH_SPACING;

const dummy = new THREE.Object3D();
const ARCH_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#181825",
  roughness: 0.85,
  metalness: 0.15,
  envMapIntensity: 0.3,
});

const BEAM_WIDTH = 100;
const BEAM_HEIGHT = 3;
const BEAM_DEPTH = 8;
const PILLAR_WIDTH = 4;
const PILLAR_HEIGHT = 60;
const PILLAR_DEPTH = 6;

interface ArchData {
  z: number;
  side: number;
}

const ARCHES: ArchData[] = Array.from({ length: ARCH_COUNT }, (_, i) => ({
  z: -ARCH_START_Z - i * ARCH_SPACING,
  side: i % 2 === 0 ? 1 : -1,
}));

export default function Scenery() {
  const groupRef = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.InstancedMesh>(null);
  const pillarRef = useRef<THREE.InstancedMesh>(null);
  const lastChunkRef = useRef<number | null>(null);

  const beamGeometry = useMemo(
    () => new THREE.BoxGeometry(BEAM_WIDTH, BEAM_HEIGHT, BEAM_DEPTH),
    [],
  );
  const pillarGeometry = useMemo(
    () => new THREE.BoxGeometry(PILLAR_WIDTH, 1, PILLAR_DEPTH),
    [],
  );

  useEffect(() => {
    return () => {
      beamGeometry.dispose();
      pillarGeometry.dispose();
    };
  }, [beamGeometry, pillarGeometry]);

  useLayoutEffect(() => {
    const beam = beamRef.current;
    const pillar = pillarRef.current;
    if (!beam || !pillar) return;

    for (let i = 0; i < ARCH_COUNT; i++) {
      const arch = ARCHES[i];

      dummy.position.set(0, PILLAR_HEIGHT + BEAM_HEIGHT / 2, arch.z);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      beam.setMatrixAt(i, dummy.matrix);

      const pillarX = (BEAM_WIDTH / 2 - PILLAR_WIDTH / 2) * arch.side;
      dummy.position.set(pillarX, PILLAR_HEIGHT / 2, arch.z);
      dummy.scale.set(1, PILLAR_HEIGHT, 1);
      dummy.updateMatrix();
      pillar.setMatrixAt(i * 2, dummy.matrix);

      dummy.position.set(-pillarX, PILLAR_HEIGHT / 2, arch.z);
      dummy.scale.set(1, PILLAR_HEIGHT, 1);
      dummy.updateMatrix();
      pillar.setMatrixAt(i * 2 + 1, dummy.matrix);
    }

    beam.instanceMatrix.needsUpdate = true;
    pillar.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame((state) => {
    const group = groupRef.current;
    const cameraZ = state.camera.position.z;
    const chunk = Math.round(cameraZ / ARCH_TOTAL_DEPTH);

    if (group && lastChunkRef.current !== chunk) {
      lastChunkRef.current = chunk;
      group.position.z = chunk * ARCH_TOTAL_DEPTH;
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh
        ref={beamRef}
        args={[beamGeometry, ARCH_MATERIAL, ARCH_COUNT]}
        frustumCulled={false}
        receiveShadow
      />
      <instancedMesh
        ref={pillarRef}
        args={[pillarGeometry, ARCH_MATERIAL, ARCH_COUNT * 2]}
        frustumCulled={false}
        receiveShadow
      />
    </group>
  );
}
