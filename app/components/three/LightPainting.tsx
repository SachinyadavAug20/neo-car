"use client";

import { useRef, useCallback, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useNarrative } from "@/app/lib/narrativeStore";

const MAX_TRAILS = 30;
const TRAIL_POINTS = 20;

interface Trail {
  points: THREE.Vector3[];
  color: THREE.Color;
  life: number;
  maxLife: number;
}

export default function LightPainting() {
  const { started } = useNarrative();
  const { pointer } = useThree();
  const trailsRef = useRef<Trail[]>([]);
  const activeTrail = useRef<Trail | null>(null);
  const drawing = useRef(false);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  const handlePointerDown = useCallback(() => {
    if (!started) return;
    drawing.current = true;
    activeTrail.current = {
      points: [],
      color: new THREE.Color().setHSL(Math.random(), 0.7, 0.6),
      life: 3,
      maxLife: 3,
    };
  }, [started]);

  const handlePointerUp = useCallback(() => {
    drawing.current = false;
    if (activeTrail.current && activeTrail.current.points.length > 2) {
      trailsRef.current.push(activeTrail.current);
      if (trailsRef.current.length > MAX_TRAILS) {
        trailsRef.current.shift();
      }
    }
    activeTrail.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [handlePointerDown, handlePointerUp]);

  useFrame((state, delta) => {
    if (!started) return;
    timeRef.current += delta;

    if (drawing.current && activeTrail.current) {
      const point = new THREE.Vector3(
        pointer.x * 20 + Math.sin(state.clock.elapsedTime * 0.3) * 5,
        pointer.y * 8 + 3,
        pointer.y * -15 - 10,
      );
      if (activeTrail.current.points.length < TRAIL_POINTS) {
        activeTrail.current.points.push(point);
      }
    }

    trailsRef.current.forEach((trail) => {
      trail.life -= delta;
    });
    trailsRef.current = trailsRef.current.filter((t) => t.life > 0);

    if (meshRef.current) {
      const dummy = new THREE.Object3D();
      const col = new THREE.Color();
      let idx = 0;
      const maxInstances = MAX_TRAILS * TRAIL_POINTS;

      for (const trail of trailsRef.current) {
        for (let i = 0; i < trail.points.length && idx < maxInstances; i++) {
          const p = trail.points[i];
          dummy.position.set(
            p.x + Math.sin(timeRef.current + idx * 0.1) * 0.05,
            p.y + Math.sin(timeRef.current * 0.5 + idx * 0.2) * 0.05,
            p.z,
          );
          const lifeRatio = trail.life / trail.maxLife;
          const pointRatio = i / trail.points.length;
          const scale = lifeRatio * pointRatio * 0.06;
          dummy.scale.setScalar(Math.max(0.01, scale));
          dummy.updateMatrix();
          meshRef.current.setMatrixAt(idx, dummy.matrix);
          col.copy(trail.color).multiplyScalar(lifeRatio);
          meshRef.current.setColorAt(idx, col);
          idx++;
        }
      }

      for (; idx < maxInstances; idx++) {
        dummy.position.set(0, -100, 0);
        dummy.scale.setScalar(0.001);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(idx, dummy.matrix);
      }

      meshRef.current.instanceMatrix.needsUpdate = true;
      if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  if (!started) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_TRAILS * TRAIL_POINTS]} frustumCulled={false}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial transparent opacity={0.6} />
    </instancedMesh>
  );
}
