"use client";

import { useThree } from "@react-three/fiber";
import { memo, useEffect } from "react";
import * as THREE from "three";

export default memo(function Fog() {
  const { scene } = useThree();
  useEffect(() => {
    scene.fog = new THREE.Fog("#fdf6e3", 45, 140);
    return () => { scene.fog = null; };
  }, [scene]);
  return null;
});
