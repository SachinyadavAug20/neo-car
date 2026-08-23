"use client";

import { useRef, useMemo } from "react";
import { useFrame, extend } from "@react-three/fiber";
import * as THREE from "three";
import { useNarrative } from "@/app/lib/narrativeStore";

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uActive;
  varying vec2 vUv;

  void main() {
    vec2 center = vUv - 0.5;
    float dist = length(center);
    
    float ripple = sin(dist * 20.0 - uTime * 3.0) * 0.5 + 0.5;
    ripple *= exp(-dist * 3.0);
    ripple *= uIntensity * uActive;
    
    float ring = smoothstep(0.02, 0.0, abs(dist - 0.3 - sin(uTime) * 0.1));
    
    vec3 col = uColor * (ripple * 0.3 + ring * 0.5);
    float alpha = (ripple + ring) * uActive * 0.4;
    
    gl_FragColor = vec4(col, alpha);
  }
`;

export default function RippleOverlay() {
  const { started, playing, storyTextVisible } = useNarrative();
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    matRef.current.uniforms.uActive.value = storyTextVisible ? 1 : 0;
  });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color("#4ecdc4") },
      uIntensity: { value: 1.0 },
      uActive: { value: 0 },
    }),
    [],
  );

  if (!started) return null;

  return (
    <mesh ref={meshRef} renderOrder={999}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthTest={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
