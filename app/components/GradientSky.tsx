"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

const vertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    float h = vDir.y;
    vec3 top = vec3(0.05, 0.03, 0.12);
    vec3 horizon = vec3(0.06, 0.05, 0.14);
    vec3 glow = vec3(0.12, 0.07, 0.20);
    vec3 col = mix(horizon, top, smoothstep(-0.05, 0.55, h));
    col += glow * exp(-abs(h) * 6.0);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function GradientSky() {
  const meshRef = useRef<THREE.Mesh>(null);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
    [],
  );

  useFrame((state) => {
    const mesh = meshRef.current;
    if (mesh) mesh.position.copy(state.camera.position);
  });

  return (
    <mesh ref={meshRef} material={material}>
      <sphereGeometry args={[900, 24, 16]} />
    </mesh>
  );
}