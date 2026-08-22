"use client";

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

const FIREFLY_COUNT = 200;
const SPORE_COUNT = 150;

export default function Particles() {
  const fireflyRef = useRef<THREE.Points>(null);
  const sporeRef = useRef<THREE.Points>(null);

  const fireflyGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(FIREFLY_COUNT * 3);
    const sizes = new Float32Array(FIREFLY_COUNT);
    for (let i = 0; i < FIREFLY_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = Math.random() * 30 - 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80 - 20;
      sizes[i] = 0.1 + Math.random() * 0.15;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    return g;
  }, []);

  const sporeGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(SPORE_COUNT * 3);
    const sizes = new Float32Array(SPORE_COUNT);
    for (let i = 0; i < SPORE_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 1] = Math.random() * 20 - 5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 60 - 20;
      sizes[i] = 0.05 + Math.random() * 0.1;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    return g;
  }, []);

  const fireflyMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.2,
        color: "#fde68a",
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    [],
  );

  const sporeMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.12,
        color: "#c4b5fd",
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    [],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (fireflyRef.current) {
      const pos = fireflyRef.current.geometry.attributes.position;
      for (let i = 0; i < FIREFLY_COUNT; i++) {
        const y = pos.getY(i);
        pos.setY(i, y + Math.sin(t * 0.5 + i * 0.3) * 0.003);
        const x = pos.getX(i);
        pos.setX(i, x + Math.sin(t * 0.2 + i * 0.7) * 0.002);
      }
      pos.needsUpdate = true;
      fireflyMat.opacity = 0.5 + Math.sin(t * 0.8) * 0.3;
    }

    if (sporeRef.current) {
      const pos = sporeRef.current.geometry.attributes.position;
      for (let i = 0; i < SPORE_COUNT; i++) {
        const y = pos.getY(i);
        pos.setY(i, y + 0.005);
        if (pos.getY(i) > 25) pos.setY(i, -10);
      }
      pos.needsUpdate = true;
    }
  });

  return (
    <>
      <points ref={fireflyRef} geometry={fireflyGeo} material={fireflyMat} />
      <points ref={sporeRef} geometry={sporeGeo} material={sporeMat} />
    </>
  );
}
