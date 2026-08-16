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
import { useAudioAnalyzer } from "../hooks/useAudioAnalyzer";

const RING_COUNT = 30;
const RING_START_Z = 80;
const RING_RESPAWN_MARGIN = 20;
const CHUNK_LENGTH = 360;
const CHUNK_REPEAT = 200;
const PARTICLE_POOL_SIZE = 300;
const VOXELS_PER_RING = 24;
const PARTICLE_SPEED_MIN = 8;
const PARTICLE_SPEED_MAX = 22;
const PARTICLE_DECAY = 2.0;
const PARTICLE_DEATH_SCALE = 0.05;

type RingPlacement = [number, number, number];
type Chunk = readonly RingPlacement[];

const CHUNKS: readonly Chunk[] = [
  [
    [-25, 22, 0],
    [-12, 18, 80],
    [0, 14, 160],
    [12, 18, 240],
    [25, 22, 320],
  ],
  [
    [0, 12, 0],
    [20, 12, 80],
    [-20, 12, 160],
    [0, 12, 240],
    [0, 24, 320],
  ],
  [
    [-30, 16, 0],
    [0, 14, 80],
    [30, 18, 160],
    [0, 24, 240],
    [-30, 18, 320],
  ],
  [
    [0, 10, 0],
    [0, 10, 80],
    [0, 10, 160],
    [0, 10, 240],
    [0, 10, 320],
  ],
  [
    [0, 26, 0],
    [12, 20, 80],
    [24, 14, 160],
    [12, 20, 240],
    [0, 26, 320],
  ],
];

const PATTERN_RINGS: RingPlacement[] = [];
for (let c = 0; c < CHUNK_REPEAT; c++) {
  const chunk = CHUNKS[c % CHUNKS.length];
  const chunkZ = RING_START_Z + c * CHUNK_LENGTH;
  for (const placement of chunk) {
    PATTERN_RINGS.push([placement[0], placement[1], chunkZ + placement[2]]);
  }
}

interface ParticleState {
  alive: boolean;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  scale: number;
}

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

export default function LevelManager() {
  const { getFrequencies } = useAudioAnalyzer();
  const collectedRef = useRef(new Set<number>());
  const ringMeshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const ringBodyRefs = useRef<(RapierRigidBody | null)[]>([]);
  const patternIndexRef = useRef<number[]>(
    Array.from({ length: RING_COUNT }, (_, i) => i),
  );
  const instancedRef = useRef<THREE.InstancedMesh>(null);
  const freeIndicesRef = useRef<number[] | null>(null);
  const particlesRef = useRef<ParticleState[] | null>(null);

  const icosahedronGeometry = useMemo(
    () => new THREE.IcosahedronGeometry(6, 0),
    [],
  );
  const ringMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#b4befe",
        wireframe: true,
        emissive: "#b4befe",
        emissiveIntensity: 1.2,
      }),
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

    const body = ringBodyRefs.current[index];
    const free = freeIndicesRef.current;
    const pool = particlesRef.current;
    if (!body || !free || !pool) return;

    const translation = body.translation();
    const ringX = translation.x;
    const ringY = translation.y;
    const ringZ = translation.z;
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
    const [, mids] = getFrequencies();
    for (let i = 0; i < RING_COUNT; i++) {
      const body = ringBodyRefs.current[i];
      const mesh = ringMeshRefs.current[i];
      if (!body) continue;
      const placement = PATTERN_RINGS[patternIndexRef.current[i]];
      if (placement[2] < cameraZ - RING_RESPAWN_MARGIN) {
        const nextIndex = patternIndexRef.current[i] + RING_COUNT;
        if (nextIndex < PATTERN_RINGS.length) {
          patternIndexRef.current[i] = nextIndex;
          const next = PATTERN_RINGS[nextIndex];
          body.setNextKinematicTranslation({
            x: next[0],
            y: next[1],
            z: next[2],
          });
          collectedRef.current.delete(i);
          if (mesh) mesh.visible = true;
        }
      }
      if (mesh && mesh.visible) {
        mesh.scale.setScalar(1 + mids * 0.4);
      }
    }

    const instanced = instancedRef.current;
    if (!instanced) return;
    const pool = particlesRef.current;
    const free = freeIndicesRef.current;
    if (!pool || !free) return;

    const elapsed = state.clock.elapsedTime;
    let dirty = false;
    for (let i = 0; i < pool.length; i++) {
      const particle = pool[i];
      if (particle.alive) {
        dirty = true;
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
        dirty = true;
        particle.scale = 0;
        dummy.position.set(0, 0, 0);
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        instanced.setMatrixAt(i, dummy.matrix);
      }
    }

    if (dirty) instanced.instanceMatrix.needsUpdate = true;
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

      {PATTERN_RINGS.slice(0, RING_COUNT).map((position, index) => (
        <RigidBody
          key={index}
          type="kinematicPosition"
          colliders={false}
          position={position}
          ref={(node) => {
            ringBodyRefs.current[index] = node;
          }}
        >
          <mesh
            ref={(node) => {
              ringMeshRefs.current[index] = node;
            }}
            geometry={icosahedronGeometry}
            material={ringMaterial}
          />
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