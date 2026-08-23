"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useNarrative } from "@/app/lib/narrativeStore";
import { CHAPTERS } from "@/app/lib/narrative";

function Moon() {
  const ref = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.x = Math.sin(t * 0.02) * 30;
    ref.current.position.y = 25 + Math.sin(t * 0.01) * 3;
    ref.current.rotation.y = t * 0.05;
    if (glowRef.current) {
      glowRef.current.position.copy(ref.current.position);
      const pulse = 1 + Math.sin(t * 0.5) * 0.1;
      glowRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <>
      <mesh ref={ref} position={[0, 25, -40]}>
        <sphereGeometry args={[2, 24, 24]} />
        <meshStandardMaterial color="#e2e8f0" emissive="#e2e8f0" emissiveIntensity={0.5} />
      </mesh>
      <mesh ref={glowRef} position={[0, 25, -40]}>
        <sphereGeometry args={[3, 16, 16]} />
        <meshBasicMaterial color="#e2e8f0" transparent opacity={0.05} />
      </mesh>
      <pointLight position={[0, 25, -40]} color="#e2e8f0" intensity={0.3} distance={100} />
    </>
  );
}

function Constellations() {
  const ref = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const starData = useMemo(() => {
    const positions: [number, number, number][] = [];
    for (let i = 0; i < 30; i++) {
      positions.push([
        (Math.random() - 0.5) * 80,
        15 + Math.random() * 20,
        -30 - Math.random() * 30,
      ]);
    }
    return positions;
  }, []);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.003;
    }
    if (meshRef.current) {
      const dummy = new THREE.Object3D();
      starData.forEach((pos, i) => {
        dummy.position.set(pos[0], pos[1], pos[2]);
        const pulse = 0.8 + Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.2;
        dummy.scale.setScalar(pulse);
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group ref={ref}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, 30]} frustumCulled={false}>
        <sphereGeometry args={[0.05, 4, 4]} />
        <meshBasicMaterial color="#ffffff" />
      </instancedMesh>
    </group>
  );
}

export default function DynamicSky() {
  const { started } = useNarrative();

  if (!started) return null;

  return (
    <>
      <Moon />
      <Constellations />
    </>
  );
}
