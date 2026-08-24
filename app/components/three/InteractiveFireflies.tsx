"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useNarrative } from "@/app/lib/narrativeStore";

const COUNT = 60;

export default function InteractiveFireflies() {
  const { started } = useNarrative();
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { pointer } = useThree();
  const dummy = useRef(new THREE.Object3D()).current;

  const fireflies = useMemo(() => {
    return Array.from({ length: COUNT }, () => ({
      x: (Math.random() - 0.5) * 50,
      y: 5 + Math.random() * 25,
      z: (Math.random() - 0.5) * 50,
      speed: 0.2 + Math.random() * 0.6,
      offset: Math.random() * Math.PI * 2,
      brightness: 0.5 + Math.random() * 0.5,
    }));
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const mx = pointer.x * 25;
    const my = 15 + pointer.y * 15;

    fireflies.forEach((f, i) => {
      let fx = f.x + Math.sin(state.clock.elapsedTime * f.speed + f.offset) * 2;
      let fy = f.y + Math.cos(state.clock.elapsedTime * f.speed * 0.7) * 1.5;
      let fz = f.z + Math.sin(state.clock.elapsedTime * f.speed * 0.5 + f.offset) * 2;

      const dx = mx - fx;
      const dy = my - fy;
      const dz = 20 - fz;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < 15) {
        const pull = (15 - dist) / 15;
        fx += dx * pull * 0.15;
        fy += dy * pull * 0.15;
        fz += dz * pull * 0.05;
      }

      dummy.position.set(fx, fy, fz);
      const pulse = (0.6 + Math.sin(state.clock.elapsedTime * 3 + i) * 0.4) * f.brightness;
      dummy.scale.setScalar(0.08 + pulse * 0.04);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!started) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#fbbf24" transparent opacity={0.9} />
    </instancedMesh>
  );
}
