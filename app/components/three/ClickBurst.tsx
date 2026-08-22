"use client";

import { useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";

const PARTICLE_COUNT = 12;

interface Burst {
  id: number;
  position: THREE.Vector3;
  particles: { vel: THREE.Vector3; life: number }[];
  startTime: number;
}

export default function ClickBurst() {
  const groupRef = useRef<THREE.Group>(null);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const { camera, raycaster, scene } = useThree();
  const nextId = useRef(0);

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
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 0.15,
          Math.random() * 0.1 + 0.05,
          (Math.random() - 0.5) * 0.15,
        ),
        life: 1,
      }));

      setBursts((prev) => [
        ...prev.slice(-5),
        { id: nextId.current++, position: point.clone(), particles, startTime: performance.now() },
      ]);
    },
    [camera, raycaster, scene],
  );

  useFrame(() => {
    setBursts((prev) =>
      prev
        .map((b) => ({
          ...b,
          particles: b.particles.map((p) => ({
            ...p,
            vel: p.vel.clone().add(new THREE.Vector3(0, -0.002, 0)),
            life: p.life - 0.015,
          })),
        }))
        .filter((b) => b.particles.some((p) => p.life > 0)),
    );
  });

  return (
    <group ref={groupRef}>
      {bursts.map((burst) =>
        burst.particles
          .filter((p) => p.life > 0)
          .map((p, i) => {
            const offset = p.vel.clone().multiplyScalar(
              (performance.now() - burst.startTime) / 16,
            );
            return (
              <mesh
                key={`${burst.id}-${i}`}
                position={[
                  burst.position.x + offset.x,
                  burst.position.y + offset.y,
                  burst.position.z + offset.z,
                ]}
              >
                <sphereGeometry args={[0.05 * p.life, 6, 6]} />
                <meshBasicMaterial
                  color="#fde68a"
                  transparent
                  opacity={p.life * 0.8}
                />
              </mesh>
            );
          }),
      )}
    </group>
  );
}
