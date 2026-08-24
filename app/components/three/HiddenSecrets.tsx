"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { useNarrative } from "@/app/lib/narrativeStore";
import { useEffect } from "react";

const SECRETS = [
  { pos: [10, 0, 5] as [number, number, number], trigger: "click", message: "The void remembers you." },
  { pos: [40, -3, -15] as [number, number, number], trigger: "hover", message: "Growth is inevitable." },
  { pos: [-25, -6, -30] as [number, number, number], trigger: "click", message: "Loss makes room for light." },
  { pos: [20, -10, -45] as [number, number, number], trigger: "hover", message: "You are the story." },
  { pos: [0, 5, -10] as [number, number, number], trigger: "click", message: "Type 'drift' to unlock a secret." },
];

export default function HiddenSecrets() {
  const { started } = useNarrative();
  const [foundSecrets, setFoundSecrets] = useState<Set<number>>(new Set());
  const [activeSecret, setActiveSecret] = useState<number | null>(null);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useFrame((state) => {
    if (!started) return;
    const t = state.clock.elapsedTime;
    refs.current.forEach((ref, i) => {
      if (ref && !foundSecrets.has(i)) {
        ref.rotation.y = t * 0.5 + i;
        ref.rotation.x = Math.sin(t * 0.3 + i) * 0.3;
        const pulse = 0.8 + Math.sin(t * 2 + i * 3) * 0.2;
        ref.scale.setScalar(pulse);
      }
    });
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const revealSecret = (i: number) => {
    setFoundSecrets((prev) => new Set([...prev, i]));
    setActiveSecret(i);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setActiveSecret(null), 4000);
  };

  if (!started) return null;

  return (
    <>
      {SECRETS.map((secret, i) => (
        <group key={i} position={secret.pos}>
          {!foundSecrets.has(i) ? (
            <mesh
              ref={(el) => { refs.current[i] = el; }}
              onClick={(e) => {
                if (secret.trigger === "click") {
                  e.stopPropagation();
                  revealSecret(i);
                }
              }}
              onPointerEnter={() => {
                if (secret.trigger === "hover") {
                  revealSecret(i);
                }
              }}
            >
              <dodecahedronGeometry args={[0.15, 0]} />
              <meshStandardMaterial
                color="#fbbf24"
                emissive="#fbbf24"
                emissiveIntensity={1}
                transparent
                opacity={0.3}
                wireframe
              />
            </mesh>
          ) : (
            <mesh>
              <dodecahedronGeometry args={[0.1, 0]} />
              <meshBasicMaterial color="#fbbf24" transparent opacity={0.1} />
            </mesh>
          )}
        </group>
      ))}

      {activeSecret !== null && (
        <Html center position={[0, 12, 0]} distanceFactor={20}>
          <div className="glass rounded-xl px-6 py-4 max-w-sm animate-fadeIn pointer-events-none text-center">
            <div className="text-[10px] tracking-[0.5em] text-amber-400/60 uppercase mb-2">Secret Found</div>
            <div className="text-sm text-white/50 italic">&ldquo;{SECRETS[activeSecret].message}&rdquo;</div>
            <div className="mt-2 text-[10px] text-white/20">{foundSecrets.size} / {SECRETS.length} secrets</div>
          </div>
        </Html>
      )}
    </>
  );
}
