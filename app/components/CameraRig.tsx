"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { easing } from "maath";
import { useAppStore, type AppRoute } from "../lib/appStore";
import { useAudioAnalyzer } from "../hooks/useAudioAnalyzer";

const ROUTE_CAMERAS: Record<
  AppRoute,
  {
    position: [number, number, number];
    lookAt: [number, number, number];
    fov: number;
  }
> = {
  "/": {
    position: [0, 8, 26],
    lookAt: [0, 3, 15],
    fov: 50,
  },
  "/garage": {
    position: [-8, 3, 18],
    lookAt: [0, 2, 0],
    fov: 45,
  },
  "/drive": {
    position: [0, 5, 18],
    lookAt: [0, 2, 20],
    fov: 60,
  },
};

const DAMP_SPEED = 0.04;
const ORBIT_RADIUS = 18;
const ORBIT_HEIGHT = 6;
const ORBIT_SPEED = 0.08;

const tmpTarget = new THREE.Vector3();
const tmpLookTarget = new THREE.Vector3();

export default function CameraRig() {
  const { getFrequencies } = useAudioAnalyzer();

  const targetPos = useMemo(() => new THREE.Vector3(), []);
  const targetLook = useMemo(() => new THREE.Vector3(), []);
  const currentLook = useMemo(() => new THREE.Vector3(0, 3, 15), []);

  useFrame((state, delta) => {
    const route = useAppStore.getState().currentRoute;
    const camera = state.camera;

    if (route === "/drive") return;

    const elapsed = state.clock.elapsedTime;
    const [bass] = getFrequencies();

    if (route === "/") {
      const angle = elapsed * ORBIT_SPEED;
      const breathe = 1 + bass * 0.15;
      targetPos.set(
        Math.sin(angle) * ORBIT_RADIUS * breathe,
        ORBIT_HEIGHT + Math.sin(elapsed * 0.15) * 1.5,
        Math.cos(angle) * ORBIT_RADIUS,
      );
      targetLook.set(0, 2.5, 0);
    } else if (route === "/garage") {
      const angle = elapsed * 0.05;
      targetPos.set(
        Math.sin(angle) * 12,
        2.5 + Math.sin(elapsed * 0.2) * 0.5,
        Math.cos(angle) * 14 + 4,
      );
      targetLook.set(0, 1.5, 0);
    }

    const cfg = ROUTE_CAMERAS[route] ?? ROUTE_CAMERAS["/"];
    const fovTarget = cfg.fov + bass * 5;

    easing.damp3(camera.position, targetPos, DAMP_SPEED, delta);
    currentLook.lerp(targetLook, DAMP_SPEED);
    camera.lookAt(currentLook);

    if (typeof (camera as THREE.PerspectiveCamera).fov === "number") {
      easing.damp(camera as THREE.PerspectiveCamera, "fov", fovTarget, 0.1, delta);
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }
  });

  return null;
}
