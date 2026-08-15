"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import {
  RigidBody,
  CuboidCollider,
  type IntersectionEnterPayload,
} from "@react-three/rapier";
import { gameStore } from "../store/gameStore";
import { triggerGlitch } from "../lib/glitchStore";

const DAEMON_COUNT = 15;
const TRACK_START_Z = -120;
const TRACK_END_Z = -1450;
const DAEMON_X_SPREAD = 55;
const DAEMON_Y_MIN = 12;
const DAEMON_Y_MAX = 40;
const DAEMON_DRIFT_RADIUS = 18;
const DAEMON_DRIFT_SPEED = 0.4;
const DAEMON_SPIN_SPEED = 1.2;
const SCORE_PENALTY = 5;

interface DaemonData {
  position: [number, number, number];
  phase: number;
}

const DAEMONS: DaemonData[] = Array.from({ length: DAEMON_COUNT }, (_, i) => ({
  position: [
    (Math.random() * 2 - 1) * DAEMON_X_SPREAD,
    DAEMON_Y_MIN + Math.random() * (DAEMON_Y_MAX - DAEMON_Y_MIN),
    TRACK_START_Z + (i * (TRACK_END_Z - TRACK_START_Z)) / (DAEMON_COUNT - 1),
  ],
  phase: Math.random() * Math.PI * 2,
}));

export default function RogueDaemons() {
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const hitRef = useRef(new Set<number>());
  const octahedronGeometry = useMemo(
    () => new THREE.OctahedronGeometry(4, 0),
    [],
  );

  const handleHit = (index: number) => (payload: IntersectionEnterPayload) => {
    if (!payload.other.rigidBody) return;
    if (hitRef.current.has(index)) return;
    hitRef.current.add(index);

    gameStore.getState().addLog("[WARN] ROGUE_PID_COLLISION! SCORE_DUMP");
    gameStore.getState().subtractScore(SCORE_PENALTY);
    triggerGlitch();
  };

  useFrame((state, delta) => {
    const elapsed = state.clock.elapsedTime;
    for (let i = 0; i < DAEMONS.length; i++) {
      const mesh = meshRefs.current[i];
      if (!mesh) continue;
      const daemon = DAEMONS[i];
      mesh.position.x =
        daemon.position[0] +
        Math.sin(elapsed * DAEMON_DRIFT_SPEED + daemon.phase) * DAEMON_DRIFT_RADIUS;
      mesh.rotation.x += delta * DAEMON_SPIN_SPEED;
      mesh.rotation.y += delta * DAEMON_SPIN_SPEED * 0.8;
    }
  });

  return (
    <>
      {DAEMONS.map((daemon, index) => (
        <RigidBody
          key={index}
          type="kinematicPosition"
          colliders={false}
          position={daemon.position}
        >
          <mesh
            ref={(node) => {
              meshRefs.current[index] = node;
            }}
            geometry={octahedronGeometry}
          >
            <meshStandardMaterial color="#ff003c" wireframe />
          </mesh>
          <CuboidCollider
            sensor
            args={[6, 6, 6]}
            onIntersectionEnter={handleHit(index)}
          />
        </RigidBody>
      ))}
    </>
  );
}