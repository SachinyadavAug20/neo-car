"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function WireframeGrid() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x = -Math.PI / 2;
    ref.current.position.y = -3;
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.05 + Math.sin(state.clock.elapsedTime * 0.3) * 0.02;
  });

  return (
    <mesh ref={ref} frustumCulled={false}>
      <planeGeometry args={[100, 100, 40, 40]} />
      <meshBasicMaterial color="#67e8f9" wireframe transparent opacity={0.05} />
    </mesh>
  );
}
