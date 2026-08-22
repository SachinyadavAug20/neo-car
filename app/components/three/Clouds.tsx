"use client";

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

const CLOUD_COUNT = 60;

export default function Clouds() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const clouds = useMemo(() => {
    return Array.from({ length: CLOUD_COUNT }, () => ({
      x: (Math.random() - 0.5) * 150,
      y: Math.random() * 15 + 5,
      z: (Math.random() - 0.5) * 150 - 30,
      scaleX: 2 + Math.random() * 4,
      scaleY: 0.5 + Math.random() * 1,
      scaleZ: 1.5 + Math.random() * 3,
      speed: 0.02 + Math.random() * 0.04,
    }));
  }, []);

  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#1e1b4b",
        transparent: true,
        opacity: 0.15,
        roughness: 1,
        metalness: 0,
      }),
    [],
  );

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    clouds.forEach((c, i) => {
      dummy.position.set(
        c.x + Math.sin(t * c.speed + i) * 2,
        c.y + Math.sin(t * 0.1 + i * 0.5) * 0.5,
        c.z,
      );
      dummy.scale.set(c.scaleX, c.scaleY, c.scaleZ);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, mat, CLOUD_COUNT]} frustumCulled={false}>
      <sphereGeometry args={[1, 8, 6]} />
    </instancedMesh>
  );
}
