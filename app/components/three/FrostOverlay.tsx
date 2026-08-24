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
  uniform float uTime;
  uniform float uFrost;
  uniform vec2 uCursor;
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
    for (int i = 0; i < 4; i++) {
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
    float angle = atan(center.y, center.x);
    
    float frost = fbm(uv * 6.0 + uTime * 0.1);
    frost = smoothstep(0.3, 0.8, frost);
    
    float edge = smoothstep(0.3, 0.5, dist);
    edge *= frost;
    
    float crystal = fbm(uv * 12.0 - uTime * 0.05);
    crystal = smoothstep(0.4, 0.7, crystal);
    
    float cursorDist = length(uv - uCursor);
    float cursorFrost = smoothstep(0.3, 0.0, cursorDist) * 0.3;
    
    float alpha = (edge * 0.6 + crystal * edge * 0.3 + cursorFrost) * uFrost;
    
    vec3 col = vec3(0.85, 0.95, 1.0);
    col += crystal * 0.15;
    
    gl_FragColor = vec4(col, alpha);
  }
`;

export default function FrostOverlay() {
  const { started, currentBeat } = useNarrative();
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uFrost: { value: 0.05 },
    uCursor: { value: new THREE.Vector2(0.5, 0.5) },
  }), []);

  const targetFrost = useMemo(() => {
    if (currentBeat === 2 || currentBeat === 5) return 0.4;
    if (currentBeat === 7) return 0.6;
    return 0.05;
  }, [currentBeat]);

  const frostRef = useRef(0.05);

  useFrame((state, delta) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    frostRef.current += (targetFrost - frostRef.current) * delta * 2;
    matRef.current.uniforms.uFrost.value = frostRef.current;
    matRef.current.uniforms.uCursor.value.set(mouseRef.current.x, mouseRef.current.y);
  });

  useFrame((state) => {
    mouseRef.current.x = 0.5 + state.pointer.x * 0.3;
    mouseRef.current.y = 0.5 + state.pointer.y * 0.3;
  });

  if (!started) return null;

  return (
    <mesh renderOrder={997}>
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
