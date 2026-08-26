"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";

export default function Fog() {
  const { scene } = useThree();
  useEffect(() => {
    scene.fog = new THREE.Fog("#fdf6e3", 30, 90);
    return () => { scene.fog = null; };
  }, [scene]);
  return null;
}
