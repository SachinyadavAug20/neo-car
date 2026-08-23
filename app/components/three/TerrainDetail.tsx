"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    vec2 uv = vUv * 8.0;
    
    float n1 = noise(uv + uTime * 0.05);
    float n2 = noise(uv * 2.0 - uTime * 0.03);
    float n3 = noise(uv * 4.0 + uTime * 0.02);
    
    float pattern = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
    
    vec3 baseColor = vec3(0.1, 0.08, 0.2);
    vec3 glowColor = vec3(0.3, 0.6, 0.8);
    vec3 edgeColor = vec3(0.8, 0.4, 0.9);
    
    float fresnel = pow(1.0 - abs(dot(vNormal, normalize(-vPosition))), 2.0);
    
    vec3 col = mix(baseColor, glowColor, pattern * 0.5);
    col = mix(col, edgeColor, fresnel * 0.3);
    
    float pulse = sin(uTime * 0.5 + vUv.x * 3.14) * 0.1 + 0.9;
    col *= pulse;
    
    gl_FragColor = vec4(col, 0.3);
  }
`;

export default function TerrainDetail() {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((state) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[30, 30, 1]} frustumCulled={false}>
      <planeGeometry args={[1, 1, 32, 32]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{ uTime: { value: 0 } }}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
