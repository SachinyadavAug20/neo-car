"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 300;

export default function DustMotes() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { camera } = useThree();
  const dummy = useRef(new THREE.Object3D()).current;

  const motes = useMemo(() => {
    return Array.from({ length: COUNT }, () => ({
      x: (Math.random() - 0.5) * 60,
      y: Math.random() * 30,
      z: (Math.random() - 0.5) * 60,
      size: 0.01 + Math.random() * 0.02,
      speed: 0.1 + Math.random() * 0.3,
      drift: Math.random() * 0.5,
      offset: Math.random() * Math.PI * 2,
    }));
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    motes.forEach((m, i) => {
      let mx = m.x + Math.sin(state.clock.elapsedTime * m.speed + m.offset) * m.drift;
      let my = m.y + Math.sin(state.clock.elapsedTime * m.speed * 0.5) * 0.5;
      let mz = m.z + Math.cos(state.clock.elapsedTime * m.speed * 0.3 + m.offset) * m.drift;

      dummy.position.set(mx, my, mz);
      const pulse = 0.5 + Math.sin(state.clock.elapsedTime * 2 + i * 0.5) * 0.5;
      dummy.scale.setScalar(m.size * (0.5 + pulse * 0.5));
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <sphereGeometry args={[1, 3, 3]} />
      <meshBasicMaterial color="#f5f0e0" transparent opacity={0.3} />
    </instancedMesh>
  );
}
