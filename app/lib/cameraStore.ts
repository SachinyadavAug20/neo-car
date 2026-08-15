"use client";

import type * as THREE from "three";

let camera: THREE.PerspectiveCamera | null = null;

export function registerCamera(cam: THREE.PerspectiveCamera | null): void {
  camera = cam;
}

export function getCamera(): THREE.PerspectiveCamera | null {
  return camera;
}