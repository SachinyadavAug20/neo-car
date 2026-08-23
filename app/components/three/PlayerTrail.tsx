"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "@/app/lib/store";
import { useNarrative } from "@/app/lib/narrativeStore";
import { CHAPTERS } from "@/app/lib/narrative";

const TRAIL_LENGTH = 40;

export default function PlayerTrail() {
  const { started, playing, currentChapter } = useNarrative();
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const positions = useRef<Float32Array>(new Float32Array(TRAIL_LENGTH * 3));
  const idx = useRef(0);

  const chapter = CHAPTERS[currentChapter];
  const color = chapter ? new THREE.Color(chapter.color) : new THREE.Color("#67e8f9");

  useFrame((state) => {
    if (!meshRef.current || !started || !playing) return;

    const t = state.clock.elapsedTime;
    const x = Math.sin(t * 0.2) * 5;
    const z = -t * 2;
    const y = 2 + Math.sin(t * 0.5) * 0.5;

    const i3 = (idx.current % TRAIL_LENGTH) * 3;
    positions.current[i3] = x;
    positions.current[i3 + 1] = y - 0.5;
    positions.current[i3 + 2] = z;
    idx.current++;

    const dummy = new THREE.Object3D();
    const col = new THREE.Color();

    for (let i = 0; i < TRAIL_LENGTH; i++) {
      const pi = ((idx.current - i + TRAIL_LENGTH * 10) % TRAIL_LENGTH) * 3;
      dummy.position.set(
        positions.current[pi],
        positions.current[pi + 1] - i * 0.03,
        positions.current[pi + 2],
      );
      const scale = (1 - i / TRAIL_LENGTH) * 0.06;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      col.copy(color).multiplyScalar(0.3 + (1 - i / TRAIL_LENGTH) * 0.7);
      meshRef.current.setColorAt(i, col);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  if (!started || !playing) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, TRAIL_LENGTH]} frustumCulled={false}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial transparent opacity={0.4} />
    </instancedMesh>
  );
}
