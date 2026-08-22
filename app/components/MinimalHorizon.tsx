"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

const VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAGMENT_SHADER = /* glsl */ `
uniform float uTime;
varying vec2 vUv;

void main() {
  vec2 center = vec2(0.5, 0.5);
  float dist = distance(vUv, center);

  float coreRadius = 0.18;
  float coronaInner = 0.22;
  float coronaOuter = 0.48;

  float core = 1.0 - smoothstep(coreRadius - 0.01, coreRadius + 0.01, dist);

  float pulse = 0.95 + 0.05 * sin(uTime * 0.6);
  float corona = smoothstep(coronaInner, coronaInner + 0.02, dist)
    * (1.0 - smoothstep(coronaOuter - 0.05, coronaOuter, dist));
  corona *= pulse;

  float rim = pow(1.0 - smoothstep(coronaOuter - 0.08, coronaOuter, dist), 3.0);
  rim *= 0.4 + 0.15 * sin(uTime * 0.4 + dist * 12.0);

  vec3 innerColor = vec3(0.737, 0.651, 0.969);
  vec3 outerColor = vec3(0.541, 0.678, 0.957);
  vec3 coronaColor = mix(innerColor, outerColor, dist * 2.0);

  vec3 color = coronaColor * (corona * 0.7 + rim);
  float alpha = max(corona, rim) * 0.85;

  alpha *= smoothstep(0.5, 0.42, dist);

  gl_FragColor = vec4(color, alpha);
}
`;

export default function MinimalHorizon() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 } }),
    [],
  );

  useEffect(() => {
    const material = materialRef.current;
    return () => {
      if (material) material.dispose();
    };
  }, []);

  useFrame((state) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <group position={[0, 55, -800]}>
      <mesh>
        <circleGeometry args={[180, 64]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={VERTEX_SHADER}
          fragmentShader={FRAGMENT_SHADER}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0, 1]}>
        <circleGeometry args={[20, 64]} />
        <meshBasicMaterial color="#050508" />
      </mesh>
    </group>
  );
}
