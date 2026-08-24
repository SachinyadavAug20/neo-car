"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const PARTICLE_COUNT = 100;

export default function MouseFlowField() {
  const { camera } = useThree();
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useRef(new THREE.Object3D());
  const mouseRef = useRef(new THREE.Vector2());
  const particlesRef = useRef<Array<{
    x: number; y: number; z: number;
    vx: number; vy: number; vz: number;
    life: number; maxLife: number;
  }>>([]);

  useMemo(() => {
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: (Math.random() - 0.5) * 40,
      y: Math.random() * 20 - 5,
      z: (Math.random() - 0.5) * 40,
      vx: 0, vy: 0, vz: 0,
      life: Math.random() * 100,
      maxLife: 50 + Math.random() * 100,
    }));
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    const mouse = state.pointer;

    mouseRef.current.set(mouse.x * 20, mouse.y * 15);

    particlesRef.current.forEach((p, i) => {
      const dx = mouseRef.current.x - p.x;
      const dy = mouseRef.current.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 10) {
        const force = (10 - dist) * 0.002;
        p.vx += dx * force;
        p.vy += dy * force;
      }

      p.vx += Math.sin(t * 0.5 + i * 0.1) * 0.01;
      p.vy += Math.cos(t * 0.3 + i * 0.15) * 0.005;
      p.vz += Math.sin(t * 0.2 + i * 0.05) * 0.005;

      p.vx *= 0.98;
      p.vy *= 0.98;
      p.vz *= 0.98;

      p.x += p.vx;
      p.y += p.vy;
      p.z += p.vz;

      p.life += 1;
      if (p.life > p.maxLife) {
        p.x = (Math.random() - 0.5) * 40;
        p.y = Math.random() * 20 - 5;
        p.z = (Math.random() - 0.5) * 40;
        p.vx = 0;
        p.vy = 0;
        p.vz = 0;
        p.life = 0;
      }

      if (Math.abs(p.x) > 25) p.vx *= -0.5;
      if (p.y < -5 || p.y > 20) p.vy *= -0.5;
      if (Math.abs(p.z) > 25) p.vz *= -0.5;

      dummy.current.position.set(p.x, p.y, p.z);
      const lifeRatio = p.life / p.maxLife;
      const scale = 0.03 + lifeRatio * 0.05;
      dummy.current.scale.setScalar(scale);
      dummy.current.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.current.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial
        color="#67e8f9"
        transparent
        opacity={0.4}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  );
}
