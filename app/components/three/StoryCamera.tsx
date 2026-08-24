"use client";

import { useRef, useEffect, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const MOVE_SPEED = 5;
const LOOK_SPEED = 0.002;
const SMOOTHING = 0.1;

export default function StoryCamera() {
  const { camera, gl } = useThree();
  const keys = useRef(new Set<string>());
  const euler = useRef(new THREE.Euler(0, 0, 0, "YXZ"));
  const isLocked = useRef(false);
  const velocity = useRef(new THREE.Vector3());

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isLocked.current) return;
      euler.current.y -= e.movementX * LOOK_SPEED;
      euler.current.x -= e.movementY * LOOK_SPEED;
      euler.current.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, euler.current.x));
    };

    const onKeyDown = (e: KeyboardEvent) => {
      keys.current.add(e.key.toLowerCase());
      if (e.key === "Tab") e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.key.toLowerCase());
    };

    const onPointerLockChange = () => {
      isLocked.current = document.pointerLockElement === gl.domElement;
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    document.addEventListener("pointerlockchange", onPointerLockChange);

    gl.domElement.addEventListener("click", () => {
      if (!isLocked.current) {
        gl.domElement.requestPointerLock();
      }
    });

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("pointerlockchange", onPointerLockChange);
    };
  }, [gl]);

  useFrame((_, delta) => {
    const direction = new THREE.Vector3();
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();

    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    if (keys.current.has("w") || keys.current.has("arrowup")) direction.add(forward);
    if (keys.current.has("s") || keys.current.has("arrowdown")) direction.sub(forward);
    if (keys.current.has("a") || keys.current.has("arrowleft")) direction.sub(right);
    if (keys.current.has("d") || keys.current.has("arrowright")) direction.add(right);
    if (keys.current.has(" ")) direction.y += 1;
    if (keys.current.has("shift")) direction.y -= 1;

    if (direction.lengthSq() > 0) direction.normalize();

    velocity.current.lerp(direction.multiplyScalar(MOVE_SPEED), SMOOTHING);
    camera.position.add(velocity.current.clone().multiplyScalar(delta));

    camera.quaternion.setFromEuler(euler.current);
  });

  return null;
}
