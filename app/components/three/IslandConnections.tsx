"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const CONNECTION_COUNT = 20;

export default function IslandConnections() {
  const groupRef = useRef<THREE.Group>(null);

  const lines = useMemo(() => {
    return Array.from({ length: CONNECTION_COUNT }, (_, i) => {
      const start = new THREE.Vector3(
        (Math.random() - 0.5) * 60,
        Math.random() * 20 - 5,
        (Math.random() - 0.5) * 60,
      );
      const end = new THREE.Vector3(
        (Math.random() - 0.5) * 60,
        Math.random() * 20 - 5,
        (Math.random() - 0.5) * 60,
      );
      const mid = new THREE.Vector3()
        .addVectors(start, end)
        .multiplyScalar(0.5)
        .add(new THREE.Vector3(0, Math.random() * 5 + 2, 0));

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const points = curve.getPoints(50);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: "#4ecdc4",
        transparent: true,
        opacity: 0.15,
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
        const material = child.material as THREE.LineBasicMaterial;
        material.opacity = 0.1 + Math.sin(t + i) * 0.05;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {lines.map((item, i) => (
        <primitive key={i} object={item.line} />
      ))}
    </group>
  );
}
