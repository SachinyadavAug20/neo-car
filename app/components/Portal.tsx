"use client";

import { useRef } from "react";
import {
  RigidBody,
  CuboidCollider,
  type IntersectionEnterPayload,
} from "@react-three/rapier";
import { gameStore } from "../store/gameStore";

const PORTAL_POSITION: [number, number, number] = [0, 10, 3200];
const PORTAL_COLOR = "#94e2d5";

export default function Portal() {
  const entered = useRef(false);

  const handleEnter = (payload: IntersectionEnterPayload) => {
    if (entered.current) return;
    if (!payload.other.rigidBody) return;
    entered.current = true;
    gameStore.getState().finishLevel();
  };

  return (
    <RigidBody type="fixed" colliders="trimesh" position={PORTAL_POSITION}>
      <mesh>
        <torusGeometry args={[15, 0.5, 16, 20]} />
        <meshStandardMaterial
          color="#12021f"
          emissive={PORTAL_COLOR}
          emissiveIntensity={4}
        />
      </mesh>
      <CuboidCollider
        sensor
        args={[15, 15, 2]}
        onIntersectionEnter={handleEnter}
      />
    </RigidBody>
  );
}