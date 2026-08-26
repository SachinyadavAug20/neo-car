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

// Reusable vectors — zero per-frame allocation
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _moveDir = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();

export default function StoryCamera({ narrativeState, onInteractionProgress, onInteractionComplete }: StoryCameraProps) {
  const { camera, gl } = useThree();

  // Refs
  const keys = useRef(new Set<string>());
  const isLocked = useRef(false);
  const velocity = useRef(new THREE.Vector3());
  const isAnimatingRef = useRef(false);
  const prevBeatId = useRef("");
  const windAccum = useRef(0);
  const jumpCount = useRef(0);

  const MOVE_SPEED = 8;
  const SPRINT_SPEED = 16;
  const SMOOTHING = 0.08;

  // ─── Camera flight on beat change ──────────────────────────────────
  useEffect(() => {
    const beat = getCurrentBeat(narrativeState);
    if (!beat?.camera) return;

    const beatId = `${narrativeState.currentAct}-${narrativeState.currentBeat}`;
    if (beatId === prevBeatId.current) return;
    prevBeatId.current = beatId;

    if (isAnimatingRef.current) return;

    // Exit pointer lock
    if (document.pointerLockElement) document.exitPointerLock();

    isAnimatingRef.current = true;
    window.dispatchEvent(new CustomEvent("cinematic-start"));

    const target = beat.camera.position;
    const lookAt = beat.camera.lookAt;

    gsap.to(camera.position, {
      x: target[0],
      y: Math.max(0.5, Math.min(35, target[1])),
      z: target[2],
      duration: 2,
      ease: "power2.inOut",
      onUpdate: () => {
        _lookTarget.set(lookAt[0], lookAt[1], lookAt[2]);
        camera.lookAt(_lookTarget);
      },
      onComplete: () => {
        isAnimatingRef.current = false;
        window.dispatchEvent(new CustomEvent("cinematic-complete"));
      },
    });
  }, [narrativeState.currentAct, narrativeState.currentBeat, camera]);

  // ─── Click-jump interaction ────────────────────────────────────────
  useEffect(() => {
    const beat = getCurrentBeat(narrativeState);
    if (!beat || beat.interaction !== "click-jump" || narrativeState.interactionState === "complete") return;

    const onClick = () => {
      jumpCount.current++;
      onInteractionProgress(jumpCount.current);

      window.dispatchEvent(new CustomEvent("milo-jump", { detail: { count: jumpCount.current } }));

      gsap.to(camera.position, {
        y: camera.position.y + 1.5,
        duration: 0.25,
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

  // ─── Drag-wind interaction ─────────────────────────────────────────
  useEffect(() => {
    const beat = getCurrentBeat(narrativeState);
    if (!beat || beat.interaction !== "drag-wind" || narrativeState.interactionState === "complete") return;

    let isDown = false;

    const onMouseDown = () => { isDown = true; };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      const delta = Math.abs(e.movementX) + Math.abs(e.movementY);
      if (delta > 1) {
        windAccum.current += delta * 0.015;
        onInteractionProgress(Math.floor(windAccum.current));
        camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, -e.movementX * 0.001, 0.15);
      }
    };
    const onMouseUp = () => {
      isDown = false;
      if (windAccum.current >= (beat.interactionTarget || 30)) {
        onInteractionComplete();
        windAccum.current = 0;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
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

  // ─── Reset counters on beat change ─────────────────────────────────
  useEffect(() => {
    windAccum.current = 0;
    jumpCount.current = 0;
  }, [narrativeState.currentAct, narrativeState.currentBeat]);

  // ─── Keyboard + pointer lock ───────────────────────────────────────
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
  }, [gl, narrativeState]);

  // ─── WASD + Vim movement (zero allocations) ────────────────────────
  useFrame((_, delta) => {
    if (isAnimatingRef.current) return;

    camera.getWorldDirection(_forward);
    _forward.y = 0;
    _forward.normalize();
    _right.crossVectors(_forward, _up).normalize();

    _moveDir.set(0, 0, 0);
    if (keys.current.has("w") || keys.current.has("arrowup")) _moveDir.add(_forward);
    if (keys.current.has("s") || keys.current.has("arrowdown")) _moveDir.sub(_forward);
    if (keys.current.has("a") || keys.current.has("arrowleft")) _moveDir.sub(_right);
    if (keys.current.has("d") || keys.current.has("arrowright")) _moveDir.add(_right);
    if (keys.current.has("j")) _moveDir.add(_forward);
    if (keys.current.has("k")) _moveDir.sub(_forward);

    if (_moveDir.lengthSq() > 0) _moveDir.normalize();

    const speed = keys.current.has("shift") ? SPRINT_SPEED : MOVE_SPEED;
    velocity.current.lerp(_moveDir.multiplyScalar(speed), SMOOTHING);
    _moveDir.copy(velocity.current).multiplyScalar(delta);
    camera.position.add(_moveDir);
    camera.position.y = Math.max(-0.5, Math.min(35, camera.position.y));
  });

  return null;
}
