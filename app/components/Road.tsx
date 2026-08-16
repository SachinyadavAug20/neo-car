"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

export const ROAD_HALF_WIDTH = 11;
export const ROAD_Y = 14.5;

const ROAD_CHUNK = 400;
const ROAD_LENGTH = 1600;
const SURFACE_WIDTH = ROAD_HALF_WIDTH * 2 + 2;
const EDGE_OFFSET = ROAD_HALF_WIDTH + 0.3;
const EDGE_WIDTH = 0.4;
const DASH_LENGTH = 5;
const DASH_GAP = 7;
const DASH_SPACING = DASH_LENGTH + DASH_GAP;
const DASH_COUNT = Math.ceil(ROAD_LENGTH / DASH_SPACING);

const dummy = new THREE.Object3D();

export default function Road() {
  const groupRef = useRef<THREE.Group>(null);
  const lastChunkRef = useRef<number | null>(null);

  const surfaceGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(SURFACE_WIDTH, ROAD_LENGTH, 1, 1);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  const edgeGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(EDGE_WIDTH, ROAD_LENGTH, 1, 1);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  const surfaceMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#05070d",
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
      }),
    [],
  );

  const edgeMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#b4befe",
        transparent: true,
        opacity: 0.95,
      }),
    [],
  );

  const dashMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#cad3f5",
        transparent: true,
        opacity: 0.9,
      }),
    [],
  );

  const dashGeometry = useMemo(
    () => new THREE.BoxGeometry(0.3, 0.02, DASH_LENGTH),
    [],
  );

  const dashRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = dashRef.current;
    if (!mesh) return;
    for (let i = 0; i < DASH_COUNT; i++) {
      dummy.position.set(
        0,
        ROAD_Y + 0.02,
        -ROAD_LENGTH / 2 + i * DASH_SPACING,
      );
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  useEffect(() => {
    return () => {
      surfaceGeometry.dispose();
      edgeGeometry.dispose();
      dashGeometry.dispose();
      surfaceMaterial.dispose();
      edgeMaterial.dispose();
      dashMaterial.dispose();
    };
  }, [
    surfaceGeometry,
    edgeGeometry,
    dashGeometry,
    surfaceMaterial,
    edgeMaterial,
    dashMaterial,
  ]);

  useFrame((state) => {
    const group = groupRef.current;
    const cameraZ = state.camera.position.z;
    const chunk = Math.round(cameraZ / ROAD_CHUNK);
    if (group && lastChunkRef.current !== chunk) {
      lastChunkRef.current = chunk;
      group.position.z = chunk * ROAD_CHUNK;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, ROAD_Y - 0.02, 0]} geometry={surfaceGeometry} material={surfaceMaterial} />
      <mesh
        position={[-EDGE_OFFSET, ROAD_Y + 0.01, 0]}
        geometry={edgeGeometry}
        material={edgeMaterial}
      />
      <mesh
        position={[EDGE_OFFSET, ROAD_Y + 0.01, 0]}
        geometry={edgeGeometry}
        material={edgeMaterial}
      />
      <instancedMesh
        ref={dashRef}
        args={[dashGeometry, dashMaterial, DASH_COUNT]}
        frustumCulled={false}
      />
    </group>
  );
}