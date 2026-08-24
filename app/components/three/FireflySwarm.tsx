"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const SWARM_COUNT = 100;

export default function FireflySwarm() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const trailRef = useRef<THREE.InstancedMesh>(null);
  const { pointer } = useThree();
  const dummy = useRef(new THREE.Object3D()).current;

  const fireflies = useMemo(() => {
    return Array.from({ length: SWARM_COUNT }, () => ({
      x: (Math.random() - 0.5) * 20,
      y: 5 + Math.random() * 15,
      z: (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.3,
      vz: (Math.random() - 0.5) * 0.5,
      brightness: 0.5 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
    }));
  }, []);

  const trails = useMemo(() => {
    return Array.from({ length: SWARM_COUNT * 3 }, () => ({
      x: 0, y: 0, z: 0, alpha: 0,
    }));
  }, []);

  useFrame((state) => {
    if (!meshRef.current || !trailRef.current) return;
    const mx = pointer.x * 15;
    const my = 10 + pointer.y * 10;

    fireflies.forEach((f, i) => {
      const dx = mx - f.x;
      const dy = my - f.y;
      const dz = 10 - f.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < 12) {
        const pull = (12 - dist) / 12;
        f.vx += dx * pull * 0.01;
        f.vy += dy * pull * 0.01;
        f.vz += dz * pull * 0.005;
      }

      f.vx += (Math.random() - 0.5) * 0.1;
      f.vy += (Math.random() - 0.5) * 0.05;
      f.vz += (Math.random() - 0.5) * 0.1;
      f.vx *= 0.98;
      f.vy *= 0.98;
      f.vz *= 0.98;

      f.x += f.vx;
      f.y += f.vy;
      f.z += f.vz;

      if (Math.abs(f.x) > 25) f.vx *= -1;
      if (f.y < 3 || f.y > 25) f.vy *= -1;
      if (Math.abs(f.z) > 25) f.vz *= -1;

      dummy.position.set(f.x, f.y, f.z);
      const pulse = (0.5 + Math.sin(state.clock.elapsedTime * 3 + f.phase) * 0.5) * f.brightness;
      dummy.scale.setScalar(0.06 + pulse * 0.04);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);

      const trailIdx = i * 3;
      for (let t = 0; t < 3; t++) {
        trails[trailIdx + t].x = f.x - f.vx * (t + 1) * 2;
        trails[trailIdx + t].y = f.y - f.vy * (t + 1) * 2;
        trails[trailIdx + t].z = f.z - f.vz * (t + 1) * 2;
        trails[trailIdx + t].alpha = (1 - t / 3) * 0.3;

        dummy.position.set(trails[trailIdx + t].x, trails[trailIdx + t].y, trails[trailIdx + t].z);
        dummy.scale.setScalar(0.03 * (1 - t / 3));
        dummy.updateMatrix();
        trailRef.current!.setMatrixAt(trailIdx + t, dummy.matrix);
      }
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    trailRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh ref={meshRef} args={[undefined, undefined, SWARM_COUNT]} frustumCulled={false}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.9} />
      </instancedMesh>
      <instancedMesh ref={trailRef} args={[undefined, undefined, SWARM_COUNT * 3]} frustumCulled={false}>
        <sphereGeometry args={[1, 4, 4]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.2} />
      </instancedMesh>
    </>
  );
}
