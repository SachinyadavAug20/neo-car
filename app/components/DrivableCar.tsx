"use client";

import { useEffect, useMemo, useRef, useState, type ElementRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { easing } from "maath";
import { useFrame, useThree } from "@react-three/fiber";
import { useKeyboardControls, Trail } from "@react-three/drei";
import { RigidBody, CuboidCollider, type RapierRigidBody } from "@react-three/rapier";
import { registerCamera } from "../lib/cameraStore";
import { gameStore } from "../store/gameStore";
import { useAudioAnalyzer } from "../hooks/useAudioAnalyzer";

export type Controls = "forward" | "back" | "left" | "right" | "up" | "down";

export const controlsMap: { name: Controls; keys: string[] }[] = [
  { name: "forward", keys: ["KeyW", "ArrowUp"] },
  { name: "back", keys: ["KeyS", "ArrowDown"] },
  { name: "left", keys: ["KeyA", "ArrowLeft"] },
  { name: "right", keys: ["KeyD", "ArrowRight"] },
  { name: "up", keys: ["Space"] },
  { name: "down", keys: ["ShiftLeft", "ShiftRight"] },
];

const CAR_FORWARD = new THREE.Vector3(0, 0, 1);
const CAMERA_OFFSET = -20;
const CAMERA_HEIGHT = 10;
const THROTTLE = 95;
const MAX_SPEED = 135;
const VERTICAL_POWER = 50;
const YAW_POWER = 2.5;
const MAX_BANK = 0.4;
const CAMERA_SMOOTH_TIME = 0.18;
const LOOKAHEAD_BASE = 30;
const LOOKAHEAD_SPEED = 20;
const POINTER_DEAD_ZONE = 0.05;
const BANK_SMOOTH_TIME = 0.15;
const THROTTLE_RAMP = 2.5;
const VERTICAL_RAMP = 4;
const STEER_RAMP = 5;
const LANE_BOUNDARY = 40;

const LEFT_TAIL_POSITION: [number, number, number] = [-0.8, 0.5, -2];
const RIGHT_TAIL_POSITION: [number, number, number] = [0.8, 0.5, -2];
const TRAIL_WIDTH = 0.2;
const TRAIL_BASE_LENGTH = 2;
const TRAIL_MAX_LENGTH = 8;

const WHEEL_POSITIONS: [number, number, number][] = [
  [-1.7, 0.4, 2.2],
  [1.7, 0.4, 2.2],
  [-1.7, 0.4, -2.2],
  [1.7, 0.4, -2.2],
];



type TrailMaterial = THREE.ShaderMaterial & { lineWidth: number; opacity: number };

const IMPULSE: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
const TORQUE: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
const tmpOffset = new THREE.Vector3();
const quadraticAtten = (t: number) => t * t;

export default function DrivableCar() {
  const introCamera = useThree((state) => state.camera);
  const { getFrequencies } = useAudioAnalyzer();
  const bodyRef = useRef<RapierRigidBody>(null);
  const carGroupRef = useRef<THREE.Group>(null);
  const leftTrailRef = useRef<ElementRef<typeof Trail>>(null);
  const rightTrailRef = useRef<ElementRef<typeof Trail>>(null);
  
  const introActive = useRef(true);
  const lastTrailLengthRef = useRef(TRAIL_BASE_LENGTH);
  const frameCountRef = useRef(0);
  const throttleRef = useRef(0);
  const verticalRef = useRef(0);
  const steerRef = useRef(0);
  const [trailLength, setTrailLength] = useState(TRAIL_BASE_LENGTH);
  const [, getKeys] = useKeyboardControls<Controls>();

  const tmpForward = useMemo(() => new THREE.Vector3(), []);
  const tmpRight = useMemo(() => new THREE.Vector3(), []);
  const tmpCamera = useMemo(() => new THREE.Vector3(), []);
  const tmpLook = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    window.focus();
  }, []);

  useEffect(() => {
    const cam = introCamera as THREE.PerspectiveCamera;
    registerCamera(cam);
    cam.position.set(0, 50, -50);

    const timeline = gsap.timeline({ defaults: { ease: "expo.out", duration: 3 } });
    timeline.to(cam.position, {
      x: 0,
      y: CAMERA_HEIGHT + 10,
      z: CAMERA_OFFSET - 2,
      onComplete: () => {
        introActive.current = false;
      },
    });

    return () => {
      timeline.kill();
    };
  }, [introCamera]);

  useFrame((state, delta) => {
    const body = bodyRef.current;
    const camera = state.camera;
    if (!body) return;
    if (gameStore.getState().panicked) return;

    const [, , highs] = getFrequencies();
    const keys = getKeys();
    const pos = body.translation();
    const quat = body.rotation();

    tmpForward.copy(CAR_FORWARD).applyQuaternion(quat);
    tmpRight.set(1, 0, 0).applyQuaternion(quat);

    const targetThrottle = (keys.forward ? 1 : 0) - (keys.back ? 1 : 0);
    throttleRef.current = THREE.MathUtils.lerp(
      throttleRef.current,
      targetThrottle,
      1 - Math.exp(-THROTTLE_RAMP * delta),
    );
    const throttle = throttleRef.current;
    const mass = body.mass();

    const targetVertical = (keys.up ? 1 : 0) - (keys.down ? 1 : 0);
    verticalRef.current = THREE.MathUtils.lerp(
      verticalRef.current,
      targetVertical,
      1 - Math.exp(-VERTICAL_RAMP * delta),
    );
    const vertical = verticalRef.current;

    const targetSteer = (keys.left ? 1 : 0) - (keys.right ? 1 : 0);
    steerRef.current = THREE.MathUtils.lerp(
      steerRef.current,
      targetSteer,
      1 - Math.exp(-STEER_RAMP * delta),
    );
    const steer = steerRef.current;
    TORQUE.x = 0;
    TORQUE.y = steer * YAW_POWER * mass;
    TORQUE.z = 0;
    body.applyTorqueImpulse(TORQUE, true);

    const carGroup = carGroupRef.current;
    if (carGroup) {
      easing.damp(carGroup.rotation, "z", steer * MAX_BANK, BANK_SMOOTH_TIME, delta);
    }

    const reverseMultiplier = throttle < 0 ? 0.5 : 1;
    IMPULSE.x = tmpForward.x * throttle * THROTTLE * mass * reverseMultiplier;
    IMPULSE.y = 0;
    IMPULSE.z = tmpForward.z * throttle * THROTTLE * mass * reverseMultiplier;
    body.applyImpulse(IMPULSE, true);

    IMPULSE.x = 0;
    IMPULSE.y = vertical * VERTICAL_POWER * mass;
    IMPULSE.z = 0;
    body.applyImpulse(IMPULSE, true);

    const isOOB = Math.abs(pos.x) > LANE_BOUNDARY;
    const gs = gameStore.getState();
    if (isOOB && !gs.outOfBounds) {
      gs.setOutOfBounds(true);
    } else if (isOOB) {
      gs.updateOobTimer(delta);
    } else if (gs.outOfBounds) {
      gs.setOutOfBounds(false);
    } else {
      gs.resetOobTimer();
    }

    const linvel = body.linvel();
    const speed = Math.hypot(linvel.x, linvel.y, linvel.z);
    const speedRatio = Math.min(1, speed / MAX_SPEED);

    const desiredLength = Math.round(
      THREE.MathUtils.clamp(
        TRAIL_BASE_LENGTH + speedRatio * (TRAIL_MAX_LENGTH - TRAIL_BASE_LENGTH),
        TRAIL_BASE_LENGTH,
        TRAIL_MAX_LENGTH,
      ),
    );
    frameCountRef.current++;
    if (
      frameCountRef.current % 6 === 0 &&
      desiredLength !== lastTrailLengthRef.current
    ) {
      lastTrailLengthRef.current = desiredLength;
      setTrailLength(desiredLength);
    }

    const lineWidth = 0.1 * TRAIL_WIDTH * (0.5 + speedRatio * 0.9 + highs * 1.5);
    const leftMat = leftTrailRef.current?.material as TrailMaterial | undefined;
    if (leftMat) leftMat.lineWidth = lineWidth;
    const rightMat = rightTrailRef.current?.material as TrailMaterial | undefined;
    if (rightMat) rightMat.lineWidth = lineWidth;

    if (introActive.current) return;

    const pointerX = Math.abs(state.pointer.x) < POINTER_DEAD_ZONE ? 0 : state.pointer.x;
    const pointerY = Math.abs(state.pointer.y) < POINTER_DEAD_ZONE ? 0 : state.pointer.y;
    const lookAheadDistance = LOOKAHEAD_BASE + speedRatio * LOOKAHEAD_SPEED;

    tmpCamera
      .set(pos.x, pos.y, pos.z)
      .addScaledVector(tmpForward, CAMERA_OFFSET)
      .addScaledVector(tmpRight, pointerX * 3)
      .add(tmpOffset.set(0, CAMERA_HEIGHT - pointerY * 2, 0));

    easing.damp3(camera.position, tmpCamera, CAMERA_SMOOTH_TIME, delta);
    easing.dampLookAt(
      camera,
      tmpLook
        .set(pos.x, pos.y + 1, pos.z)
        .addScaledVector(tmpForward, lookAheadDistance),
      CAMERA_SMOOTH_TIME,
      delta,
    );
  });

  return (
    <RigidBody
      ref={bodyRef}
      type="dynamic"
      position={[0, 15, 0]}
      colliders={false}
      gravityScale={0}
      friction={1.2}
      restitution={0}
      linearDamping={2.5}
      angularDamping={4.0}
      ccd
      canSleep={false}
    >
      <CuboidCollider args={[4, 1, 9]} position={[0, -0.5, 0]} />

      <group position={LEFT_TAIL_POSITION}>
        <Trail
          ref={leftTrailRef}
          width={TRAIL_WIDTH}
          length={trailLength}
          color="#8aadf4"
          attenuation={quadraticAtten}
        >
          <mesh>
            <boxGeometry args={[0.02, 0.02, 0.02]} />
            <meshBasicMaterial visible={false} />
          </mesh>
        </Trail>
      </group>

      <group position={RIGHT_TAIL_POSITION}>
        <Trail
          ref={rightTrailRef}
          width={TRAIL_WIDTH}
          length={trailLength}
          color="#8aadf4"
          attenuation={quadraticAtten}
        >
          <mesh>
            <boxGeometry args={[0.02, 0.02, 0.02]} />
            <meshBasicMaterial visible={false} />
          </mesh>
        </Trail>
      </group>

      <group ref={carGroupRef} position={[0, -0.5, 0]}>
        <mesh position={[0, 1.2, 0]}>
          <boxGeometry args={[3.2, 1.2, 6]} />
          <meshStandardMaterial
            color="#1e1a2e"
            emissive="#8aadf4"
            emissiveIntensity={0.8}
            metalness={0.3}
            roughness={0.4}
          />
        </mesh>
        <mesh position={[0, 2.1, -0.5]}>
          <boxGeometry args={[2, 1, 2.6]} />
          <meshStandardMaterial
            color="#12021f"
            emissive="#cba6f7"
            emissiveIntensity={0.6}
            metalness={0.2}
            roughness={0.5}
          />
        </mesh>
        {WHEEL_POSITIONS.map((position, index) => (
          <mesh key={index} position={position} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.6, 0.6, 0.4, 10]} />
            <meshStandardMaterial color="#0b0f19" metalness={0.4} roughness={0.8} />
          </mesh>
        ))}
      </group>
    </RigidBody>
  );
}
