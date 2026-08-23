"use client";

import { useRef } from "react";
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
  uniform float uTime;
  uniform float uProgress;
  uniform vec3 uColor;
  uniform vec2 uResolution;
  varying vec2 vUv;

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
    vec2 uv = vUv;
    vec2 center = uv - 0.5;
    float dist = length(center);
    
    float t = uProgress;
    
    float ink = fbm(uv * 4.0 + uTime * 0.3);
    ink = smoothstep(0.3, 0.7, ink);
    
    float circle = smoothstep(t * 1.2, t * 1.2 - 0.3, dist + ink * 0.2);
    
    float edge = smoothstep(0.02, 0.0, abs(circle - 0.5));
    vec3 edgeColor = uColor * 2.0;
    
    vec3 col = mix(vec3(0.02, 0.03, 0.09), uColor * 0.3, circle * 0.5);
    col += edgeColor * edge * 0.5;
    
    float alpha = circle * 0.8 + edge * 0.3;
    
    gl_FragColor = vec4(col, alpha * step(0.01, t));
  }
`;

export default function InkTransition() {
  const { started, playing, currentChapter } = useNarrative();
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const progressRef = useRef(0);
  const activeRef = useRef(false);
  const timerRef = useRef(0);

  useFrame((state, delta) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value = state.clock.elapsedTime;

    if (playing) {
      if (!activeRef.current) {
        activeRef.current = true;
        progressRef.current = 0;
        timerRef.current = 0;
      }
      timerRef.current += delta;
      if (timerRef.current < 2) {
        progressRef.current = Math.min(timerRef.current / 2, 1);
      } else if (timerRef.current < 3) {
        progressRef.current = 1 - (timerRef.current - 2);
      } else {
        progressRef.current = 0;
        activeRef.current = false;
      }
    } else {
      progressRef.current *= 0.95;
    }

    matRef.current.uniforms.uProgress.value = progressRef.current;

    const chapter = [0, 1, 2, 3, 4, 5, 6, 7];
    const colors = ["#67e8f9", "#a78bfa", "#4ecdc4", "#fbbf24", "#ef4444", "#f472b6", "#c084fc", "#e2e8f0"];
    const color = new THREE.Color(colors[currentChapter % colors.length] || "#67e8f9");
    matRef.current.uniforms.uColor.value.copy(color);
  });

  if (!started) return null;

  return (
    <mesh renderOrder={998}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uProgress: { value: 0 },
          uColor: { value: new THREE.Color("#67e8f9") },
          uResolution: { value: new THREE.Vector2(1, 1) },
        }}
        transparent
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}
