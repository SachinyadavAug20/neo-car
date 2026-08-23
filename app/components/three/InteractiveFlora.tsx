"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useNarrative } from "@/app/lib/narrativeStore";

const PLANT_COUNT = 15;

export default function InteractiveFlora() {
  const { started } = useNarrative();
  const { pointer } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const meshesRef = useRef<(THREE.Mesh | null)[]>([]);

  const plants = useMemo(() => {
    return Array.from({ length: PLANT_COUNT }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * 30,
        -2 + Math.random() * 2,
        (Math.random() - 0.5) * 30 - 15,
      ] as [number, number, number],
      scale: 0.3 + Math.random() * 0.5,
      color: new THREE.Color().setHSL(0.3 + Math.random() * 0.2, 0.6, 0.4 + Math.random() * 0.2),
      offset: Math.random() * Math.PI * 2,
    }));
  }, []);

  useFrame((state) => {
    if (!started) return;
    const t = state.clock.elapsedTime;
    const mouseWorld = new THREE.Vector3(pointer.x * 20, 3, pointer.y * -15);

    meshesRef.current.forEach((ref, i) => {
      if (!ref) return;
      const plant = plants[i];
      const dist = ref.position.distanceTo(mouseWorld);
      const influence = Math.max(0, 1 - dist / 8);

      ref.rotation.z = Math.sin(t * 0.8 + plant.offset) * 0.1 + influence * 0.3 * (ref.position.x > mouseWorld.x ? 1 : -1);
      ref.rotation.x = influence * 0.2;
      ref.scale.y = plant.scale * (1 + influence * 0.3 + Math.sin(t + plant.offset) * 0.05);
    });
  });

  if (!started) return null;

  return (
    <group ref={groupRef}>
      {plants.map((plant, i) => (
        <mesh
          key={i}
          ref={(el) => { meshesRef.current[i] = el; }}
          position={plant.position}
        >
          <cylinderGeometry args={[0.02, 0.08, 1.5, 6]} />
          <meshStandardMaterial
            color={plant.color}
            emissive={plant.color}
            emissiveIntensity={0.2}
            roughness={0.7}
          />
        </mesh>
      ))}
    </group>
  );
}
