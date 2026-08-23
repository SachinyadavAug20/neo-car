"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useNarrative } from "@/app/lib/narrativeStore";

export default function BeaconLights() {
  const { started, currentChapter } = useNarrative();
  const beamsRef = useRef<THREE.Group>(null);

  const beacons = useMemo(() => [
    { x: 0, z: 0, color: "#67e8f9" },
    { x: 12, z: -8, color: "#a78bfa" },
    { x: -10, z: 6, color: "#fbbf24" },
    { x: 6, z: 10, color: "#4ecdc4" },
  ], []);

  useFrame((state) => {
    if (!beamsRef.current) return;
    beamsRef.current.children.forEach((child, i) => {
      const beam = child as THREE.Mesh;
      const mat = beam.material as THREE.MeshBasicMaterial;
      const isActive = i === currentChapter % beacons.length;
      const targetOpacity = isActive ? 0.15 + Math.sin(state.clock.elapsedTime * 2) * 0.05 : 0.03;
      mat.opacity += (targetOpacity - mat.opacity) * 0.05;
    });
  });

  if (!started) return null;

  return (
    <group ref={beamsRef}>
      {beacons.map((beacon, i) => (
        <mesh key={i} position={[beacon.x, 30, beacon.z]} frustumCulled={false}>
          <cylinderGeometry args={[0.1, 2, 60, 8, 1, true]} />
          <meshBasicMaterial
            color={beacon.color}
            transparent
            opacity={0.05}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
