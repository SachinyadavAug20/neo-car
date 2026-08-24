"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useNarrative } from "@/app/lib/narrativeStore";
import { CHAPTERS } from "@/app/lib/narrative";

export default function DynamicAtmosphere() {
  const { started, playing, currentChapter } = useNarrative();
  const fogRef = useRef<THREE.Fog>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const targetColor = useRef(new THREE.Color("#0a0e27"));
  const targetFogColor = useRef(new THREE.Color("#0a0e27"));
  const color = useRef(new THREE.Color());
  const fogColor = useRef(new THREE.Color());

  useFrame((state, delta) => {
    if (!started || !playing) return;

    const chapter = CHAPTERS[currentChapter];
    if (!chapter) return;

    color.current.set(chapter.color);
    fogColor.current.set(chapter.color).multiplyScalar(0.15);

    targetColor.current.lerp(color.current, delta * 0.3);
    targetFogColor.current.lerp(fogColor.current, delta * 0.3);

    if (fogRef.current) {
      fogRef.current.color.lerp(targetFogColor.current, delta * 2);
      const targetDensity = chapter.fogDensity;
      fogRef.current.near = THREE.MathUtils.lerp(fogRef.current.near, 30, delta);
      fogRef.current.far = THREE.MathUtils.lerp(fogRef.current.far, 1 / targetDensity, delta);
    }

    if (ambientRef.current) {
      ambientRef.current.color.lerp(targetColor.current, delta * 2);
      ambientRef.current.intensity = THREE.MathUtils.lerp(
        ambientRef.current.intensity,
        0.3 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05,
        delta * 2,
      );
    }
  });

  return (
    <>
      <fog ref={fogRef} attach="fog" args={["#0a0e27", 30, 80]} />
      <ambientLight ref={ambientRef} color="#0a0e27" intensity={0.3} />
    </>
  );
}
