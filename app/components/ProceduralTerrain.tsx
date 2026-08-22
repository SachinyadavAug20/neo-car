"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useAudioAnalyzer } from "../hooks/useAudioAnalyzer";
import { useAppStore, THEMES } from "../lib/appStore";

const TERRAIN_WIDTH = 300;
const TERRAIN_DEPTH = 4000;
const TERRAIN_SEGMENTS_X = 128;
const TERRAIN_SEGMENTS_Z = 512;
const TERRAIN_CHUNK = 600;
const HIGHWAY_WIDTH = 100;
const HIGHWAY_Y = 0.15;

const tmpEmissiveColor = new THREE.Color();

const OBSIDIAN_VERT = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uZOffset;
uniform float uAmplitude;
uniform float uSpeed;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec2 vUv;
varying float vElevation;

#include <fog_pars_vertex>

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  vec3 shift = vec3(100.0);
  for (int i = 0; i < 4; i++) {
    v += a * snoise(p);
    p = p * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec3 pos = position;
  vUv = uv;

  float worldZ = pos.z + uZOffset;
  float t = uTime * 0.35 * uSpeed;

  vec3 noiseCoord = vec3(pos.x * 0.015, worldZ * 0.008, t);
  float elevation = fbm(noiseCoord) * 4.0 * uAmplitude;

  float secondaryWave = sin(worldZ * 0.02 + t * 1.5) * 0.8 * uAmplitude;
  secondaryWave += sin(pos.x * 0.03 + t * 0.7) * 0.5 * uAmplitude;

  pos.y += elevation + secondaryWave;

  vec3 eps = vec3(0.05, 0.0, 0.0);
  vec3 epsZ = vec3(0.0, 0.0, 0.05);
  float hx = fbm(vec3((pos.x + eps.x) * 0.015, worldZ * 0.008, t)) * 4.0 * uAmplitude;
  float hz = fbm(vec3(pos.x * 0.015, (worldZ + epsZ.z) * 0.008, t)) * 4.0 * uAmplitude;
  vNormal = normalize(vec3(elevation - hx, 0.05, elevation - hz));

  vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
  vElevation = elevation;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  #include <fog_vertex>
}
`;

const OBSIDIAN_FRAG = /* glsl */ `
precision highp float;

uniform vec3 uTime;
uniform float uAmplitude;
uniform float uKick;
uniform vec3 uCameraPos;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec2 vUv;
varying float vElevation;

#include <fog_pars_fragment>

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

void main() {
  vec3 viewDir = normalize(uCameraPos - vWorldPos);
  vec3 normal = normalize(vNormal);

  float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);

  vec3 deepBlack = vec3(0.012, 0.012, 0.02);
  vec3 obsidianBase = vec3(0.035, 0.035, 0.06);
  vec3 highlight = vec3(0.18, 0.22, 0.38);

  float wave = snoise(vec3(vWorldPos.xz * 0.02, uTime.x * 0.2));
  float detail = snoise(vec3(vWorldPos.xz * 0.08, uTime.x * 0.5)) * 0.5 + 0.5;

  vec3 baseColor = mix(deepBlack, obsidianBase, 0.5 + 0.5 * wave);
  baseColor = mix(baseColor, highlight, fresnel * 0.6);

  float specular = pow(max(dot(reflect(-viewDir, normal), vec3(0.0, 1.0, 0.0)), 0.0), 32.0);
  baseColor += vec3(0.12, 0.15, 0.28) * specular * 0.8;

  float gridGlow = 0.0;
  float gx = abs(fract(vUv.x * 80.0 - 0.5) - 0.5) / fwidth(vUv.x * 80.0);
  float gy = abs(fract(vUv.y * 120.0 - 0.5) - 0.5) / fwidth(vUv.y * 120.0);
  gridGlow = (1.0 - min(gx, 1.0)) + (1.0 - min(gy, 1.0));
  gridGlow *= 0.08;
  vec3 gridColor = vec3(0.28, 0.35, 0.62) * gridGlow;

  float kickPulse = uKick * 0.15;
  vec3 emissive = vec3(0.08, 0.12, 0.25) * kickPulse;

  vec3 finalColor = baseColor + gridColor + emissive;
  float alpha = 1.0;

  gl_FragColor = vec4(finalColor, alpha);
  #include <fog_fragment>
}
`;

const OBSIDIAN_UNIFORMS: Record<string, THREE.IUniform> = {
  uTime: { value: 0 },
  uZOffset: { value: 0 },
  uAmplitude: { value: 0.4 },
  uSpeed: { value: 1.0 },
  uKick: { value: 0 },
  uCameraPos: { value: new THREE.Vector3() },
  fogColor: { value: new THREE.Color("#0b0f19") },
  fogDensity: { value: 0.003 },
  fogNear: { value: 1 },
  fogFar: { value: 2500 },
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

  const obsidianMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: OBSIDIAN_UNIFORMS,
        vertexShader: OBSIDIAN_VERT,
        fragmentShader: OBSIDIAN_FRAG,
        fog: true,
        side: THREE.DoubleSide,
      }),
    [],
  );

  const highwayGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(HIGHWAY_WIDTH, TERRAIN_DEPTH, 1, 1);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  const highwayMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#030308",
        metalness: 0.95,
        roughness: 0.03,
        clearcoat: 1,
        clearcoatRoughness: 0.02,
        envMapIntensity: 2.0,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      obsidianMaterial.dispose();
      highwayGeometry.dispose();
      highwayMaterial.dispose();
    };
  }, [geometry, obsidianMaterial, highwayGeometry, highwayMaterial]);

  useFrame((state) => {
    const group = groupRef.current;
    const cameraZ = state.camera.position.z;
    if (group) {
      const chunk = Math.round(cameraZ / TERRAIN_CHUNK);
      if (lastChunkRef.current !== chunk) {
        lastChunkRef.current = chunk;
        group.position.z = chunk * TERRAIN_CHUNK;
      }
      OBSIDIAN_UNIFORMS.uZOffset.value = group.position.z;
    }

    const [bass] = getFrequencies();
    const scrollVelocity = useAppStore.getState().scrollVelocity;
    const theme = THEMES.midnight;

    OBSIDIAN_UNIFORMS.uTime.value = state.clock.elapsedTime;
    OBSIDIAN_UNIFORMS.uAmplitude.value = 0.3 + bass * 1.2;
    OBSIDIAN_UNIFORMS.uSpeed.value = 1.0 + Math.abs(scrollVelocity) * 0.01;
    OBSIDIAN_UNIFORMS.uKick.value = bass;
    OBSIDIAN_UNIFORMS.uCameraPos.value.copy(state.camera.position);
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry} material={obsidianMaterial} />
      <mesh
        geometry={highwayGeometry}
        material={highwayMaterial}
        position={[0, HIGHWAY_Y, 0]}
      />
    </group>
  );
}
