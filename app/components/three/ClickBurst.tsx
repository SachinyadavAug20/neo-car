"use client";

import { useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";

const PARTICLE_COUNT = 12;
const LIFETIME = 1;
const DECAY = 0.015;
const MAX_BURSTS = 5;

interface Burst {
  id: number;
  position: THREE.Vector3;
  particles: { vx: number; vy: number; vz: number; life: number }[];
  startTime: number;
}

const tmpVec = new THREE.Vector3();

export default function ClickBurst() {
  const groupRef = useRef<THREE.Group>(null);
  const burstsRef = useRef<Burst[]>([]);
  const meshRefs = useRef<THREE.InstancedMesh>(null);
  const dummy = useRef(new THREE.Object3D());
  const nextId = useRef(0);
  const { camera, raycaster, scene } = useThree();
  const [, forceUpdate] = useState(0);

  const handleClick = useCallback(
    (e: MouseEvent) => {
      const mouse = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1,
      );
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      if (intersects.length === 0) return;

      const point = intersects[0].point;
      const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
        vx: (Math.random() - 0.5) * 0.15,
        vy: Math.random() * 0.1 + 0.05,
        vz: (Math.random() - 0.5) * 0.15,
        life: LIFETIME,
      }));

      burstsRef.current = [
        ...burstsRef.current.slice(-(MAX_BURSTS - 1)),
        { id: nextId.current++, position: point.clone(), particles, startTime: performance.now() },
      ];
      forceUpdate((n) => n + 1);
    },
    [camera, raycaster, scene],
  );

  useFrame(() => {
    const elapsed = performance.now();
    let changed = false;

    burstsRef.current = burstsRef.current
      .map((b) => ({
        ...b,
        particles: b.particles.map((p) => ({
          ...p,
          vy: p.vy - 0.002,
          life: p.life - DECAY,
        })),
      }))
      .filter((b) => {
        const alive = b.particles.some((p) => p.life > 0);
        if (!alive) changed = true;
        return alive;
      });

    if (!meshRefs.current) return;
    let idx = 0;

    for (const burst of burstsRef.current) {
      const dt = (elapsed - burst.startTime) / 16;
      for (const p of burst.particles) {
        if (p.life <= 0) continue;
        tmpVec.set(p.vx * dt, p.vy * dt - 0.5 * 0.002 * dt * dt, p.vz * dt);
        dummy.current.position.set(
          burst.position.x + tmpVec.x,
          burst.position.y + tmpVec.y,
          burst.position.z + tmpVec.z,
        );
        const s = Math.max(p.life, 0) * 0.05;
        dummy.current.scale.setScalar(s);
        dummy.current.updateMatrix();
        meshRefs.current.setMatrixAt(idx, dummy.current.matrix);
        idx++;
      }
    }

    for (; idx < MAX_BURSTS * PARTICLE_COUNT; idx++) {
      dummy.current.scale.setScalar(0);
      dummy.current.updateMatrix();
      meshRefs.current.setMatrixAt(idx, dummy.current.matrix);
    }

    meshRefs.current.instanceMatrix.needsUpdate = true;
    if (changed) forceUpdate((n) => n + 1);
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRefs} args={[undefined, undefined, MAX_BURSTS * PARTICLE_COUNT]} frustumCulled={false}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial color="#fde68a" transparent opacity={0.8} />
      </instancedMesh>
    </group>
  );
}
