"use client";

import { useRef, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const STRENGTH = 0.3;
const DAMPING = 0.95;

export default function MagneticCursor() {
  const { camera } = useThree();
  const mouseRef = useRef(new THREE.Vector2());
  const targetRef = useRef(new THREE.Vector2());
  const velocityRef = useRef(new THREE.Vector2());
  const glowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    mouseRef.current.set(
      (state.pointer.x * 0.5 + 0.5) * window.innerWidth,
      (state.pointer.y * 0.5 + 0.5) * window.innerHeight,
    );

    velocityRef.current.x += (mouseRef.current.x - targetRef.current.x) * STRENGTH;
    velocityRef.current.y += (mouseRef.current.y - targetRef.current.y) * STRENGTH;
    velocityRef.current.multiplyScalar(DAMPING);

    targetRef.current.add(velocityRef.current);

    if (glowRef.current) {
      glowRef.current.position.x = state.pointer.x * 20;
      glowRef.current.position.y = state.pointer.y * 15;
      glowRef.current.position.z = 10;
      glowRef.current.scale.setScalar(1 + Math.sin(t * 3) * 0.1);
    }

    if (ringRef.current) {
      ringRef.current.position.x = state.pointer.x * 20;
      ringRef.current.position.y = state.pointer.y * 15;
      ringRef.current.position.z = 10;
      ringRef.current.rotation.z = t * 0.5;
      const ringScale = 0.8 + velocityRef.current.length() * 0.01;
      ringRef.current.scale.setScalar(ringScale);
    }
  });

  return (
    <group>
      <mesh ref={glowRef}>
        <circleGeometry args={[0.15, 32]} />
        <meshBasicMaterial
          color="#4ecdc4"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={ringRef}>
        <ringGeometry args={[0.2, 0.22, 32]} />
        <meshBasicMaterial
          color="#a78bfa"
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
