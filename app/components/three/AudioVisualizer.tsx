"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "@/app/lib/store";
import { useNarrative } from "@/app/lib/narrativeStore";
import { CHAPTERS } from "@/app/lib/narrative";

const RING_COUNT = 60;
const PARTICLES_PER_RING = 24;

export default function AudioVisualizer() {
  const { audioEnabled } = useStore();
  const { started, playing, currentChapter } = useNarrative();
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArray = useRef(new Uint8Array(64));

  const chapter = CHAPTERS[currentChapter];
  const color = chapter ? new THREE.Color(chapter.color) : new THREE.Color("#4ecdc4");

  useFrame((state, delta) => {
    if (!meshRef.current || !started || !audioEnabled) return;

    timeRef.current += delta;
    const t = timeRef.current;

    let bass = 0.5;
    let mid = 0.5;
    let treble = 0.5;

    if (analyserRef.current) {
      analyserRef.current.getByteFrequencyData(dataArray.current);
      bass = dataArray.current.slice(0, 8).reduce((a, b) => a + b, 0) / (8 * 255);
      mid = dataArray.current.slice(8, 32).reduce((a, b) => a + b, 0) / (24 * 255);
      treble = dataArray.current.slice(32, 64).reduce((a, b) => a + b, 0) / (32 * 255);
    } else {
      bass = 0.3 + Math.sin(t * 2) * 0.2;
      mid = 0.3 + Math.sin(t * 3) * 0.2;
      treble = 0.3 + Math.sin(t * 5) * 0.2;
    }

    const dummy = new THREE.Object3D();
    const col = new THREE.Color();
    let idx = 0;

    for (let ring = 0; ring < RING_COUNT; ring++) {
      const ringProgress = ring / RING_COUNT;
      const ringRadius = 3 + ringProgress * 8;
      const ringHeight = Math.sin(ringProgress * Math.PI) * 3;

      for (let p = 0; p < PARTICLES_PER_RING; p++) {
        const angle = (p / PARTICLES_PER_RING) * Math.PI * 2 + t * 0.2;
        const audioOffset = bass * Math.sin(angle * 3 + t) * 0.5;

        const x = Math.cos(angle) * (ringRadius + audioOffset);
        const y = ringHeight + Math.sin(t + ring * 0.3) * mid * 2;
        const z = Math.sin(angle) * (ringRadius + audioOffset);

        dummy.position.set(x, y, z);
        const scale = 0.05 + treble * 0.1 + Math.sin(t * 3 + idx) * 0.02;
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(idx, dummy.matrix);

        const hue = (ringProgress + t * 0.05) % 1;
        col.setHSL(hue, 0.7, 0.5 + bass * 0.3);
        meshRef.current.setColorAt(idx, col);
        idx++;
      }
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;

    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.05;
    }
  });

  if (!started || !audioEnabled) return null;

  return (
    <group ref={groupRef} position={[0, 2, -20]}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, RING_COUNT * PARTICLES_PER_RING]} frustumCulled={false}>
        <sphereGeometry args={[1, 4, 4]} />
        <meshBasicMaterial transparent opacity={0.5} />
      </instancedMesh>
    </group>
  );
}
