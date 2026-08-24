"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useNarrative } from "@/app/lib/narrativeStore";

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  uniform float uTime;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec3 pos = position;
    pos.y += sin(uTime * 2.0 + position.x * 3.0) * 0.05;
    vPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    float scanline = sin(vUv.y * 50.0 + uTime * 3.0) * 0.5 + 0.5;
    scanline = smoothstep(0.3, 0.7, scanline);
    
    float fresnel = pow(1.0 - abs(dot(vNormal, normalize(-vPosition))), 3.0);
    
    float flicker = sin(uTime * 10.0) * 0.05 + 0.95;
    
    float alpha = (scanline * 0.3 + fresnel * 0.5 + 0.1) * flicker;
    
    vec3 col = uColor * (1.0 + fresnel * 0.5);
    
    gl_FragColor = vec4(col, alpha * 0.6);
  }
`;

export default function HologramEffect() {
  const { started, currentChapter } = useNarrative();
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const positions = [
    [0, 5, 0],
    [10, 7, -5],
    [-8, 6, 3],
    [5, 8, 8],
  ];

  const colors = ["#67e8f9", "#a78bfa", "#4ecdc4", "#fbbf24"];

  useFrame((state) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  if (!started) return null;

  return (
    <group ref={groupRef}>
      {positions.map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          <mesh frustumCulled={false}>
            <octahedronGeometry args={[0.8, 0]} />
            <shaderMaterial
              ref={i === 0 ? matRef : undefined}
              vertexShader={vertexShader}
              fragmentShader={fragmentShader}
              uniforms={{
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(colors[i]) },
              }}
              transparent
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          <pointLight color={colors[i]} intensity={0.3} distance={5} decay={2} />
        </group>
      ))}
    </group>
  );
}
