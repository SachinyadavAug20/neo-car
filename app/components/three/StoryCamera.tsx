"use client";

import { useRef, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { NarrativeState, getCurrentBeat } from "@/app/lib/narrative";

interface StoryCameraProps {
  narrativeState: NarrativeState;
  onInteractionProgress: (progress: number) => void;
  onInteractionComplete: () => void;
}

// Reusable temp objects — zero per-frame allocation
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _moveDir = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _camEuler = new THREE.Euler(0, 0, 0, "YXZ");

export default function StoryCamera({ narrativeState, onInteractionProgress, onInteractionComplete }: StoryCameraProps) {
  const { camera, gl } = useThree();
  const keys = useRef(new Set<string>());
  const isLocked = useRef(false);
  const velocity = useRef(new THREE.Vector3());
  const [isCinematic, setIsCinematic] = useState(false);
  const isAnimatingRef = useRef(false);
  const prevBeatRef = useRef<string>("");
  const windAccum = useRef(0);
  const jumpCount = useRef(0);
  const camEulerRef = useRef(new THREE.Euler(0, 0, 0, "YXZ"));

  const MOVE_SPEED = 6;
  const SPRINT_SPEED = 12;
  const SMOOTHING = 0.08;

  // Camera flight on beat change
  useEffect(() => {
    const beat = getCurrentBeat(narrativeState);
    if (!beat) return;
    const beatId = `${narrativeState.currentAct}-${narrativeState.currentBeat}`;
    if (beatId === prevBeatRef.current) return;
    prevBeatRef.current = beatId;

    if (beat.camera && !isAnimatingRef.current) {
      if (document.pointerLockElement) document.exitPointerLock();

      // Fail-safe: clamp camera to reasonable bounds
      const camPos = beat.camera.position.map((v, i) => {
        if (i === 1) return Math.max(0.5, Math.min(15, v)); // Y: keep above ground, below sky
        return Math.max(-50, Math.min(50, v)); // X/Z: keep in world
      }) as [number, number, number];

      isAnimatingRef.current = true;
      setIsCinematic(true);
      window.dispatchEvent(new CustomEvent("cinematic-start"));

      const tl = gsap.timeline({
        onComplete: () => {
          isAnimatingRef.current = false;
          setIsCinematic(false);
          window.dispatchEvent(new CustomEvent("cinematic-complete"));
        }
      });

      tl.to(camera.position, {
        x: camPos[0],
        y: camPos[1],
        z: camPos[2],
        duration: 2.5,
        ease: "power2.inOut",
        onUpdate: () => {
          _lookTarget.set(...beat.camera!.lookAt);
          camera.lookAt(_lookTarget);
        }
      });

      _forward.set(...beat.camera.lookAt).sub(camera.position).normalize();
      const finalY = Math.atan2(_forward.x, _forward.z);
      const finalX = Math.asin(-_forward.y);
      tl.to(camEulerRef.current, { y: finalY, x: finalX, duration: 2.5, ease: "power2.inOut" }, "<");
    }
  }, [narrativeState.currentAct, narrativeState.currentBeat, camera]);

  // Interaction: click-jump
  useEffect(() => {
    const beat = getCurrentBeat(narrativeState);
    if (!beat || beat.interaction !== "click-jump" || narrativeState.interactionState === "complete") return;

    const onClick = () => {
      jumpCount.current++;
      onInteractionProgress(jumpCount.current);

      // Dispatch event so Milo reacts visually
      window.dispatchEvent(new CustomEvent("milo-jump", { detail: { count: jumpCount.current } }));

      // Camera bounce
      gsap.to(camera.position, {
        y: camera.position.y + 1.2,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        ease: "power2.out",
      });

      if (jumpCount.current >= (beat.interactionTarget || 5)) {
        onInteractionComplete();
        jumpCount.current = 0;
      }
    };

    gl.domElement.addEventListener("click", onClick);
    return () => gl.domElement.removeEventListener("click", onClick);
  }, [narrativeState.currentAct, narrativeState.currentBeat, narrativeState.interactionState, camera, gl, onInteractionProgress, onInteractionComplete]);

  // Interaction: drag-wind
  useEffect(() => {
    const beat = getCurrentBeat(narrativeState);
    if (!beat || beat.interaction !== "drag-wind" || narrativeState.interactionState === "complete") return;

    let isDown = false;

    const onMouseDown = () => { isDown = true; };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      const dx = Math.abs(e.movementX);
      const dy = Math.abs(e.movementY);
      const delta = dx + dy;
      if (delta > 1) {
        windAccum.current += delta * 0.015;
        onInteractionProgress(Math.floor(windAccum.current));
        camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, -e.movementX * 0.0008, 0.15);
      }
    };

    const onMouseUp = () => {
      isDown = false;
      if (windAccum.current >= (beat.interactionTarget || 30)) {
        onInteractionComplete();
        windAccum.current = 0;
      }
    };

    // Touch support
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        windAccum.current += 0.3;
        onInteractionProgress(Math.floor(windAccum.current));
      }
    };

    const onTouchEnd = () => {
      if (windAccum.current >= (beat.interactionTarget || 30)) {
        onInteractionComplete();
        windAccum.current = 0;
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("touchmove", onTouchMove);
    document.addEventListener("touchend", onTouchEnd);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      camera.rotation.z = 0;
    };
  }, [narrativeState.currentAct, narrativeState.currentBeat, narrativeState.interactionState, camera, onInteractionProgress, onInteractionComplete]);

  // Reset counters on beat change
  useEffect(() => {
    windAccum.current = 0;
    jumpCount.current = 0;
  }, [narrativeState.currentAct, narrativeState.currentBeat]);

  // Keyboard controls
  useEffect(() => {
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
    const onClick = () => {
      if (isAnimatingRef.current) return;
      // Don't request pointer lock during click-unfold — let R3F handle the click
      const beat = getCurrentBeat(narrativeState);
      if (beat?.interaction === "click-unfold") return;
      if (!isLocked.current) gl.domElement.requestPointerLock();
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    document.addEventListener("pointerlockchange", onPointerLockChange);
    gl.domElement.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("pointerlockchange", onPointerLockChange);
      gl.domElement.removeEventListener("click", onClick);
    };
  }, [gl]);

  // WASD movement (zero allocations)
  useFrame((_, delta) => {
    if (isAnimatingRef.current) return;

    // Forward = camera direction projected to XZ plane
    camera.getWorldDirection(_forward);
    _forward.y = 0;
    _forward.normalize();

    // Right = forward × up
    _right.crossVectors(_forward, _up).normalize();

    // Accumulate movement direction (WASD + Vim HJKL)
    _moveDir.set(0, 0, 0);
    if (keys.current.has("w") || keys.current.has("arrowup")) _moveDir.add(_forward);
    if (keys.current.has("s") || keys.current.has("arrowdown")) _moveDir.sub(_forward);
    if (keys.current.has("a") || keys.current.has("arrowleft")) _moveDir.sub(_right);
    if (keys.current.has("d") || keys.current.has("arrowright")) _moveDir.add(_right);
    // Vim: j=forward, k=backward, h=pan left, l=pan right
    if (keys.current.has("j")) _moveDir.add(_forward);
    if (keys.current.has("k")) _moveDir.sub(_forward);
    if (keys.current.has("h")) camEulerRef.current.y += 0.03;
    if (keys.current.has("l")) camEulerRef.current.y -= 0.03;
    if (keys.current.has(" ")) _moveDir.y += 1;
    if (keys.current.has("shift")) _moveDir.y -= 1;
    if (keys.current.has("q")) camEulerRef.current.y += 0.03;
    if (keys.current.has("e")) camEulerRef.current.y -= 0.03;

    if (_moveDir.lengthSq() > 0) _moveDir.normalize();

    const sprint = keys.current.has("control");
    const speed = sprint ? SPRINT_SPEED : MOVE_SPEED;

    velocity.current.lerp(_moveDir.multiplyScalar(speed), SMOOTHING);
    _moveDir.copy(velocity.current).multiplyScalar(delta);
    camera.position.add(_moveDir);
    camera.position.y = Math.max(-0.5, Math.min(20, camera.position.y));
    camera.quaternion.setFromEuler(camEulerRef.current);
  });

  return null;
}
