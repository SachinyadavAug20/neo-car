"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useAppStore } from "../lib/appStore";

const VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAGMENT_SHADER = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uBass;
uniform float uMids;
uniform float uHighs;
varying vec2 vUv;

float sdCircle(vec2 p, float r) {
  return length(p) - r;
}

void main() {
  vec2 center = vec2(0.5);
  vec2 p = (vUv - center) * 2.0;

  float dist = sdCircle(p, 0.0);

  float coreRadius = 0.28 + uBass * 0.04;
  float core = 1.0 - smoothstep(coreRadius - 0.02, coreRadius + 0.02, -dist);

  float coronaInner = coreRadius + 0.03;
  float coronaOuter = 0.85 + uMids * 0.1;

  float ring = smoothstep(coronaInner, coronaInner + 0.04, -dist)
    * (1.0 - smoothstep(coronaOuter - 0.08, coronaOuter, -dist));

  float pulse = 0.85 + 0.15 * sin(uTime * 0.7 + uBass * 3.0);
  ring *= pulse;

  float distortion = sin(atan(p.y, p.x) * 8.0 + uTime * 0.5) * 0.03 * (1.0 + uHighs * 2.0);
  float distortedDist = sdCircle(p + distortion, 0.0);
  float distortedRing = smoothstep(coronaInner, coronaInner + 0.04, -distortedDist)
    * (1.0 - smoothstep(coronaOuter - 0.08, coronaOuter, -distortedDist));
  distortedRing *= pulse;

  ring = max(ring, distortedRing * 0.7);

  float rim = pow(1.0 - smoothstep(coronaOuter - 0.15, coronaOuter, -dist), 4.0);
  rim *= 0.3 + 0.2 * sin(uTime * 0.4 + dist * 15.0);

  vec3 cyanColor = vec3(0.541, 0.678, 0.957);
  vec3 mauveColor = vec3(0.737, 0.651, 0.969);

  float colorMix = 0.5 + 0.0 * sin(uTime * 0.3);
  vec3 coronaColor = mix(cyanColor, mauveColor, colorMix);

  vec3 color = coronaColor * (ring * 0.8 + rim);

  float radialFade = 1.0 - smoothstep(0.25, 0.48, length(vUv - vec2(0.5)));
  float alpha = (ring * 0.7 + rim) * radialFade * 0.9;

  gl_FragColor = vec4(color, alpha);
}
`;

export default function EclipseHorizon() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBass: { value: 0 },
      uMids: { value: 0 },
      uHighs: { value: 0 },
    }),
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
    const { bass, mids, highs } = useAppStore.getState().audioData;
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    materialRef.current.uniforms.uBass.value = bass;
    materialRef.current.uniforms.uMids.value = mids;
    materialRef.current.uniforms.uHighs.value = highs;
  });

  return (
    <group position={[0, 100, -1800]}>
      <mesh>
        <planeGeometry args={[1200, 800]} />
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
      <mesh position={[0, 0, -1]}>
        <circleGeometry args={[35, 64]} />
        <meshBasicMaterial color="#050508" />
      </mesh>
    </group>
  );
}
