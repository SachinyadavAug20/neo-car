"use client";

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

const auroraVert = `
varying vec2 vUv;
varying vec3 vPos;
void main() {
  vUv = uv;
  vPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const auroraFrag = `
precision highp float;
uniform float uTime;
varying vec2 vUv;
varying vec3 vPos;

float noise(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  float t = uTime * 0.15;
  float y = vUv.y;

  float wave1 = sin(vUv.x * 4.0 + t * 2.0) * 0.3;
  float wave2 = cos(vUv.x * 6.0 + t * 1.5) * 0.2;
  float wave3 = sin(vUv.x * 2.0 - t) * 0.4;

  float curtain = smoothstep(0.0, 0.3 + wave1, y) * smoothstep(1.0, 0.6 + wave2, y);
  curtain *= 0.5 + 0.5 * sin(vUv.x * 10.0 + t * 3.0 + wave3 * 2.0);

  float n = noise(vUv * 5.0 + t);
  curtain *= 0.7 + n * 0.3;

  vec3 teal = vec3(0.3, 0.8, 0.75);
  vec3 purple = vec3(0.6, 0.4, 0.9);
  vec3 pink = vec3(0.9, 0.4, 0.6);

  float colorMix = 0.5 + 0.5 * sin(vUv.x * 3.0 + t);
  vec3 color = mix(teal, purple, colorMix);
  color = mix(color, pink, 0.3 * sin(vUv.x * 5.0 - t * 0.5));

  float alpha = curtain * 0.35;

  gl_FragColor = vec4(color, alpha);
}
`;

export default function Aurora() {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh position={[0, 40, -60]} rotation={[0.1, 0, 0]}>
      <planeGeometry args={[160, 50, 1, 32]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={auroraVert}
        fragmentShader={auroraFrag}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
