"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

const LINE_COUNT = 300;
const LINE_SPREAD_X = 30;
const LINE_SPREAD_Y = 15;
const LINE_Z_RANGE = 60;
const LINE_SPEED = 120;

const dummy = new THREE.Object3D();
const tmpColor = new THREE.Color();

const LINE_MATERIAL = new THREE.MeshBasicMaterial({
  color: "#8aadf4",
  transparent: true,
  opacity: 0.3,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

interface LineData {
  x: number;
  y: number;
  z: number;
  speed: number;
  scale: number;
  hue: number;
}

function seededHash(s: number): number {
  const x = Math.sin(s * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const LINES: LineData[] = Array.from({ length: LINE_COUNT }, (_, i) => {
  const s = i * 7 + 3;
  return {
    x: (seededHash(s) - 0.5) * LINE_SPREAD_X * 2,
    y: (seededHash(s + 1) - 0.5) * LINE_SPREAD_Y,
    z: -seededHash(s + 2) * LINE_Z_RANGE,
    speed: 0.6 + seededHash(s + 3) * 0.8,
    scale: 0.3 + seededHash(s + 4) * 0.7,
    hue: 0.58 + seededHash(s + 5) * 0.1,
  };
});

export default function SpeedLines({ speedRatio }: { speedRatio: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(
    () => new THREE.CylinderGeometry(0.02, 0.02, 1, 4),
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < LINE_COUNT; i++) {
      const l = LINES[i];
      dummy.position.set(l.x, l.y, l.z);
      dummy.scale.set(0.5, l.scale * 8, 0.5);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    LINE_MATERIAL.opacity = Math.min(speedRatio * 2, 1) * 0.35;

    for (let i = 0; i < LINE_COUNT; i++) {
      const l = LINES[i];
      l.z += LINE_SPEED * l.speed * delta * speedRatio;
      if (l.z > 10) {
        l.z = -LINE_Z_RANGE - Math.random() * 20;
        l.x = (Math.random() - 0.5) * LINE_SPREAD_X * 2;
        l.y = (Math.random() - 0.5) * LINE_SPREAD_Y;
      }

      dummy.position.set(l.x, l.y, l.z);
      dummy.scale.set(0.5, l.scale * 8, 0.5);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      tmpColor.setHSL(l.hue, 0.7, 0.55 + speedRatio * 0.2);
      mesh.setColorAt(i, tmpColor);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, LINE_MATERIAL, LINE_COUNT]}
      frustumCulled={false}
    />
  );
}
