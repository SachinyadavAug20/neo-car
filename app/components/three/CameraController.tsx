"use client";

import { useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import gsap from "gsap";
import { useAppStore } from "@/app/lib/store";
import { OVERVIEW_CAMERA, ISLANDS } from "@/app/lib/types";

export default function CameraController() {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const activeIsland = useAppStore((s) => s.activeIsland);
  const isTransitioning = useAppStore((s) => s.isTransitioning);
  const prevIslandRef = useRef<string | null>(null);

  useEffect(() => {
    if (!activeIsland) {
      if (prevIslandRef.current) {
        const tl = gsap.timeline({
          onComplete: () => {
            useAppStore.getState().setIsTransitioning(false);
          },
        });

        tl.to(camera.position, {
          x: OVERVIEW_CAMERA.position[0],
          y: OVERVIEW_CAMERA.position[1],
          z: OVERVIEW_CAMERA.position[2],
          duration: 2,
          ease: "power2.inOut",
        });

        if (controlsRef.current) {
          tl.to(
            controlsRef.current.target,
            {
              x: OVERVIEW_CAMERA.lookAt[0],
              y: OVERVIEW_CAMERA.lookAt[1],
              z: OVERVIEW_CAMERA.lookAt[2],
              duration: 2,
              ease: "power2.inOut",
            },
            "<",
          );
        }
      }
      prevIslandRef.current = null;
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        useAppStore.getState().setIsTransitioning(false);
      },
    });

    const target = activeIsland.position;
    const camOffset = activeIsland.cameraOffset;
    const lookTarget = [
      target[0] + activeIsland.cameraLookAt[0],
      target[1] + activeIsland.cameraLookAt[1],
      target[2] + activeIsland.cameraLookAt[2],
    ];

    tl.to(camera.position, {
      x: target[0] + camOffset[0],
      y: target[1] + camOffset[1],
      z: target[2] + camOffset[2],
      duration: 2.5,
      ease: "power3.inOut",
    });

    if (controlsRef.current) {
      tl.to(
        controlsRef.current.target,
        {
          x: lookTarget[0],
          y: lookTarget[1],
          z: lookTarget[2],
          duration: 2.5,
          ease: "power3.inOut",
        },
        "<",
      );
    }

    prevIslandRef.current = activeIsland.id;
  }, [activeIsland, camera]);

  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableZoom={true}
      minDistance={5}
      maxDistance={80}
      minPolarAngle={0.2}
      maxPolarAngle={Math.PI / 2.1}
      dampingFactor={0.05}
      enableDamping
      target={[OVERVIEW_CAMERA.lookAt[0], OVERVIEW_CAMERA.lookAt[1], OVERVIEW_CAMERA.lookAt[2]]}
    />
  );
}
