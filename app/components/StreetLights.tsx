"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { ROAD_HALF_WIDTH, ROAD_Y } from "./Road";

const LIGHT_CHUNK = 400;
const LIGHT_LENGTH = 1600;
const LIGHT_SPACING = 55;
const SIDE_X = ROAD_HALF_WIDTH + 5;
const POLE_HEIGHT = 12;
const PER_SIDE = Math.ceil(LIGHT_LENGTH / LIGHT_SPACING);
const LIGHT_COUNT = PER_SIDE * 2;

const dummy = new THREE.Object3D();

export default function StreetLights() {
  const groupRef = useRef<THREE.Group>(null);
  const lastChunkRef = useRef<number | null>(null);
  const poleRef = useRef<THREE.InstancedMesh>(null);
  const armRef = useRef<THREE.InstancedMesh>(null);
  const bulbRef = useRef<THREE.InstancedMesh>(null);

  const poleGeometry = useMemo(() => new THREE.BoxGeometry(0.4, POLE_HEIGHT, 0.4), []);
  const armGeometry = useMemo(() => new THREE.BoxGeometry(2.0, 0.14, 0.3), []);
  const bulbGeometry = useMemo(() => new THREE.SphereGeometry(0.55, 12, 10), []);

  const poleMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: "#0a0e16" }), []);
  const armMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: "#0a0e16" }), []);
  const bulbMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(2.6, 2.9, 3.3),
        toneMapped: false,
      }),
    [],
  );

  useLayoutEffect(() => {
    const poleMesh = poleRef.current;
    const armMesh = armRef.current;
    const bulbMesh = bulbRef.current;
    if (!poleMesh || !armMesh || !bulbMesh) return;

    let idx = 0;
    const place = (x: number, z: number) => {
      dummy.position.set(x, ROAD_Y + POLE_HEIGHT / 2, z);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      poleMesh.setMatrixAt(idx, dummy.matrix);

      const armX = x > 0 ? x - 1 : x + 1;
      dummy.position.set(armX, ROAD_Y + POLE_HEIGHT - 0.1, z);
      dummy.updateMatrix();
      armMesh.setMatrixAt(idx, dummy.matrix);

      const bulbX = x > 0 ? x - 2 : x + 2;
      dummy.position.set(bulbX, ROAD_Y + POLE_HEIGHT - 0.35, z);
      dummy.updateMatrix();
      bulbMesh.setMatrixAt(idx, dummy.matrix);

      idx++;
    };

    for (let i = 0; i < PER_SIDE; i++) {
      const z = -LIGHT_LENGTH / 2 + i * LIGHT_SPACING;
      place(SIDE_X, z);
      place(-SIDE_X, z + LIGHT_SPACING / 2);
    }

    poleMesh.instanceMatrix.needsUpdate = true;
    armMesh.instanceMatrix.needsUpdate = true;
    bulbMesh.instanceMatrix.needsUpdate = true;
  }, []);

  useEffect(() => {
    return () => {
      poleGeometry.dispose();
      armGeometry.dispose();
      bulbGeometry.dispose();
      poleMaterial.dispose();
      armMaterial.dispose();
      bulbMaterial.dispose();
    };
  }, [poleGeometry, armGeometry, bulbGeometry, poleMaterial, armMaterial, bulbMaterial]);

  useFrame((state) => {
    const group = groupRef.current;
    const cameraZ = state.camera.position.z;
    const chunk = Math.round(cameraZ / LIGHT_CHUNK);
    if (group && lastChunkRef.current !== chunk) {
      lastChunkRef.current = chunk;
      group.position.z = chunk * LIGHT_CHUNK;
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh
        ref={poleRef}
        args={[poleGeometry, poleMaterial, LIGHT_COUNT]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={armRef}
        args={[armGeometry, armMaterial, LIGHT_COUNT]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={bulbRef}
        args={[bulbGeometry, bulbMaterial, LIGHT_COUNT]}
        frustumCulled={false}
      />
    </group>
  );
}