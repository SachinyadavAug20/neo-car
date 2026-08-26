"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface GLTFModelProps {
  path: string;
  position?: [number, number, number];
  scale?: number;
  rotation?: [number, number, number];
  animate?: "float" | "rotate" | "bob" | "none";
  animateSpeed?: number;
  tint?: string;
}

const LINE_MAT = new THREE.LineBasicMaterial({ color: "#1a1a2e", transparent: true, opacity: 0.35 });

function convertMaterial(original: THREE.Material, tint?: string): THREE.Material {
  if (original instanceof THREE.MeshToonMaterial) return original;

  let color = new THREE.Color("#e8e0d4");
  let opacity = 1;
  let transparent = false;

  // Extract color from various material types
  if (original instanceof THREE.MeshStandardMaterial ||
      original instanceof THREE.MeshPhongMaterial ||
      original instanceof THREE.MeshLambertMaterial ||
      original instanceof THREE.MeshBasicMaterial) {
    if (original.color) color = original.color.clone();
    opacity = original.opacity;
    transparent = original.transparent;
  } else if (original instanceof THREE.MeshPhysicalMaterial) {
    if (original.color) color = original.color.clone();
    opacity = original.opacity;
    transparent = original.transparent;
  } else if ("color" in original) {
    try { color = (original as any).color.clone(); } catch {}
  }

  if (tint) {
    const tintColor = new THREE.Color(tint);
    color.lerp(tintColor, 0.3);
  }

  return new THREE.MeshToonMaterial({
    color,
    transparent: transparent || opacity < 1,
    opacity,
    side: THREE.DoubleSide,
  });
}

function processMesh(mesh: THREE.Mesh, tint?: string) {
  // Convert material
  if (Array.isArray(mesh.material)) {
    mesh.material = mesh.material.map((m) => {
      const toon = convertMaterial(m, tint);
      m.dispose();
      return toon;
    });
  } else {
    const toon = convertMaterial(mesh.material, tint);
    mesh.material.dispose();
    mesh.material = toon;
  }

  mesh.castShadow = true;
  mesh.receiveShadow = true;

  // Ensure geometry has normals
  if (mesh.geometry && !mesh.geometry.attributes.normal) {
    mesh.geometry.computeVertexNormals();
  }

  // Add edge outlines
  if (mesh.geometry) {
    try {
      const edges = new THREE.EdgesGeometry(mesh.geometry, 20);
      const line = new THREE.LineSegments(edges, LINE_MAT);
      line.position.copy(mesh.position);
      line.rotation.copy(mesh.rotation);
      line.scale.copy(mesh.scale);
      line.userData.isOutline = true;
      mesh.parent?.add(line);
    } catch {}
  }
}

export default function GLTFModel({
  path,
  position = [0, 0, 0],
  scale = 1,
  rotation = [0, 0, 0],
  animate = "none",
  animateSpeed = 1,
  tint,
}: GLTFModelProps) {
  const ref = useRef<THREE.Group>(null);
  const { scene } = useGLTF(path);

  const processedScene = useMemo(() => {
    const cloned = scene.clone(true);

    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        processMesh(child, tint);
      }
    });

    // Compute bounding box for proper positioning
    const box = new THREE.Box3().setFromObject(cloned);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // Center the model at origin
    cloned.position.sub(center);

    return cloned;
  }, [scene, tint]);

  useFrame((state) => {
    if (!ref.current || animate === "none") return;
    const t = state.clock.elapsedTime * animateSpeed;
    switch (animate) {
      case "float":
        ref.current.position.y = position[1] + Math.sin(t) * 0.2;
        break;
      case "rotate":
        ref.current.rotation.y = t * 0.5;
        break;
      case "bob":
        ref.current.position.y = position[1] + Math.sin(t * 1.5) * 0.15;
        ref.current.rotation.z = Math.sin(t) * 0.05;
        break;
    }
  });

  return (
    <group ref={ref} position={position} scale={scale} rotation={rotation}>
      <primitive object={processedScene} />
    </group>
  );
}
