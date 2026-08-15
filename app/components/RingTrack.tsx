"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import {
  RigidBody,
  CuboidCollider,
  type IntersectionEnterPayload,
} from "@react-three/rapier";
import { gameStore } from "../store/gameStore";

const RING_COUNT = 30;
const RING_START_Z = -50;
const RING_END_Z = -1500;
const RING_X_SPREAD = 55;
const RING_Y_MIN = 8;
const RING_Y_MAX = 38;
const RING_SPACING = (RING_END_Z - RING_START_Z) / (RING_COUNT - 1);

interface RingData {
  position: [number, number, number];
}

const RINGS: RingData[] = Array.from({ length: RING_COUNT }, (_, i) => ({
  position: [
    (Math.random() * 2 - 1) * RING_X_SPREAD,
    RING_Y_MIN + Math.random() * (RING_Y_MAX - RING_Y_MIN),
    RING_START_Z + i * RING_SPACING,
  ],
}));

export default function RingTrack() {
  const collectedRef = useRef(new Set<number>());
  const ringMeshRefs = useRef<(THREE.Mesh | null)[]>([]);

  const torusGeometry = useMemo(() => new THREE.TorusGeometry(8, 0.4, 16, 64), []);

  const collectRing = (index: number) => (payload: IntersectionEnterPayload) => {
    if (collectedRef.current.has(index)) return;
    if (!payload.other.rigidBody) return;
    collectedRef.current.add(index);

    gameStore.getState().incrementScore();

    const mesh = ringMeshRefs.current[index];
    if (mesh) {
      gsap.to(mesh.scale, {
        x: 1.4,
        y: 1.4,
        z: 1.4,
        duration: 0.25,
        ease: "power2.out",
        yoyo: true,
        repeat: 1,
      });
    }
  };

  return (
    <>
      {RINGS.map((ring, index) => (
        <RigidBody
          key={index}
          type="fixed"
          colliders={false}
          position={ring.position}
        >
          <mesh
            ref={(node) => {
              ringMeshRefs.current[index] = node;
            }}
            geometry={torusGeometry}
          >
            <meshStandardMaterial
              color="#00e5ff"
              emissive="#00e5ff"
              emissiveIntensity={3}
            />
          </mesh>
          <CuboidCollider
            sensor
            args={[8, 8, 1]}
            onIntersectionEnter={collectRing(index)}
          />
        </RigidBody>
      ))}
    </>
  );
}