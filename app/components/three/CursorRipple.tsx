"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
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
  uniform vec2 uCenter;
  uniform float uRadius;
  varying vec2 vUv;

  void main() {
    float dist = length(vUv - uCenter);
    float ring = abs(dist - uRadius);
    float alpha = smoothstep(0.05, 0.0, ring) * 0.3;
    float fade = smoothstep(uRadius + 0.1, uRadius - 0.1, dist);
    alpha *= fade;
    vec3 col = vec3(0.4, 0.8, 0.9);
    gl_FragColor = vec4(col, alpha);
  }
`;

export default function CursorRipple() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { pointer } = useThree();
  const radiusRef = useRef(0);
  const centerRef = useRef(new THREE.Vector2(0.5, 0.5));

  useFrame((state, delta) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    
    const cx = 0.5 + pointer.x * 0.3;
    const cy = 0.5 + pointer.y * 0.3;
    centerRef.current.lerp(new THREE.Vector2(cx, cy), 0.1);
    matRef.current.uniforms.uCenter.value.copy(centerRef.current);
    
    radiusRef.current += delta * 0.3;
    if (radiusRef.current > 0.5) radiusRef.current = 0;
    matRef.current.uniforms.uRadius.value = radiusRef.current;
  });

  return (
    <mesh renderOrder={994}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uCenter: { value: new THREE.Vector2(0.5, 0.5) },
          uRadius: { value: 0 },
        }}
        transparent
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}
