"use client";

import { useEffect, useMemo, useRef, useState, type ElementRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { useFrame, useThree } from "@react-three/fiber";
import { useKeyboardControls, Trail } from "@react-three/drei";
import { RigidBody, CuboidCollider, type RapierRigidBody } from "@react-three/rapier";
import { Model as Car } from "./Car";
import { registerCamera } from "../lib/cameraStore";

export type Controls = "forward" | "back" | "left" | "right" | "brake";

export const controlsMap: { name: Controls; keys: string[] }[] = [
  { name: "forward", keys: ["KeyW", "ArrowUp"] },
  { name: "back", keys: ["KeyS", "ArrowDown"] },
  { name: "left", keys: ["KeyA", "ArrowLeft"] },
  { name: "right", keys: ["KeyD", "ArrowRight"] },
  { name: "brake", keys: ["Space"] },
];

const CAR_FORWARD = new THREE.Vector3(0, 0, -1);
const CAMERA_OFFSET = 15;
const CAMERA_HEIGHT = 7;
const THROTTLE = 60;
const MAX_SPEED = 65;
const BRAKE_POWER = 90;
const STEER_SPEED = 2.5;
const GRIP_FACTOR = 0.8;
const MIN_STEER_SPEED = 1;
const HIGH_SPEED_THRESHOLD = MAX_SPEED * 0.8;

const LEFT_TAIL_POSITION: [number, number, number] = [-0.8, 0.5, 2];
const RIGHT_TAIL_POSITION: [number, number, number] = [0.8, 0.5, 2];
const TRAIL_WIDTH = 0.2;
const TRAIL_BASE_LENGTH = 2;
const TRAIL_MAX_LENGTH = 8;

type TrailMaterial = THREE.ShaderMaterial & { lineWidth: number; opacity: number };

export default function DrivableCar() {
  const introCamera = useThree((state) => state.camera);
  const bodyRef = useRef<RapierRigidBody>(null);
  const leftTrailRef = useRef<ElementRef<typeof Trail>>(null);
  const rightTrailRef = useRef<ElementRef<typeof Trail>>(null);
  const introActive = useRef(true);
  const lastTrailLengthRef = useRef(TRAIL_BASE_LENGTH);
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
      z: CAMERA_OFFSET + 4,
      onComplete: () => {
        introActive.current = false;
      },
    });

    return () => {
      timeline.kill();
    };
  }, [introCamera]);

  useFrame((state) => {
    const body = bodyRef.current;
    const camera = state.camera;
    if (!body) return;

    const keys = getKeys();
    const linvel = body.linvel();
    const pos = body.translation();
    const quat = body.rotation();

    tmpForward.copy(CAR_FORWARD).applyQuaternion(quat);
    tmpRight.set(1, 0, 0).applyQuaternion(quat);

    const speed = Math.hypot(linvel.x, linvel.z);
    const speedRatio = Math.min(1, speed / MAX_SPEED);
    const forwardVelocity = tmpForward.dot(linvel);
    const throttle = (keys.forward ? 1 : 0) - (keys.back ? 1 : 0);
    const accel = throttle > 0 && forwardVelocity > MAX_SPEED ? 0 : throttle;
    const mass = body.mass();

    body.applyImpulse(
      {
        x: tmpForward.x * accel * THROTTLE * mass,
        y: 0,
        z: tmpForward.z * accel * THROTTLE * mass,
      },
      true,
    );

    const lateralSpeed = tmpRight.dot(linvel);
    body.applyImpulse(
      {
        x: -tmpRight.x * lateralSpeed * GRIP_FACTOR * mass,
        y: 0,
        z: -tmpRight.z * lateralSpeed * GRIP_FACTOR * mass,
      },
      true,
    );

    const steer = (keys.left ? 1 : 0) - (keys.right ? 1 : 0);
    if (Math.abs(speed) > MIN_STEER_SPEED) {
      body.setAngvel(
        {
          x: 0,
          y: steer * STEER_SPEED * Math.sign(forwardVelocity),
          z: 0,
        },
        true,
      );
    } else {
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    }

    if (keys.brake) {
      body.applyImpulse(
        { x: -linvel.x * BRAKE_POWER * mass, y: 0, z: -linvel.z * BRAKE_POWER * mass },
        true,
      );
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

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, tmpCamera.x, 0.09);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, tmpCamera.y, 0.09);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, tmpCamera.z, 0.09);

    if (speed > HIGH_SPEED_THRESHOLD) {
      camera.position.y += Math.sin(state.clock.elapsedTime * 60) * 0.04;
    }

    tmpLook.set(pos.x, pos.y + 2.5, pos.z);
    camera.lookAt(tmpLook);
  });

  return (
    <RigidBody
      ref={bodyRef}
      type="dynamic"
      position={[0, 10, 0]}
      colliders={false}
      friction={1.2}
      restitution={0}
      linearDamping={0.6}
      angularDamping={3}
      ccd
      canSleep={false}
    >
      <CuboidCollider args={[4, 1, 9]} position={[0, -0.5, 0]} />

      <group position={LEFT_TAIL_POSITION}>
        <Trail
          ref={leftTrailRef}
          width={TRAIL_WIDTH}
          length={trailLength}
          color="#00e5ff"
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
          color="#00e5ff"
          attenuation={(t) => t * t}
        >
          <mesh>
            <boxGeometry args={[0.02, 0.02, 0.02]} />
            <meshBasicMaterial visible={false} />
          </mesh>
        </Trail>
      </group>

      <group scale={0.05}>
        <Car />
      </group>
    </RigidBody>
  );
}