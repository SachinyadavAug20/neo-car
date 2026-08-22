"use client";

import { Suspense, useEffect, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import EffectBoundary from "./EffectBoundary";

const GLTF_PATH = "/models/sport_car_low_poly/scene.gltf";
const TARGET_CAR_WIDTH = 2.4;
const MODEL_ROTATION: [number, number, number] = [0, 0, 0];

function CarModel() {
  const { scene } = useGLTF(GLTF_PATH);
  const ref = useRef<THREE.Group>(null);

  useEffect(() => {
    const box = new THREE.Box3();
    box.setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const scale = TARGET_CAR_WIDTH / size.x;
    scene.scale.setScalar(scale);

    box.setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    scene.position.set(-center.x, -box.min.y, -center.z);
  }, [scene]);

  return <primitive ref={ref} object={scene} rotation={MODEL_ROTATION} />;
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