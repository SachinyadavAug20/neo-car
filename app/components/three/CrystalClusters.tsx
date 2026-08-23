"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useNarrative } from "@/app/lib/narrativeStore";

export default function CrystalClusters() {
  const { started } = useNarrative();
  const groupRef = useRef<THREE.Group>(null);

  const clusters = useMemo(() => {
    return Array.from({ length: 12 }, () => ({
      x: (Math.random() - 0.5) * 40,
      y: 2 + Math.random() * 3,
      z: (Math.random() - 0.5) * 40,
      height: 0.5 + Math.random() * 1.5,
      radius: 0.1 + Math.random() * 0.2,
      rotation: Math.random() * Math.PI,
      tilt: (Math.random() - 0.5) * 0.5,
      hue: Math.random() * 0.2 + 0.5,
      speed: 0.5 + Math.random() * 1,
      offset: Math.random() * Math.PI * 2,
    }));
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      const cluster = clusters[i];
      if (!cluster) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.3 + Math.sin(state.clock.elapsedTime * cluster.speed + cluster.offset) * 0.2;
    });
  });

  if (!started) return null;

  return (
    <group ref={groupRef}>
      {clusters.map((cluster, i) => (
        <group key={i} position={[cluster.x, cluster.y, cluster.z]} rotation={[cluster.tilt, cluster.rotation, 0]}>
          <mesh frustumCulled={false}>
            <coneGeometry args={[cluster.radius, cluster.height, 6]} />
            <meshStandardMaterial
              color={`hsl(${cluster.hue * 360}, 70%, 60%)`}
              emissive={`hsl(${cluster.hue * 360}, 80%, 40%)`}
              emissiveIntensity={0.3}
              transparent
              opacity={0.7}
              roughness={0.1}
              metalness={0.3}
            />
          </mesh>
          {Math.random() > 0.5 && (
            <mesh position={[cluster.radius * 0.5, cluster.height * 0.3, 0]} rotation={[0.3, 0.5, 0.2]} frustumCulled={false}>
              <coneGeometry args={[cluster.radius * 0.6, cluster.height * 0.5, 5]} />
              <meshStandardMaterial
                color={`hsl(${cluster.hue * 360 + 30}, 70%, 60%)`}
                emissive={`hsl(${cluster.hue * 360 + 30}, 80%, 40%)`}
                emissiveIntensity={0.3}
                transparent
                opacity={0.6}
                roughness={0.1}
              />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}
