"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = `
  uniform float uTime;
  varying vec2 vUv;
  varying float vElevation;
  
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
  
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }
  
  void main() {
    vUv = uv;
    vec3 pos = position;
    float elevation = fbm(pos.xz * 0.3 + uTime * 0.05) * 2.0;
    elevation += fbm(pos.xz * 0.8 - uTime * 0.03) * 0.5;
    pos.y += elevation;
    vElevation = elevation;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  varying float vElevation;
  uniform float uTime;
  
  void main() {
    vec3 deep = vec3(0.05, 0.02, 0.15);
    vec3 mid = vec3(0.1, 0.05, 0.3);
    vec3 peak = vec3(0.3, 0.1, 0.5);
    vec3 glow = vec3(0.2, 0.6, 0.8);
    
    float t = (vElevation + 1.0) / 3.0;
    vec3 col = mix(deep, mid, smoothstep(0.0, 0.5, t));
    col = mix(col, peak, smoothstep(0.5, 1.0, t));
    col = mix(col, glow, smoothstep(1.5, 2.5, t) * 0.5);
    
    float pulse = sin(uTime * 0.5 + vUv.x * 6.28) * 0.1 + 0.9;
    col *= pulse;
    
    gl_FragColor = vec4(col, 0.4);
  }
`;

export default function NoiseTerrain() {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((state) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
      <planeGeometry args={[60, 60, 64, 64]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{ uTime: { value: 0 } }}
        transparent
        side={THREE.DoubleSide}
        wireframe
      />
    </mesh>
  );
}
