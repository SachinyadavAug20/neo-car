"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useAudioAnalyzer } from "../hooks/useAudioAnalyzer";

const GRID_WIDTH = 220;
const GRID_DEPTH = 1600;
const GRID_CHUNK = 400;
const GRID_Y = -2;

const GRID_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uZOffset;
  uniform float uAmplitude;

  varying vec2 vUv;
  varying float vElevation;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.y),
      u.y
    );
  }

  void main() {
    vUv = uv;
    vec3 pos = position;

    float worldZ = pos.z + uZOffset;
    float dist = length(vec2(pos.x, worldZ * 0.1));

    float wave = sin(worldZ * 0.045 + uTime * 0.8) * 1.0;
    wave += sin(worldZ * 0.012 + uTime * 0.5) * 1.4;
    wave += sin(worldZ * 0.14 + uTime * 1.2) * 0.35;

    float amplitude = 1.0 + uAmplitude * 1.4;
    pos.y = ${GRID_Y}.0 + wave * amplitude * smoothstep(220.0, 40.0, dist);

    vElevation = wave;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const GRID_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uColor;
  uniform float uAmplitude;
  uniform float uKick;

  varying vec2 vUv;
  varying float vElevation;

  void main() {
    float grid = 0.0;

    float gx = abs(fract(vUv.x * 30.0 - 0.5) - 0.5) / fwidth(vUv.x * 30.0);
    float gy = abs(fract(vUv.y * 60.0 - 0.5) - 0.5) / fwidth(vUv.y * 60.0);
    grid += 1.0 - min(gx, 1.0);
    grid += 1.0 - min(gy, 1.0);

    float glow = 0.35 + vElevation * 0.2;
    float kickBoost = uKick * 0.22;
    vec3 finalColor = uColor * (grid * glow) + vec3(kickBoost);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

const GRID_UNIFORMS = {
  uTime: { value: 0 },
  uZOffset: { value: 0 },
  uAmplitude: { value: 0.35 },
  uKick: { value: 0 },
  uColor: { value: new THREE.Color("#7dc4e4") },
};

export default function GridFloor() {
  const groupRef = useRef<THREE.Group>(null);
  const lastChunkRef = useRef<number | null>(null);
  const { getFrequencies } = useAudioAnalyzer();

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(GRID_WIDTH, GRID_DEPTH, 64, 128);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: GRID_UNIFORMS,
        vertexShader: GRID_VERTEX_SHADER,
        fragmentShader: GRID_FRAGMENT_SHADER,
        transparent: true,
        depthWrite: false,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((state) => {
    const group = groupRef.current;
    const cameraZ = state.camera.position.z;
    const chunk = Math.round(cameraZ / GRID_CHUNK);
    if (group && lastChunkRef.current !== chunk) {
      lastChunkRef.current = chunk;
      group.position.z = chunk * GRID_CHUNK;
    }

    GRID_UNIFORMS.uZOffset.value = chunk * GRID_CHUNK;
    GRID_UNIFORMS.uTime.value = state.clock.elapsedTime;
    const [bass] = getFrequencies();
    GRID_UNIFORMS.uAmplitude.value = 0.25 + bass * 1.0;
    GRID_UNIFORMS.uKick.value = bass;
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry} material={material} />
    </group>
  );
}