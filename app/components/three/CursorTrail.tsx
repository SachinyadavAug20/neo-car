"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const TRAIL_LENGTH = 80;

export default function CursorTrail() {
  const { camera } = useThree();
  const lineObj = useRef<THREE.Line | null>(null);
  const positionsRef = useRef<Float32Array>(new Float32Array(TRAIL_LENGTH * 3));

  const lineObjInitial = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(TRAIL_LENGTH * 3);
    pos[2] = 10;
    for (let i = 1; i < TRAIL_LENGTH; i++) {
      pos[i * 3 + 2] = 10;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.LineBasicMaterial({
      color: "#4ecdc4",
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    return new THREE.Line(geo, mat);
  }, []);

  useEffect(() => {
    lineObj.current = lineObjInitial;
  }, [lineObjInitial]);

  useFrame((state) => {
    if (!lineObj.current) return;
    const mouse = state.pointer;
    const pos = positionsRef.current;

    const worldX = mouse.x * 25;
    const worldY = mouse.y * 15;
    const worldZ = 10;

    for (let i = TRAIL_LENGTH - 1; i > 0; i--) {
      pos[i * 3] = pos[(i - 1) * 3];
      pos[i * 3 + 1] = pos[(i - 1) * 3 + 1];
      pos[i * 3 + 2] = pos[(i - 1) * 3 + 2];
    }

    pos[0] = worldX;
    pos[1] = worldY;
    pos[2] = worldZ;

    const attr = lineObj.current.geometry.attributes.position;
    for (let i = 0; i < TRAIL_LENGTH * 3; i++) {
      attr.array[i] = pos[i];
    }
    attr.needsUpdate = true;
  });

  return (
    <group>
      <primitive object={lineObjInitial} />
    </group>
  );
}
