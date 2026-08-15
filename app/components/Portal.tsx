"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useRouter } from "next/navigation";
import {
  RigidBody,
  CuboidCollider,
  type IntersectionEnterPayload,
} from "@react-three/rapier";
import { getCamera } from "../lib/cameraStore";
import { triggerFade } from "../lib/fadeStore";

const PORTAL_POSITION: [number, number, number] = [0, 10, -300];
const PORTAL_FOV = 150;
const WARP_DURATION = 1.5;

export default function Portal() {
  const router = useRouter();
  const entered = useRef(false);

  const handleEnter = (payload: IntersectionEnterPayload) => {
    if (entered.current) return;
    if (!payload.other.rigidBody) return;
    entered.current = true;

    const camera = getCamera();
    const timeline = gsap.timeline({
      onComplete: () => router.push("/explore"),
    });

    if (camera) {
      timeline.to(camera, {
        fov: PORTAL_FOV,
        duration: WARP_DURATION,
        ease: "power2.in",
        onUpdate: () => camera.updateProjectionMatrix(),
      });
    }

    timeline.call(() => triggerFade(), [], 0.15);
  };

  return (
    <RigidBody type="fixed" colliders="trimesh" position={PORTAL_POSITION}>
      <mesh>
        <torusGeometry args={[15, 0.5, 16, 100]} />
        <meshStandardMaterial
          color="#12021f"
          emissive="#ff2d95"
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