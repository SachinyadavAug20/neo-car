"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const STAR_COUNT = 500;

export default function SpiralGalaxy() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useRef(new THREE.Object3D()).current;

  const stars = useMemo(() => {
    return Array.from({ length: STAR_COUNT }, (_, i) => {
      const angle = (i / STAR_COUNT) * Math.PI * 6;
      const radius = (i / STAR_COUNT) * 25;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = (Math.random() - 0.5) * 2 * (1 - i / STAR_COUNT);
      return { x, y, z, size: 0.02 + Math.random() * 0.04, hue: Math.random() };
    });
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.02;

    stars.forEach((s, i) => {
      dummy.position.set(s.x, s.y, s.z);
      const pulse = 0.7 + Math.sin(state.clock.elapsedTime + i * 0.1) * 0.3;
      dummy.scale.setScalar(s.size * pulse);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, STAR_COUNT]} position={[0, 40, -50]} frustumCulled={false}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color="#c4b5fd" transparent opacity={0.6} />
    </instancedMesh>
  );
}
