"use client";

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";

const BUTTERFLY_COUNT = 20;

interface ButterflyState {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  target: THREE.Vector3;
  phase: number;
}

export default function Butterflies() {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { camera } = useThree();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  const butterflies = useMemo<ButterflyState[]>(() => {
    return Array.from({ length: BUTTERFLY_COUNT }, () => ({
      pos: new THREE.Vector3(
        (Math.random() - 0.5) * 40,
        3 + Math.random() * 10,
        (Math.random() - 0.5) * 40 - 20,
      ),
      vel: new THREE.Vector3(),
      target: new THREE.Vector3(),
      phase: Math.random() * Math.PI * 2,
    }));
  }, []);

  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#f9a8d4",
        emissive: "#f472b6",
        emissiveIntensity: 0.5,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      }),
    [],
  );

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    const camPos = camera.position;

    butterflies.forEach((b, i) => {
      if (Math.random() < 0.01) {
        b.target.set(
          b.pos.x + (Math.random() - 0.5) * 15,
          3 + Math.random() * 12,
          b.pos.z + (Math.random() - 0.5) * 15,
        );
      }

      b.vel.lerp(b.target.clone().sub(b.pos).normalize().multiplyScalar(0.03), 0.02);
      b.pos.add(b.vel);

      const distToCamera = b.pos.distanceTo(camPos);
      if (distToCamera < 5) {
        const away = b.pos.clone().sub(camPos).normalize().multiplyScalar(0.1);
        b.pos.add(away);
      }

      const wingFlap = Math.sin(t * 8 + b.phase) * 0.5;

      dummy.position.copy(b.pos);
      dummy.rotation.y = Math.atan2(b.vel.x, b.vel.z);
      dummy.rotation.z = wingFlap;
      dummy.scale.setScalar(0.3 + Math.sin(t + b.phase) * 0.05);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);

      const hue = (i / BUTTERFLY_COUNT) * 0.15 + 0.85;
      tmpColor.setHSL(hue % 1, 0.7, 0.75);
      meshRef.current!.setColorAt(i, tmpColor);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor)
      meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, mat, BUTTERFLY_COUNT]} frustumCulled={false}>
      <planeGeometry args={[1, 0.6]} />
    </instancedMesh>
  );
}
