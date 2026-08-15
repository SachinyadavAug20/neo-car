"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    vec2 center = vec2(0.5, 0.5);
    float radius = distance(vUv, center);

    vec3 bottom = vec3(1.0, 0.45, 0.1);
    vec3 top = vec3(1.0, 0.15, 0.65);
    vec3 color = mix(bottom, top, clamp(vUv.y, 0.0, 1.0));

    float band = mod((vUv.y + uTime) * 14.0, 1.0);
    if (band > 0.55) {
      discard;
    }

    float glow = smoothstep(0.5, 0.15, radius);
    color *= glow;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function RetroSun() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((state) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh position={[0, 40, 450]}>
      <circleGeometry args={[120, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        uniforms={{ uTime: { value: 0 } }}
        depthWrite={false}
      />
    </mesh>
  );
}