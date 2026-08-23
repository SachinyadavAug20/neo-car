"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useNarrative } from "@/app/lib/narrativeStore";

const STREAK_COUNT = 40;

export default function WindStreaks() {
  const { started, mood } = useNarrative();
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const streaks = useMemo(() => {
    return Array.from({ length: STREAK_COUNT }, () => ({
      x: (Math.random() - 0.5) * 50,
      y: 5 + Math.random() * 25,
      z: (Math.random() - 0.5) * 50,
      length: 1 + Math.random() * 3,
      speed: 5 + Math.random() * 10,
      offset: Math.random() * Math.PI * 2,
      angle: (Math.random() - 0.5) * 0.5,
    }));
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    const windSpeed = mood === "courage" ? 2 : mood === "wonder" ? 0.5 : 1;

    streaks.forEach((s, i) => {
      const t = (state.clock.elapsedTime * s.speed * windSpeed + s.offset) % 60 - 30;
      const fx = s.x + t;
      const fy = s.y + Math.sin(state.clock.elapsedTime * 0.5 + s.offset) * 2;
      const fz = s.z;

      dummy.position.set(fx, fy, fz);
      dummy.rotation.set(0, s.angle, 0);
      dummy.scale.set(0.02, 0.005, s.length);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!started) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, STREAK_COUNT]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.08} />
    </instancedMesh>
  );
}
