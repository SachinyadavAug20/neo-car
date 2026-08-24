"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useNarrative } from "@/app/lib/narrativeStore";
import { CHAPTERS } from "@/app/lib/narrative";

export default function Companion() {
  const { started, playing, currentChapter, currentBeat } = useNarrative();
  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);
  const trailPositions = useRef<Float32Array>(new Float32Array(60 * 3));
  const trailIndex = useRef(0);
  const dummy = useRef(new THREE.Object3D()).current;

  const chapter = CHAPTERS[currentChapter];
  const color = chapter ? new THREE.Color(chapter.color) : new THREE.Color("#67e8f9");

  useFrame((state, delta) => {
    if (!groupRef.current || !started) return;

    timeRef.current += delta;
    const t = timeRef.current;

    const baseX = Math.sin(t * 0.3) * 2 + 3;
    const baseY = 3 + Math.sin(t * 0.5) * 0.5;
    const baseZ = Math.cos(t * 0.4) * 2 + 2;

    groupRef.current.position.set(baseX, baseY, baseZ);

    if (innerRef.current) {
      innerRef.current.rotation.y = t * 0.8;
      innerRef.current.rotation.z = Math.sin(t * 1.2) * 0.2;
      const pulse = 1 + Math.sin(t * 2) * 0.1;
      innerRef.current.scale.setScalar(pulse);
    }

    if (trailRef.current) {
      const i3 = (trailIndex.current % 20) * 3;
      trailPositions.current[i3] = baseX;
      trailPositions.current[i3 + 1] = baseY - 0.3;
      trailPositions.current[i3 + 2] = baseZ;
      trailIndex.current++;

      for (let i = 0; i < 20; i++) {
        const idx = ((trailIndex.current - i + 200) % 20) * 3;
        dummy.position.set(
          trailPositions.current[idx],
          trailPositions.current[idx + 1] - i * 0.05,
          trailPositions.current[idx + 2],
        );
        const scale = (1 - i / 20) * 0.08;
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        trailRef.current.setMatrixAt(i, dummy.matrix);
      }
      trailRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  if (!started || !playing) return null;

  return (
    <group ref={groupRef}>
      {/* Core orb */}
      <mesh ref={innerRef}>
        <dodecahedronGeometry args={[0.15, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2}
          transparent
          opacity={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[0.3, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.1} />
      </mesh>

      {/* Point light */}
      <pointLight color={color} intensity={1} distance={8} decay={2} />

      {/* Trail particles */}
      <instancedMesh ref={trailRef} args={[undefined, undefined, 20]} frustumCulled={false}>
        <sphereGeometry args={[1, 4, 4]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </instancedMesh>
    </group>
  );
}
