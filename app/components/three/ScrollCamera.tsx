"use client";

import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { useNarrative } from "@/app/lib/narrativeStore";
import { CHAPTERS } from "@/app/lib/narrative";

export default function ScrollCamera() {
  const { started, currentChapter, playing, storyTextVisible } = useNarrative();
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(30, 25, 40));
  const targetLook = useRef(new THREE.Vector3(0, -5, -20));
  const currentLook = useRef(new THREE.Vector3(0, -5, -20));

  useEffect(() => {
    if (!started || !playing) return;
    const ch = CHAPTERS[currentChapter];
    if (!ch) return;

    const [x, y, z] = ch.cameraPath[0];
    const [lx, ly, lz] = ch.lookAtPath[0];
    targetPos.current.set(x, y, z);
    targetLook.current.set(lx, ly, lz);

    gsap.to(camera.position, {
      x, y, z,
      duration: 2.5,
      ease: "power3.inOut",
    });
  }, [started, currentChapter, playing]);

  useFrame((_, delta) => {
    if (!started || !playing) return;

    const ch = CHAPTERS[currentChapter];
    if (!ch) return;

    const beatProgress = storyTextVisible ? 0.3 : 0;
    const pathIndex = Math.min(
      Math.floor(beatProgress * ch.cameraPath.length),
      ch.cameraPath.length - 1,
    );
    const nextIndex = Math.min(pathIndex + 1, ch.cameraPath.length - 1);

    const [x1, y1, z1] = ch.cameraPath[pathIndex];
    const [x2, y2, z2] = ch.cameraPath[nextIndex];
    const t = beatProgress * ch.cameraPath.length - pathIndex;

    targetPos.current.set(
      x1 + (x2 - x1) * t,
      y1 + (y2 - y1) * t,
      z1 + (z2 - z1) * t,
    );

    const [lx1, ly1, lz1] = ch.lookAtPath[pathIndex];
    const [lx2, ly2, lz2] = ch.lookAtPath[nextIndex];
    targetLook.current.set(
      lx1 + (lx2 - lx1) * t,
      ly1 + (ly2 - ly1) * t,
      lz1 + (lz2 - lz1) * t,
    );

    camera.position.lerp(targetPos.current, delta * 1.5);
    currentLook.current.lerp(targetLook.current, delta * 1.5);
    camera.lookAt(currentLook.current);
  });

  return null;
}
