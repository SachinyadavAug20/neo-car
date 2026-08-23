"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useNarrative } from "@/app/lib/narrativeStore";

export default function CursorLight() {
  const { started, currentChapter } = useNarrative();
  const lightRef = useRef<THREE.PointLight>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const { camera, pointer } = useThree();

  const color = useMemo(() => {
    const colors = ["#67e8f9", "#a78bfa", "#4ecdc4", "#fbbf24", "#ef4444", "#f472b6", "#c084fc", "#e2e8f0"];
    return new THREE.Color(colors[currentChapter % colors.length] || "#67e8f9");
  }, [currentChapter]);

  useFrame((state) => {
    if (!lightRef.current || !glowRef.current) return;

    const targetX = pointer.x * 30;
    const targetY = 15 + pointer.y * 20;
    const targetZ = 20;

    lightRef.current.position.x += (targetX - lightRef.current.position.x) * 0.05;
    lightRef.current.position.y += (targetY - lightRef.current.position.y) * 0.05;
    lightRef.current.position.z += (targetZ - lightRef.current.position.z) * 0.05;

    glowRef.current.position.copy(lightRef.current.position);

    const pulse = 0.8 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    glowRef.current.scale.setScalar(pulse * 0.3);

    lightRef.current.intensity = 1.5 + Math.sin(state.clock.elapsedTime * 3) * 0.3;
    lightRef.current.color.copy(color);
    const mat = glowRef.current.material as THREE.MeshBasicMaterial;
    mat.color.copy(color);
  });

  if (!started) return null;

  return (
    <>
      <pointLight
        ref={lightRef}
        intensity={1.5}
        distance={40}
        decay={2}
      />
      <mesh ref={glowRef} frustumCulled={false}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} />
      </mesh>
    </>
  );
}
