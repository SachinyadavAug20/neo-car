"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useNarrative } from "@/app/lib/narrativeStore";
import { CHAPTERS } from "@/app/lib/narrative";

const EMBER_COUNT = 150;
const PETAL_COUNT = 100;

export default function EmberParticles() {
  const { started, currentChapter } = useNarrative();
  const emberRef = useRef<THREE.Points>(null);
  const petalRef = useRef<THREE.Points>(null);

  const chapter = CHAPTERS[currentChapter];
  const color = chapter ? new THREE.Color(chapter.color) : new THREE.Color("#fbbf24");

  const emberGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(EMBER_COUNT * 3);
    for (let i = 0; i < EMBER_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = Math.random() * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40 - 15;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return geo;
  }, []);

  const petalGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(PETAL_COUNT * 3);
    for (let i = 0; i < PETAL_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = Math.random() * 25;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 50 - 10;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return geo;
  }, []);

  useFrame((state) => {
    if (!started) return;
    const t = state.clock.elapsedTime;

    if (emberRef.current) {
      const pos = emberRef.current.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < EMBER_COUNT; i++) {
        const i3 = i * 3;
        pos.array[i3 + 1] += 0.02 + Math.sin(t + i) * 0.005;
        pos.array[i3] += Math.sin(t * 0.5 + i * 0.3) * 0.01;
        if (pos.array[i3 + 1] > 25) {
          pos.array[i3 + 1] = -2;
          pos.array[i3] = (Math.random() - 0.5) * 40;
        }
      }
      pos.needsUpdate = true;
    }

    if (petalRef.current) {
      const pos = petalRef.current.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < PETAL_COUNT; i++) {
        const i3 = i * 3;
        pos.array[i3 + 1] -= 0.008;
        pos.array[i3] += Math.sin(t * 0.3 + i * 0.5) * 0.015;
        pos.array[i3 + 2] += Math.cos(t * 0.2 + i * 0.3) * 0.01;
        if (pos.array[i3 + 1] < -3) {
          pos.array[i3 + 1] = 25;
          pos.array[i3] = (Math.random() - 0.5) * 50;
        }
      }
      pos.needsUpdate = true;
    }
  });

  if (!started) return null;

  return (
    <>
      <points ref={emberRef} geometry={emberGeo}>
        <pointsMaterial color="#ff6b35" size={0.08} transparent opacity={0.6} blending={THREE.AdditiveBlending} />
      </points>
      <points ref={petalRef} geometry={petalGeo}>
        <pointsMaterial color={color} size={0.12} transparent opacity={0.4} blending={THREE.AdditiveBlending} />
      </points>
    </>
  );
}
