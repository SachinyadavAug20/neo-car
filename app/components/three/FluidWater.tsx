"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ─── FBM Noise (Fractional Brownian Motion) ──────────────────────────

const FBM_NOISE_GLSL = /* glsl */ `
  // Simplex-like hash
  vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(dot(hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
          dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
      mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
          dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    return value;
  }
`;

// ─── Water Material with FBM Displacement ─────────────────────────────

const waterVertexShader = /* glsl */ `
  ${FBM_NOISE_GLSL}

  uniform float uTime;
  uniform float uWaveHeight;
  uniform float uWaveFrequency;
  varying vec2 vUv;
  varying float vElevation;
  varying vec3 vWorldPos;

  void main() {
    vUv = uv;
    vec3 pos = position;

    // Multi-layered wave displacement using FBM
    float wave1 = fbm(pos.xz * uWaveFrequency + uTime * 0.3) * uWaveHeight;
    float wave2 = fbm(pos.xz * uWaveFrequency * 2.0 - uTime * 0.5) * uWaveHeight * 0.5;
    float wave3 = sin(pos.x * 2.0 + uTime * 1.5) * cos(pos.z * 1.5 + uTime * 0.8) * uWaveHeight * 0.3;

    pos.y += wave1 + wave2 + wave3;
    vElevation = pos.y;

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPos.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const waterFragmentShader = /* glsl */ `
  ${FBM_NOISE_GLSL}

  uniform float uTime;
  uniform vec3 uColorDeep;
  uniform vec3 uColorShallow;
  uniform float uOpacity;
  varying vec2 vUv;
  varying float vElevation;
  varying vec3 vWorldPos;

  void main() {
    // Dynamic color based on depth and position
    float depth = smoothstep(-0.3, 0.3, vElevation);
    vec3 color = mix(uColorDeep, uColorShallow, depth);

    // Foam at peaks
    float foam = smoothstep(0.15, 0.25, vElevation);
    color = mix(color, vec3(1.0), foam * 0.6);

    // Subtle caustic pattern
    float caustic = fbm(vWorldPos.xz * 3.0 + uTime * 0.2);
    caustic = smoothstep(0.3, 0.7, caustic);
    color += vec3(0.05, 0.08, 0.12) * caustic;

    // Edge fade
    float edgeFade = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x)
                   * smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);

    gl_FragColor = vec4(color, uOpacity * edgeFade);
  }
`;

// ─── Fluid Water Component ────────────────────────────────────────────

interface FluidWaterProps {
  position: [number, number, number];
  radius?: number;
  segments?: number;
  waveHeight?: number;
  waveFrequency?: number;
  colorDeep?: string;
  colorShallow?: string;
  opacity?: number;
}

export default function FluidWater({
  position,
  radius = 3,
  segments = 48,
  waveHeight = 0.08,
  waveFrequency = 1.5,
  colorDeep = "#1e40af",
  colorShallow = "#7dd3fc",
  opacity = 0.7,
}: FluidWaterProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uWaveHeight: { value: waveHeight },
    uWaveFrequency: { value: waveFrequency },
    uColorDeep: { value: new THREE.Color(colorDeep) },
    uColorShallow: { value: new THREE.Color(colorShallow) },
    uOpacity: { value: opacity },
  }), []);

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={position}>
      <circleGeometry args={[radius, segments]} />
      <shaderMaterial
        vertexShader={waterVertexShader}
        fragmentShader={waterFragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
