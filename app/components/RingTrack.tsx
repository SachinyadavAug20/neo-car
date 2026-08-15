"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import {
  RigidBody,
  CuboidCollider,
  type RapierRigidBody,
  type IntersectionEnterPayload,
} from "@react-three/rapier";
import { gameStore } from "../store/gameStore";

const RING_COUNT = 30;
const RING_START_Z = 50;
const RING_END_Z = 1500;
const RING_X_SPREAD = 55;
const RING_Y_MIN = 8;
const RING_Y_MAX = 38;
const RING_SPACING = (RING_END_Z - RING_START_Z) / (RING_COUNT - 1);
const RING_RESPAWN_MARGIN = 20;
const RING_LOOP_AHEAD = 1500;
const PARTICLE_POOL_SIZE = 300;
const VOXELS_PER_RING = 24;
const PARTICLE_SPEED_MIN = 8;
const PARTICLE_SPEED_MAX = 22;
const PARTICLE_DECAY = 2.0;
const PARTICLE_DEATH_SCALE = 0.05;

interface RingData {
  position: [number, number, number];
}

interface ParticleState {
  alive: boolean;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  scale: number;
}

const RINGS: RingData[] = Array.from({ length: RING_COUNT }, (_, i) => ({
  position: [
    (Math.random() * 2 - 1) * RING_X_SPREAD,
    RING_Y_MIN + Math.random() * (RING_Y_MAX - RING_Y_MIN),
    RING_START_Z + i * RING_SPACING,
  ],
}));

function createParticlePool(size: number): ParticleState[] {
  const pool: ParticleState[] = [];
  for (let i = 0; i < size; i++) {
    pool.push({
      alive: false,
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      scale: 0,
    });
  }
  return pool;
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export default function RingTrack() {
  const collectedRef = useRef(new Set<number>());
  const ringMeshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const ringBodyRefs = useRef<(RapierRigidBody | null)[]>([]);
  const teleportCountRef = useRef<number[]>([]);
  const instancedRef = useRef<THREE.InstancedMesh>(null);
  const freeIndicesRef = useRef<number[] | null>(null);
  const particlesRef = useRef<ParticleState[] | null>(null);

  const icosahedronGeometry = useMemo(
    () => new THREE.IcosahedronGeometry(6, 0),
    [],
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmpDirection = useMemo(() => new THREE.Vector3(), []);

  useLayoutEffect(() => {
    particlesRef.current = createParticlePool(PARTICLE_POOL_SIZE);
    freeIndicesRef.current = Array.from(
      { length: PARTICLE_POOL_SIZE },
      (_, i) => i,
    );

    const instanced = instancedRef.current;
    if (!instanced) return;
    dummy.position.set(0, 0, 0);
    dummy.scale.setScalar(0);
    dummy.updateMatrix();
    for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
      instanced.setMatrixAt(i, dummy.matrix);
    }
    instanced.instanceMatrix.needsUpdate = true;
  }, [dummy]);

  const collectRing = (index: number) => (payload: IntersectionEnterPayload) => {
    if (collectedRef.current.has(index)) return;
    if (!payload.other.rigidBody) return;
    collectedRef.current.add(index);

    gameStore.getState().incrementScore();
    const address = 0x4f000 + index * 0x1000;
    gameStore.getState().addLog(
      `[SYS] RING_COLLECTED at 0x${address.toString(16).toUpperCase()}`,
    );

    const mesh = ringMeshRefs.current[index];
    if (mesh) mesh.visible = false;

    const [ringX, ringY, ringZ] = RINGS[index].position;
    const free = freeIndicesRef.current;
    const pool = particlesRef.current;
    if (!free || !pool) return;
    let spawned = 0;
    while (spawned < VOXELS_PER_RING && free.length > 0) {
      const particleIndex = free.pop();
      if (particleIndex === undefined) break;
      const particle = pool[particleIndex];
      tmpDirection
        .set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
        .normalize();
      particle.position.set(ringX, ringY, ringZ);
      particle.velocity
        .copy(tmpDirection)
        .multiplyScalar(
          PARTICLE_SPEED_MIN + Math.random() * (PARTICLE_SPEED_MAX - PARTICLE_SPEED_MIN),
        );
      particle.scale = 0.8 + Math.random() * 1.4;
      particle.alive = true;
      spawned++;
    }
  };

  useFrame((state, delta) => {
    const cameraZ = state.camera.position.z;
    for (let i = 0; i < RING_COUNT; i++) {
      const body = ringBodyRefs.current[i];
      if (!body) continue;
      if (body.translation().z < cameraZ - RING_RESPAWN_MARGIN) {
        teleportCountRef.current[i] = (teleportCountRef.current[i] ?? 0) + 1;
        const seed = i * 1000 + teleportCountRef.current[i];
        const randomX = (pseudoRandom(seed) * 2 - 1) * RING_X_SPREAD;
        const randomY =
          RING_Y_MIN + pseudoRandom(seed + 0.5) * (RING_Y_MAX - RING_Y_MIN);
        body.setNextKinematicTranslation({
          x: randomX,
          y: randomY,
          z: cameraZ + RING_LOOP_AHEAD,
        });
        collectedRef.current.delete(i);
        const mesh = ringMeshRefs.current[i];
        if (mesh) mesh.visible = true;
      }
    }

    const instanced = instancedRef.current;
    if (!instanced) return;
    const pool = particlesRef.current;
    const free = freeIndicesRef.current;
    if (!pool || !free) return;

    const elapsed = state.clock.elapsedTime;
    for (let i = 0; i < pool.length; i++) {
      const particle = pool[i];
      if (particle.alive) {
        particle.position.addScaledVector(particle.velocity, delta);
        particle.velocity.multiplyScalar(0.97);
        particle.scale -= PARTICLE_DECAY * delta;
        if (particle.scale <= PARTICLE_DEATH_SCALE) {
          particle.alive = false;
          particle.scale = 0;
          free.push(i);
        }
        dummy.position.copy(particle.position);
        dummy.scale.setScalar(particle.scale);
        if (particle.alive && Math.sin(elapsed * 14 + i * 5.3) > 0.988) {
          dummy.scale.setScalar(0);
        }
        dummy.updateMatrix();
        instanced.setMatrixAt(i, dummy.matrix);
      } else if (particle.scale !== 0) {
        particle.scale = 0;
        dummy.position.set(0, 0, 0);
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        instanced.setMatrixAt(i, dummy.matrix);
      }
    }

    instanced.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh
        ref={instancedRef}
        args={[undefined, undefined, PARTICLE_POOL_SIZE]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#94e2d5"
          emissive="#94e2d5"
          emissiveIntensity={0.6}
        />
      </instancedMesh>

      {RINGS.map((ring, index) => (
        <RigidBody
          key={index}
          type="kinematicPosition"
          colliders={false}
          position={ring.position}
          ref={(node) => {
            ringBodyRefs.current[index] = node;
          }}
        >
          <mesh
            ref={(node) => {
              ringMeshRefs.current[index] = node;
            }}
            geometry={icosahedronGeometry}
          >
            <meshStandardMaterial
              color="#b4befe"
              wireframe
              emissive="#b4befe"
              emissiveIntensity={1.2}
            />
          </mesh>
          <CuboidCollider
            sensor
            args={[8, 8, 1]}
            onIntersectionEnter={collectRing(index)}
          />
        </RigidBody>
      ))}
    </>
  );
}