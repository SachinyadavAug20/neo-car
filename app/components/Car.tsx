"use client";

import { Suspense, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import EffectBoundary from "./EffectBoundary";

const GLTF_PATH = "/models/auto_union_type_c_streamliner/scene.gltf";
const TARGET_CAR_WIDTH = 2.4;
const MODEL_RAW_WIDTH = 1.97;
const MODEL_SCALE = TARGET_CAR_WIDTH / MODEL_RAW_WIDTH;
const MODEL_ROTATION: [number, number, number] = [0, Math.PI, 0];

function CarModel() {
  const { scene } = useGLTF(GLTF_PATH);
  const ref = useRef<THREE.Group>(null);

  return (
    <primitive
      ref={ref}
      object={scene}
      rotation={MODEL_ROTATION}
      scale={MODEL_SCALE}
    />
  );
}

export default function Car() {
  return (
    <EffectBoundary>
      <Suspense fallback={null}>
        <CarModel />
      </Suspense>
    </EffectBoundary>
  );
}

useGLTF.preload(GLTF_PATH);