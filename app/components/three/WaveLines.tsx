"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const CURVE_COUNT = 12;

export default function WaveLines() {
  const groupRef = useRef<THREE.Group>(null);

  const curves = useMemo(() => {
    return Array.from({ length: CURVE_COUNT }, (_, i) => {
      const points: THREE.Vector3[] = [];
      const segments = 50;
      const y = i * 2 - CURVE_COUNT;

      for (let j = 0; j < segments; j++) {
        const t = j / segments;
        const x = (t - 0.5) * 60;
        points.push(new THREE.Vector3(x, y, 0));
      }

      const curve = new THREE.CatmullRomCurve3(points);
      const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(50));
      const material = new THREE.LineBasicMaterial({
        color: "#4ecdc4",
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending,
      });
      const line = new THREE.Line(geometry, material);

      return { line, offset: i * 0.3 };
    });
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    groupRef.current.children.forEach((child, i) => {
      if (child instanceof THREE.Line) {
        const positions = child.geometry.attributes.position;
        for (let j = 0; j < positions.count; j++) {
          const x = positions.getX(j);
          const wave = Math.sin(x * 0.1 + t + i * 0.5) * 2;
          positions.setY(j, i * 2 - CURVE_COUNT + wave);
        }
        positions.needsUpdate = true;

        const material = child.material as THREE.LineBasicMaterial;
        material.opacity = 0.05 + Math.sin(t + i) * 0.03;
      }
    });
  });

  return (
    <group ref={groupRef} position={[0, 0, -30]}>
      {curves.map((curve, i) => (
        <primitive key={i} object={curve.line} />
      ))}
    </group>
  );
}
