"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface CloudPuff {
  offset: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
}

interface CloudData {
  id: number;
  position: [number, number, number];
  speed: number;
  scale: number;
  puffs: CloudPuff[];
}

export function PaperClouds({ count = 4, area = [100, 20, 100] }: { count?: number; area?: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);

  const clouds = useMemo<CloudData[]>(() => {
    const list: CloudData[] = [];
    for (let i = 0; i < count; i++) {
      const puffCount = 3;
      const puffs: CloudPuff[] = [];

      for (let p = 0; p < puffCount; p++) {
        puffs.push({
          offset: [
            (p - puffCount / 2) * 1.8,
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.8,
          ],
          scale: [1.2, 0.9, 1.1],
          rotation: [0, (p * Math.PI) / 3, 0],
        });
      }

      list.push({
        id: i,
        position: [
          (Math.random() - 0.5) * area[0],
          14 + (i % 2) * 4,
          (Math.random() - 0.5) * area[2],
        ],
        speed: 0.25 + i * 0.05,
        scale: 1.1,
        puffs,
      });
    }
    return list;
  }, [count, area]);

  const puffGeo = useMemo(() => new THREE.DodecahedronGeometry(1.2, 0), []);
  const edgeGeo = useMemo(() => new THREE.EdgesGeometry(puffGeo), [puffGeo]);
  const toonMat = useMemo(() => new THREE.MeshToonMaterial({ color: "#ffffff" }), []);
  const lineMat = useMemo(() => new THREE.LineBasicMaterial({ color: "#1a1a2e", transparent: true, opacity: 0.15 }), []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const dt = Math.min(delta, 0.05);

    groupRef.current.children.forEach((child, i) => {
      const c = clouds[i];
      if (!c) return;
      child.position.x += c.speed * dt * 2;
      if (child.position.x > area[0] / 2) {
        child.position.x = -area[0] / 2;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {clouds.map((cloud) => (
        <group key={cloud.id} position={cloud.position} scale={cloud.scale}>
          {cloud.puffs.map((puff, pi) => (
            <group key={pi} position={puff.offset} scale={puff.scale} rotation={puff.rotation}>
              <mesh geometry={puffGeo} material={toonMat} />
              <lineSegments geometry={edgeGeo} material={lineMat} />
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}
