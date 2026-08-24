"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec2 uSunPos;
  varying vec2 vUv;
  
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1,0)), f.x),
      mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x),
      f.y
    );
  }
  
  void main() {
    vec2 uv = vUv;
    vec2 sunDir = normalize(uSunPos - uv);
    float sunDist = length(uSunPos - uv);
    
    float ray = 0.0;
    for (int i = 0; i < 8; i++) {
      float t = float(i) / 8.0;
      vec2 sampleUv = uv + sunDir * t * 0.5;
      float n = noise(sampleUv * 5.0 + uTime * 0.2);
      ray += n * (1.0 - t);
    }
    ray /= 8.0;
    
    float godray = ray * (1.0 - sunDist * 1.5);
    godray = max(godray, 0.0);
    godray = pow(godray, 1.5);
    
    vec3 col = vec3(0.4, 0.6, 0.8) * godray * 0.3;
    
    gl_FragColor = vec4(col, godray * 0.15);
  }
`;

export default function GodRays() {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((state) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    const x = 0.5 + Math.sin(state.clock.elapsedTime * 0.1) * 0.2;
    const y = 0.8 + Math.cos(state.clock.elapsedTime * 0.05) * 0.1;
    matRef.current.uniforms.uSunPos.value.set(x, y);
  });

  return (
    <mesh renderOrder={995}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uSunPos: { value: new THREE.Vector2(0.5, 0.8) },
        }}
        transparent
        depthTest={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
