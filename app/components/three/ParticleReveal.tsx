"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useNarrative } from "@/app/lib/narrativeStore";
import { CHAPTERS } from "@/app/lib/narrative";

const PARTICLE_COUNT = 300;

export default function ParticleReveal() {
  const { started, playing, currentChapter, storyTextVisible } = useNarrative();
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  const { positions, velocities, colors, sizes } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const vel = new Float32Array(PARTICLE_COUNT * 3);
    const col = new Float32Array(PARTICLE_COUNT * 3);
    const sz = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * 60;
      pos[i3 + 1] = Math.random() * 30 + 5;
      pos[i3 + 2] = (Math.random() - 0.5) * 60;
      vel[i3] = (Math.random() - 0.5) * 0.02;
      vel[i3 + 1] = (Math.random() - 0.5) * 0.01;
      vel[i3 + 2] = (Math.random() - 0.5) * 0.02;
      col[i3] = 1;
      col[i3 + 1] = 1;
      col[i3 + 2] = 1;
      sz[i] = Math.random() * 0.15 + 0.05;
    }
    return { positions: pos, velocities: vel, colors: col, sizes: sz };
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current || !started) return;

    const chapter = CHAPTERS[currentChapter];
    if (!chapter) return;

    const color = new THREE.Color(chapter.color);
    timeRef.current += delta;

    const dummy = new THREE.Object3D();
    const col = new THREE.Color();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      if (storyTextVisible) {
        positions[i3] += velocities[i3] * 2;
        positions[i3 + 1] += velocities[i3 + 1] * 2 + Math.sin(timeRef.current + i) * 0.01;
        positions[i3 + 2] += velocities[i3 + 2] * 2;
      } else {
        positions[i3] += velocities[i3] * 0.3;
        positions[i3 + 1] += Math.sin(timeRef.current * 0.5 + i * 0.1) * 0.005;
        positions[i3 + 2] += velocities[i3 + 2] * 0.3;
      }

      const dist = Math.sqrt(
        positions[i3] ** 2 + positions[i3 + 1] ** 2 + positions[i3 + 2] ** 2
      );
      if (dist > 40) {
        positions[i3] = (Math.random() - 0.5) * 20;
        positions[i3 + 1] = Math.random() * 20 + 5;
        positions[i3 + 2] = (Math.random() - 0.5) * 20;
      }

      dummy.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
      const scale = storyTextVisible ? sizes[i] * (1 + Math.sin(timeRef.current * 3 + i) * 0.3) : sizes[i] * 0.5;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      col.copy(color).multiplyScalar(0.5 + Math.sin(timeRef.current + i * 0.5) * 0.5);
      meshRef.current.setColorAt(i, col);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  if (!started) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial transparent opacity={0.6} />
    </instancedMesh>
  );
}
