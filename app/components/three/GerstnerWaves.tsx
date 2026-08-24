"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const WAVE_SEGMENTS = 100;
const WAVE_SIZE = 80;

export default function GerstnerWaves() {
  const meshRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color("#0a0e27") },
    uWaveColor: { value: new THREE.Color("#1a3a4a") },
  }), []);

  const vertexShader = `
    uniform float uTime;
    varying vec2 vUv;
    varying float vElevation;
    varying vec3 vWorldPosition;

    void main() {
      vUv = uv;
      vec3 pos = position;

      float wave1 = sin(pos.x * 0.3 + uTime * 0.8) * 0.8;
      float wave2 = sin(pos.y * 0.2 + uTime * 0.6) * 0.5;
      float wave3 = sin((pos.x + pos.y) * 0.15 + uTime * 1.2) * 0.3;
      float wave4 = cos(pos.x * 0.1 - pos.y * 0.1 + uTime * 0.4) * 0.4;

      pos.z = wave1 + wave2 + wave3 + wave4;
      vElevation = pos.z;

      vec4 worldPos = modelMatrix * vec4(pos, 1.0);
      vWorldPosition = worldPos.xyz;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    uniform vec3 uColor;
    uniform vec3 uWaveColor;
    varying vec2 vUv;
    varying float vElevation;
    varying vec3 vWorldPosition;

    void main() {
      float mixFactor = smoothstep(-1.0, 1.5, vElevation);
      vec3 color = mix(uColor, uWaveColor, mixFactor);

      float foam = smoothstep(1.0, 1.5, vElevation);
      color = mix(color, vec3(0.8, 0.9, 1.0), foam * 0.3);

      float caustic = sin(vWorldPosition.x * 2.0 + uTime) * sin(vWorldPosition.y * 2.0 + uTime * 0.7);
      color += vec3(0.05, 0.1, 0.15) * caustic * 0.2;

      gl_FragColor = vec4(color, 0.8);
    }
  `;

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <group position={[0, -12, 0]}>
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[WAVE_SIZE, WAVE_SIZE, WAVE_SEGMENTS, WAVE_SEGMENTS]} />
        <shaderMaterial
          transparent
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
