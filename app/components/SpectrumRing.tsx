"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { easing } from "maath";
import { useAudioAnalyzer } from "../hooks/useAudioAnalyzer";

const BAR_COUNT = 64;
const RING_RADIUS = 22;
const RING_HEIGHT = 20;
const DAMP_TIME = 0.15;

const dummy = new THREE.Object3D();

export default function SpectrumRing() {
  const groupRef = useRef<THREE.Group>(null);
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const { getSpectrum } = useAudioAnalyzer();

  const dampers = useMemo(
    () => Array.from({ length: BAR_COUNT }, () => ({ y: 1 })),
    [],
  );

  const geometry = useMemo(() => new THREE.BoxGeometry(0.5, 1, 0.5), []);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#f5c2e7",
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
      }),
    [],
  );

  useLayoutEffect(() => {
    const mesh = instancedMeshRef.current;
    if (!mesh) return;
    for (let i = 0; i < BAR_COUNT; i++) {
      dummy.position.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((state, delta) => {
    const mesh = instancedMeshRef.current;
    const group = groupRef.current;
    if (!mesh || !group) return;

    const spectrum = getSpectrum();
    const elapsed = state.clock.elapsedTime;
    const cameraZ = state.camera.position.z;

    group.position.set(0, RING_HEIGHT, cameraZ + 30);
    group.rotation.y = elapsed * 0.1;

    for (let i = 0; i < BAR_COUNT; i++) {
      const binIndex = Math.floor((i / BAR_COUNT) * 128);
      const value = spectrum[binIndex] / 255;

      const angle = (i / BAR_COUNT) * Math.PI * 2;
      dummy.position.set(
        Math.cos(angle) * RING_RADIUS,
        0,
        Math.sin(angle) * RING_RADIUS,
      );
      dummy.rotation.y = -angle;
      easing.damp(dampers[i], "y", 1 + value * 8, DAMP_TIME, delta);
      const height = dampers[i].y;
      dummy.scale.set(1, height, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      <instancedMesh
        ref={instancedMeshRef}
        args={[geometry, material, BAR_COUNT]}
        frustumCulled={false}
      />
    </group>
  );
}