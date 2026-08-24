"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
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
  uniform sampler2D tDiffuse;
  uniform float uTime;
  uniform float uFocus;
  uniform float uBlur;
  varying vec2 vUv;

  vec3 blur(vec2 uv, float amount) {
    vec2 texel = vec2(1.0) / vec2(textureSize(tDiffuse, 0));
    vec3 col = vec3(0.0);
    float total = 0.0;
    
    for (int x = -4; x <= 4; x++) {
      for (int y = -4; y <= 4; y++) {
        float weight = 1.0 - length(vec2(float(x), float(y))) / 5.66;
        weight = max(weight, 0.0);
        weight *= weight;
        col += texture2D(tDiffuse, uv + vec2(float(x), float(y)) * texel * amount).rgb * weight;
        total += weight;
      }
    }
    return col / total;
  }

  void main() {
    vec4 col = texture2D(tDiffuse, vUv);
    
    float dist = abs(vUv.y - uFocus);
    float blurAmount = dist * uBlur;
    blurAmount = min(blurAmount, 3.0);
    
    vec3 blurred = blur(vUv, blurAmount);
    
    float bokeh = blurAmount * 0.1;
    bokeh = bokeh * bokeh;
    
    vec3 result = mix(col.rgb, blurred, blurAmount * 0.5);
    result += col.rgb * bokeh * 0.3;
    
    float grain = (fract(sin(dot(vUv * uTime * 100.0, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.03;
    result += grain;
    
    gl_FragColor = vec4(result, col.a);
  }
`;

export default function DepthOfField() {
  const { started, mood } = useNarrative();
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uFocus: { value: 0.5 },
    uBlur: { value: 0.4 },
  }), []);

  useFrame((state) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    const targetFocus = mood === "wonder" ? 0.3 : mood === "loss" ? 0.7 : 0.5;
    const current = matRef.current.uniforms.uFocus.value;
    matRef.current.uniforms.uFocus.value += (targetFocus - current) * 0.02;
    matRef.current.uniforms.uBlur.value = mood === "loss" ? 0.8 : 0.4;
  });

  if (!started) return null;

  return (
    <mesh renderOrder={996}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}
