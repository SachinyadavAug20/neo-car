"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const RIBBON_COUNT = 8;
const SEGMENTS = 60;

export default function LightRibbons() {
  const groupRef = useRef<THREE.Group>(null);

  const ribbons = useMemo(() => {
    return Array.from({ length: RIBBON_COUNT }, (_, i) => {
      const startAngle = (i / RIBBON_COUNT) * Math.PI * 2;
      const points: THREE.Vector3[] = [];
      for (let j = 0; j < SEGMENTS; j++) {
        const t = j / SEGMENTS;
        const angle = startAngle + t * Math.PI * 1.5;
        const radius = 8 + t * 15;
        points.push(new THREE.Vector3(
          Math.cos(angle) * radius,
          5 + Math.sin(t * Math.PI) * 8,
          Math.sin(angle) * radius
        ));
      }
      const curve = new THREE.CatmullRomCurve3(points);
      const geometry = new THREE.TubeGeometry(curve, SEGMENTS, 0.04, 4, false);
      return {
        geometry,
        color: new THREE.Color().setHSL(i / RIBBON_COUNT, 0.7, 0.6),
        speed: 0.2 + Math.random() * 0.3,
        offset: Math.random() * Math.PI * 2,
      };
    });
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.15 + Math.sin(state.clock.elapsedTime * ribbons[i].speed + ribbons[i].offset) * 0.1;
    });
  });

  return (
    <group ref={groupRef}>
      {ribbons.map((ribbon, i) => (
        <mesh key={i} geometry={ribbon.geometry} frustumCulled={false}>
          <meshBasicMaterial color={ribbon.color} transparent opacity={0.2} />
        </mesh>
      ))}
    </group>
  );
}
