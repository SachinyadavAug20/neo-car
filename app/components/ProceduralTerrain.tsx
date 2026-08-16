"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useAudioAnalyzer } from "../hooks/useAudioAnalyzer";

const TERRAIN_WIDTH = 200;
const TERRAIN_DEPTH = 1600;
const TERRAIN_SEGMENTS_X = 32;
const TERRAIN_SEGMENTS_Z = 48;
const TERRAIN_CHUNK = 400;

const TERRAIN_VERTEX_SHADER = `
  uniform float uTime;
  uniform float uZOffset;
  uniform float uAmplitude;

  varying float vElevation;

  #include <fog_pars_vertex>

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

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 2; i++) {
      value += amplitude * noise(p);
      p = p * 2.02 + vec2(17.0, 13.0);
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec3 pos = position;

    float worldZ = pos.z + uZOffset;
    vec2 coord = vec2(pos.x * 0.04, worldZ * 0.04);
    coord += vec2(uTime * 0.03, uTime * 0.018);

    float h = fbm(coord);
    float amp = 3.0 + uAmplitude * 3.5;
    pos.y += (h - 0.45) * amp;

    vElevation = h;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    #include <fog_vertex>
  }
`;

const TERRAIN_BASE_FRAGMENT = `
  uniform vec3 uBaseColor;

  varying float vElevation;

  #include <fog_pars_fragment>

  void main() {
    vec3 color = uBaseColor * (0.92 + vElevation * 0.18);
    gl_FragColor = vec4(color, 1.0);
    #include <fog_fragment>
  }
`;

const TERRAIN_WIRE_FRAGMENT = `
  uniform vec3 uColor;
  uniform float uKick;

  varying float vElevation;

  #include <fog_pars_fragment>

  void main() {
    float glow = 0.55 + vElevation * 0.9;
    float kickBoost = uKick * 2.5;
    vec3 finalColor = uColor * glow + vec3(kickBoost);
    gl_FragColor = vec4(finalColor, 1.0);
    #include <fog_fragment>
  }
`;

const TERRAIN_UNIFORMS = {
  uTime: { value: 0 },
  uZOffset: { value: 0 },
  uAmplitude: { value: 0.35 },
  uKick: { value: 0 },
  uColor: { value: new THREE.Color("#8aadf4") },
  uBaseColor: { value: new THREE.Color("#0b0f19") },
  fogColor: { value: new THREE.Color("#0b0f19") },
  fogDensity: { value: 0.003 },
  fogNear: { value: 1 },
  fogFar: { value: 2000 },
};

export default function ProceduralTerrain() {
  const groupRef = useRef<THREE.Group>(null);
  const lastChunkRef = useRef<number | null>(null);
  const { getFrequencies } = useAudioAnalyzer();

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      TERRAIN_WIDTH,
      TERRAIN_DEPTH,
      TERRAIN_SEGMENTS_X,
      TERRAIN_SEGMENTS_Z,
    );
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  const solidMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: TERRAIN_UNIFORMS,
        vertexShader: TERRAIN_VERTEX_SHADER,
        fragmentShader: TERRAIN_BASE_FRAGMENT,
        fog: true,
      }),
    [],
  );

  const wireMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: TERRAIN_UNIFORMS,
        vertexShader: TERRAIN_VERTEX_SHADER,
        fragmentShader: TERRAIN_WIRE_FRAGMENT,
        wireframe: true,
        fog: true,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      solidMaterial.dispose();
      wireMaterial.dispose();
    };
  }, [geometry, solidMaterial, wireMaterial]);

  useFrame((state) => {
    const group = groupRef.current;
    const cameraZ = state.camera.position.z;
    if (group) {
      const chunk = Math.round(cameraZ / TERRAIN_CHUNK);
      if (lastChunkRef.current !== chunk) {
        lastChunkRef.current = chunk;
        group.position.z = chunk * TERRAIN_CHUNK;
      }
      TERRAIN_UNIFORMS.uZOffset.value = group.position.z;
    }

    TERRAIN_UNIFORMS.uTime.value = state.clock.elapsedTime;
    const [bass] = getFrequencies();
    TERRAIN_UNIFORMS.uAmplitude.value = 0.3 + bass * 1.4;
    TERRAIN_UNIFORMS.uKick.value = bass;
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry} material={solidMaterial} />
      <mesh geometry={geometry} material={wireMaterial} />
    </group>
  );
}