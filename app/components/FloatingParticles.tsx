"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useAudioAnalyzer } from "../hooks/useAudioAnalyzer";

const PARTICLE_COUNT = 150;

const seededRandom = (n: number): number => {
  const x = Math.sin(n) * 10000;
  return x - Math.floor(x);
};

const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  x: seededRandom(i * 3.7) * 60 - 30,
  z: seededRandom(i * 1.3) * 500 - 250,
  speed: 0.3 + seededRandom(i * 2.1) * 0.8,
  scale: 0.4 + seededRandom(i * 5.3) * 1.4,
  y: 0,
}));

const dummy = new THREE.Object3D();

export default function FloatingParticles() {
  const groupRef = useRef<THREE.Group>(null);
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const { getFrequencies } = useAudioAnalyzer();

  const geometry = useMemo(() => new THREE.OctahedronGeometry(1, 0), []);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#b4befe",
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
      }),
    [],
  );

  useLayoutEffect(() => {
    const mesh = instancedMeshRef.current;
    if (!mesh) return;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      dummy.position.set(0, 0, 0);
      dummy.scale.setScalar(0);
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

  useFrame((state) => {
    const mesh = instancedMeshRef.current;
    const group = groupRef.current;
    if (!mesh || !group) return;

    const [bass, mids, highs] = getFrequencies();
    const elapsed = state.clock.elapsedTime;

    group.position.z = state.camera.position.z + 30;
    group.position.x = 0;

    const sizeBoost = 1 + bass * 0.3;
    const colorBoost = 0.5 + mids * 0.35;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = PARTICLES[i];
      p.y = ((p.speed * elapsed + i * 0.37) % 9) - 1;

      dummy.position.set(p.x, p.y, p.z + ((p.speed * elapsed) % 8));
      dummy.rotation.x = elapsed * (0.15 + highs * 0.25) + i;
      dummy.rotation.y = elapsed * (0.1 + highs * 0.15) + i * 2;

      dummy.scale.setScalar(p.scale * sizeBoost);

      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;

    material.color.setRGB(
      0.7 + colorBoost * 0.3,
      0.74 + colorBoost * 0.26,
      1.0,
    );
  });

  return (
    <group ref={groupRef}>
      <instancedMesh
        ref={instancedMeshRef}
        args={[geometry, material, PARTICLE_COUNT]}
        frustumCulled={false}
      />
    </group>
  );
}