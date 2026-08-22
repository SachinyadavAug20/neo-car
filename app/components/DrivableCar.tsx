"use client";

import { useEffect, useMemo, useRef, useState, type ElementRef } from "react";
import * as THREE from "three";
import { easing } from "maath";
import { useFrame, useThree } from "@react-three/fiber";
import { Trail } from "@react-three/drei";
import { RigidBody, CuboidCollider, type RapierRigidBody } from "@react-three/rapier";
import { registerCamera } from "../lib/cameraStore";
import { setCarStatus, type CarStatus } from "../lib/carStateStore";
import { useAudioAnalyzer } from "../hooks/useAudioAnalyzer";
import { useKeyboard } from "../hooks/useKeyboard";
import { useAppStore } from "../lib/appStore";
import Car from "./Car";

const CAR_FORWARD = new THREE.Vector3(0, 0, 1);
const CAMERA_BEHIND = 18.0;
const CAMERA_HEIGHT = 4.2;
const CAMERA_LOOK_AHEAD = 120.0;
const CAMERA_LOOK_HEIGHT = 1.2;
const CAMERA_POS_SMOOTH = 0.18;
const CAMERA_LOOK_SMOOTH = 0.18;
const MAX_SPEED = 250;
const MAX_SPEED_OFF = 222;
const BASE_FOV = 55;
const MAX_FOV = 82;
const FOV_SMOOTH = 0.2;
const BANK_SMOOTH_TIME = 0.15;
const MAX_BANK = 0.4;
const INITIAL_CAM_POS: [number, number, number] = [0, 22, -38];

const THROTTLE_SPEED = 250;
const REVERSE_SPEED = -10;
const OFF_ROAD_FACTOR = 0.9;
const ROAD_HALF_WIDTH = 11;

const STEER_RATE = 2.2;
const BANK_GAIN = 0.5;
const WRAP_TRIGGER = 5000;
const WRAP_OFFSET = 4000;
const LANE_BOUNDARY = 45;
const OOB_TIMER_MAX = 3.0;

const LEFT_TAIL_POSITION: [number, number, number] = [-1.4, 0.6, 2.8];
const RIGHT_TAIL_POSITION: [number, number, number] = [1.4, 0.6, 2.8];
const TRAIL_WIDTH = 0.4;
const TRAIL_BASE_LENGTH = 5;
const TRAIL_MAX_LENGTH = 18;

type TrailMaterial = THREE.ShaderMaterial & {
  lineWidth: number;
  opacity: number;
  color: THREE.Color;
};

const IMPULSE: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
const tmpCamera = new THREE.Vector3();
const tmpLook = new THREE.Vector3();
const tmpShake = new THREE.Vector3();
const quadraticAtten = (t: number) => t * t;
const CAR_STATUS: CarStatus = {
  kmh: 0,
  gear: "D",
  onRoad: true,
  throttle: false,
  oobTimer: 0,
};

export default function DrivableCar() {
  const introCamera = useThree((state) => state.camera);
  const keys = useKeyboard();
  const { getFrequencies } = useAudioAnalyzer();
  const bodyRef = useRef<RapierRigidBody>(null);
  const carGroupRef = useRef<THREE.Group>(null);
  const carLightRef = useRef<THREE.PointLight>(null);
  const underglowRef = useRef<THREE.PointLight>(null);
  const exhaustRef = useRef<THREE.Mesh>(null);
  const leftTrailRef = useRef<ElementRef<typeof Trail>>(null);
  const rightTrailRef = useRef<ElementRef<typeof Trail>>(null);

  const lastTrailLengthRef = useRef(TRAIL_BASE_LENGTH);
  const frameCountRef = useRef(0);
  const oobTimerRef = useRef(0);
  const speedRatioRef = useRef(0);
  const [trailLength, setTrailLength] = useState(TRAIL_BASE_LENGTH);
  const [oobTimer, setOobTimer] = useState(0);

  const tmpForward = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const cam = introCamera as THREE.PerspectiveCamera;
    registerCamera(cam);
    cam.position.set(...INITIAL_CAM_POS);
    cam.lookAt(0, CAMERA_LOOK_HEIGHT, CAMERA_LOOK_AHEAD);
  }, [introCamera]);

  useFrame((state, delta) => {
    const body = bodyRef.current;
    const camera = state.camera;
    if (!body) return;

    const currentRoute = useAppStore.getState().currentRoute;
    const [bass, , highs] = getFrequencies();
    const pos = body.translation();
    const quat = body.rotation();
    const mass = body.mass();

    tmpForward.copy(CAR_FORWARD).applyQuaternion(quat);

    const throttle = keys.current.has("KeyW") || keys.current.has("ArrowUp");
    const brake = keys.current.has("KeyS") || keys.current.has("ArrowDown");
    const steerLeft = keys.current.has("KeyA") || keys.current.has("ArrowLeft");
    const steerRight = keys.current.has("KeyD") || keys.current.has("ArrowRight");
    const steer = (steerRight ? 1 : 0) - (steerLeft ? 1 : 0);

    const onRoad = Math.abs(pos.x) <= ROAD_HALF_WIDTH;
    let targetSpeed = throttle ? THROTTLE_SPEED : brake ? REVERSE_SPEED : 0;
    if (!onRoad) targetSpeed *= OFF_ROAD_FACTOR;

    IMPULSE.x = tmpForward.x * targetSpeed * mass;
    IMPULSE.y = 0;
    IMPULSE.z = tmpForward.z * targetSpeed * mass;
    body.applyImpulse(IMPULSE, true);

    const linvel = body.linvel();
    let speed = Math.hypot(linvel.x, linvel.y, linvel.z);
    const maxSpeed = onRoad ? MAX_SPEED : MAX_SPEED_OFF;
    if (speed > maxSpeed) {
      const k = maxSpeed / speed;
      body.setLinvel({ x: linvel.x * k, y: linvel.y * k, z: linvel.z * k }, true);
      speed = maxSpeed;
    }
    const speedRatio = Math.min(1, speed / MAX_SPEED);
    speedRatioRef.current = speedRatio;

    const angvel = body.angvel();
    const steerPower = -steer * STEER_RATE * (0.2 + speedRatio * 0.8);
    body.setAngvel({ x: angvel.x, y: steerPower, z: angvel.z }, true);

    CAR_STATUS.kmh = Math.abs(speed) * 3.6;
    CAR_STATUS.gear =
      tmpForward.x * linvel.x + tmpForward.y * linvel.y + tmpForward.z * linvel.z < 0
        ? "R"
        : "D";
    CAR_STATUS.onRoad = onRoad;
    CAR_STATUS.throttle = throttle;
    CAR_STATUS.oobTimer = oobTimerRef.current;
    setCarStatus(CAR_STATUS);

    if (pos.z > WRAP_TRIGGER) {
      body.setTranslation({ x: pos.x, y: pos.y, z: pos.z - WRAP_OFFSET }, true);
    }

    const outOfLane = Math.abs(pos.x) > LANE_BOUNDARY;
    if (outOfLane) {
      oobTimerRef.current = Math.min(oobTimerRef.current + delta, OOB_TIMER_MAX);
    } else {
      oobTimerRef.current = Math.max(oobTimerRef.current - delta * 2, 0);
    }
    if (frameCountRef.current % 6 === 0) {
      setOobTimer(oobTimerRef.current);
    }
    if (oobTimerRef.current >= OOB_TIMER_MAX) {
      body.setTranslation({ x: 0, y: 15, z: pos.z }, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      oobTimerRef.current = 0;
      setOobTimer(0);
    }

    const carGroup = carGroupRef.current;
    if (carGroup) {
      const bank = THREE.MathUtils.clamp(
        -steer * speedRatio * BANK_GAIN,
        -MAX_BANK,
        MAX_BANK,
      );
      easing.damp(carGroup.rotation, "z", bank, BANK_SMOOTH_TIME, delta);
    }

    const underglow = underglowRef.current;
    if (underglow) {
      underglow.intensity = 3 + bass * 14 + (throttle ? 2.5 : 0);
    }

    const exhaust = exhaustRef.current;
    if (exhaust) {
      const pulse = throttle ? 1 + bass * 1.8 : 0.3 + bass * 0.5;
      const exMat = exhaust.material as THREE.MeshBasicMaterial | undefined;
      if (exMat) exMat.opacity = Math.min(0.9, 0.2 + pulse * 0.3);
      exhaust.scale.set(1, 1, 0.5 + pulse * 1.5);
    }

    const carLight = carLightRef.current;
    if (carLight) {
      if (brake) {
        carLight.intensity = 55;
        carLight.color.set("#ff7a9e");
      } else {
        carLight.intensity = 40;
        carLight.color.set("#e8f0ff");
      }
    }

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

    const lineWidth = 0.1 * TRAIL_WIDTH * (0.4 + speedRatio * 1.0 + highs * 0.8);
    const leftMat = leftTrailRef.current?.material as TrailMaterial | undefined;
    if (leftMat) {
      leftMat.lineWidth = lineWidth;
      leftMat.color.setHSL(0.62, 0.85, 0.55 + bass * 0.2);
    }
    const rightMat = rightTrailRef.current?.material as TrailMaterial | undefined;
    if (rightMat) {
      rightMat.lineWidth = lineWidth;
      rightMat.color.setHSL(0.62, 0.85, 0.55 + bass * 0.2);
    }

    if (currentRoute === "/drive") {
      tmpCamera.set(pos.x, pos.y + CAMERA_HEIGHT, pos.z + CAMERA_BEHIND);

      const shake = bass * 0.25;
      tmpCamera.x += (Math.random() - 0.5) * shake;
      tmpCamera.y += (Math.random() - 0.5) * shake;

      easing.damp3(camera.position, tmpCamera, CAMERA_POS_SMOOTH, delta);

      tmpLook.set(pos.x, pos.y + CAMERA_LOOK_HEIGHT, pos.z - CAMERA_LOOK_AHEAD);

      easing.dampLookAt(camera, tmpLook, CAMERA_LOOK_SMOOTH, delta);

      const targetFov = BASE_FOV + speedRatio * (MAX_FOV - BASE_FOV);
      easing.damp(camera, "fov", targetFov, FOV_SMOOTH, delta);
      camera.updateProjectionMatrix();
    }
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
      <CuboidCollider args={[2.8, 1.2, 5.5]} position={[0, 0.8, 0]} />

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

      <group ref={carGroupRef} position={[0, 0.4, 0]}>
        <pointLight
          ref={carLightRef}
          position={[0, 5, 0]}
          intensity={40}
          distance={50}
          color="#e8f0ff"
        />
        <pointLight
          ref={underglowRef}
          position={[0, -1.6, 0]}
          intensity={3}
          distance={9}
          color="#6aa9ff"
        />
        <mesh ref={exhaustRef} position={[0, 0.8, -3.8]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.55, 1.6, 12]} />
          <meshBasicMaterial
            color="#8ad6ff"
            transparent
            opacity={0.4}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        <group scale={0.12}>
          <Car />
        </group>
      </group>
    </RigidBody>
  );
}
