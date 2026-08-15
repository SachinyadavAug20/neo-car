"use client";

import { useEffect, useMemo, useRef, useState, type ElementRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { easing } from "maath";
import { useFrame, useThree } from "@react-three/fiber";
import { useKeyboardControls, Trail, Text } from "@react-three/drei";
import { RigidBody, CuboidCollider, type RapierRigidBody } from "@react-three/rapier";
import { Model as Car } from "./Car";
import { registerCamera } from "../lib/cameraStore";
import { gameStore } from "../store/gameStore";

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
const CAMERA_OFFSET = -35;
const CAMERA_HEIGHT = 12;
const THROTTLE = 60;
const MAX_SPEED = 65;
const VERTICAL_POWER = 50;
const YAW_POWER = 2.5;
const MAX_BANK = 0.3;
const CAMERA_SMOOTH_TIME = 0.3;
const BANK_SMOOTH_TIME = 0.2;
const THROTTLE_RAMP = 2.5;
const VERTICAL_RAMP = 4;
const STEER_RAMP = 5;

const LEFT_TAIL_POSITION: [number, number, number] = [-0.8, 0.5, -2];
const RIGHT_TAIL_POSITION: [number, number, number] = [0.8, 0.5, -2];
const TRAIL_WIDTH = 0.2;
const TRAIL_BASE_LENGTH = 2;
const TRAIL_MAX_LENGTH = 8;

const SCORE_TEXT_POSITION: [number, number, number] = [0, 4, -4];
const SCORE_FONT =
  "https://cdn.jsdelivr.net/gh/JetBrains/JetBrainsMono@master/fonts/ttf/JetBrainsMono-Regular.ttf";

type TrailMaterial = THREE.ShaderMaterial & { lineWidth: number; opacity: number };

const IMPULSE: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
const TORQUE: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };

export default function DrivableCar() {
  const introCamera = useThree((state) => state.camera);
  const bodyRef = useRef<RapierRigidBody>(null);
  const carGroupRef = useRef<THREE.Group>(null);
  const leftTrailRef = useRef<ElementRef<typeof Trail>>(null);
  const rightTrailRef = useRef<ElementRef<typeof Trail>>(null);
  const scoreTextRef = useRef<ElementRef<typeof Text>>(null);
  const introActive = useRef(true);
  const lastTrailLengthRef = useRef(TRAIL_BASE_LENGTH);
  const lastScoreRef = useRef(0);
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
      z: CAMERA_OFFSET - 4,
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

    const keys = getKeys();
    const linvel = body.linvel();
    const pos = body.translation();
    const quat = body.rotation();

    tmpForward.copy(CAR_FORWARD).applyQuaternion(quat);
    tmpRight.set(1, 0, 0).applyQuaternion(quat);

    const speed = Math.hypot(linvel.x, linvel.y, linvel.z);
    const speedRatio = Math.min(1, speed / MAX_SPEED);
    const forwardVelocity = tmpForward.dot(linvel);

    const targetThrottle = (keys.forward ? 1 : 0) - (keys.back ? 1 : 0);
    throttleRef.current = THREE.MathUtils.lerp(
      throttleRef.current,
      targetThrottle,
      1 - Math.exp(-THROTTLE_RAMP * delta),
    );
    const throttle = throttleRef.current;
    const accel = throttle > 0 && forwardVelocity > MAX_SPEED ? 0 : throttle;
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

    IMPULSE.x = tmpForward.x * accel * THROTTLE * mass;
    IMPULSE.y = 0;
    IMPULSE.z = tmpForward.z * accel * THROTTLE * mass;
    body.applyImpulse(IMPULSE, true);

    IMPULSE.x = 0;
    IMPULSE.y = vertical * VERTICAL_POWER * mass;
    IMPULSE.z = 0;
    body.applyImpulse(IMPULSE, true);

    const score = gameStore.getState().score;
    if (score !== lastScoreRef.current) {
      lastScoreRef.current = score;
      if (scoreTextRef.current) scoreTextRef.current.text = `> MEOW_TUI::SCORE = ${score}`;
    }

    const desiredLength = Math.round(
      THREE.MathUtils.clamp(
        TRAIL_BASE_LENGTH + speedRatio * (TRAIL_MAX_LENGTH - TRAIL_BASE_LENGTH),
        TRAIL_BASE_LENGTH,
        TRAIL_MAX_LENGTH,
      ),
    );
    if (desiredLength !== lastTrailLengthRef.current) {
      lastTrailLengthRef.current = desiredLength;
      setTrailLength(desiredLength);
    }

    const lineWidth = 0.1 * TRAIL_WIDTH * (0.5 + speedRatio * 0.9);
    const leftMat = leftTrailRef.current?.material as TrailMaterial | undefined;
    if (leftMat) leftMat.lineWidth = lineWidth;
    const rightMat = rightTrailRef.current?.material as TrailMaterial | undefined;
    if (rightMat) rightMat.lineWidth = lineWidth;

    if (introActive.current) return;

    tmpCamera
      .set(pos.x, pos.y, pos.z)
      .addScaledVector(tmpForward, CAMERA_OFFSET)
      .addScaledVector(tmpRight, state.pointer.x * 3)
      .add({ x: 0, y: CAMERA_HEIGHT - state.pointer.y * 2, z: 0 });

    easing.damp3(camera.position, tmpCamera, CAMERA_SMOOTH_TIME, delta);
    easing.dampLookAt(camera, tmpLook.set(pos.x, pos.y + 2.5, pos.z).addScaledVector(tmpForward, speedRatio * 6), CAMERA_SMOOTH_TIME, delta);
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

      <Text
        ref={scoreTextRef}
        position={SCORE_TEXT_POSITION}
        rotation={[0, Math.PI, 0]}
        fontSize={1.1}
        color="#b4befe"
        font={SCORE_FONT}
        anchorX="center"
        anchorY="middle"
      >
        &gt; MEOW_TUI::SCORE = 0
      </Text>

      <group position={LEFT_TAIL_POSITION}>
        <Trail
          ref={leftTrailRef}
          width={TRAIL_WIDTH}
          length={trailLength}
          color="#8aadf4"
          attenuation={(t) => t * t}
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
          attenuation={(t) => t * t}
        >
          <mesh>
            <boxGeometry args={[0.02, 0.02, 0.02]} />
            <meshBasicMaterial visible={false} />
          </mesh>
        </Trail>
      </group>

      <group ref={carGroupRef} scale={0.05}>
        <Car />
      </group>
    </RigidBody>
  );
}
