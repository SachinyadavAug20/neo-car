"use client";

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

const WATER_SIZE = 200;

const waterVert = `
uniform float uTime;
varying vec2 vUv;
varying vec3 vWorldPos;

void main() {
  vUv = uv;
  vec3 pos = position;
  float wave1 = sin(pos.x * 0.1 + uTime * 0.5) * 0.3;
  float wave2 = cos(pos.z * 0.08 + uTime * 0.3) * 0.2;
  pos.y += wave1 + wave2;
  vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const waterFrag = `
precision highp float;
uniform float uTime;
varying vec2 vUv;
varying vec3 vWorldPos;

void main() {
  vec3 deep = vec3(0.02, 0.04, 0.12);
  vec3 surface = vec3(0.05, 0.1, 0.25);
  vec3 highlight = vec3(0.3, 0.5, 0.8);

  float fresnel = pow(1.0 - abs(dot(normalize(vec3(0.0, 1.0, 0.0)), normalize(vec3(0.0, 1.0, 0.0)))), 2.0);

  vec3 color = mix(deep, surface, 0.5 + 0.5 * sin(vWorldPos.x * 0.05 + uTime * 0.3));
  color += highlight * fresnel * 0.3;

  float shimmer = sin(vWorldPos.x * 2.0 + uTime * 1.5) * cos(vWorldPos.z * 1.5 + uTime) * 0.05;
  color += vec3(shimmer);

  gl_FragColor = vec4(color, 0.7);
}
`;

export default function Water() {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
    }),
    [],
  );

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -15, -20]}>
      <planeGeometry args={[WATER_SIZE, WATER_SIZE, 64, 64]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={waterVert}
        fragmentShader={waterFrag}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
