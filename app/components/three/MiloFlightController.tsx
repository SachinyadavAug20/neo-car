"use client";

import { useRef, useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface MiloFlightControllerProps {
  active: boolean;
  onExit: () => void;
}

export function MiloFlightController({ active, onExit }: MiloFlightControllerProps) {
  const { camera } = useThree();
  const miloRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Group>(null);
  const rightWingRef = useRef<THREE.Group>(null);

  const keys = useRef<Record<string, boolean>>({});
  const flightState = useRef({
    pos: new THREE.Vector3(0, 5, 0),
    velocity: new THREE.Vector3(0, 0, -0.4),
    speed: 0.35,
    pitch: 0,
    yaw: 0,
    roll: 0,
  });

  // Crane Geometries
  const bodyGeo = useMemo(() => new THREE.ConeGeometry(0.3, 1, 4), []);
  const wingGeo = useMemo(() => new THREE.ConeGeometry(0.6, 1.4, 3), []);
  const edgeGeo = useMemo(() => new THREE.EdgesGeometry(wingGeo), [wingGeo]);

  useEffect(() => {
    if (!active) return;

    const onKeyDown = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;
      if (e.key === "Escape" || e.key === "f" || e.key === "F") {
        if (e.key === "Escape") onExit();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [active, onExit]);

  useFrame((state, delta) => {
    if (!active || !miloRef.current) return;
    const dt = Math.min(delta, 0.05);
    const fs = flightState.current;

    // Control inputs (WASD / Arrows)
    const turnRate = 2.0 * dt;
    const pitchRate = 1.8 * dt;

    if (keys.current["a"] || keys.current["arrowleft"]) {
      fs.yaw += turnRate;
      fs.roll = THREE.MathUtils.lerp(fs.roll, 0.4, 0.1);
    } else if (keys.current["d"] || keys.current["arrowright"]) {
      fs.yaw -= turnRate;
      fs.roll = THREE.MathUtils.lerp(fs.roll, -0.4, 0.1);
    } else {
      fs.roll = THREE.MathUtils.lerp(fs.roll, 0, 0.1);
    }

    if (keys.current["w"] || keys.current["arrowup"]) {
      fs.pitch = THREE.MathUtils.lerp(fs.pitch, -0.35, 0.1);
      fs.speed = THREE.MathUtils.lerp(fs.speed, 0.6, 0.05);
    } else if (keys.current["s"] || keys.current["arrowdown"]) {
      fs.pitch = THREE.MathUtils.lerp(fs.pitch, 0.35, 0.1);
      fs.speed = THREE.MathUtils.lerp(fs.speed, 0.2, 0.05);
    } else {
      fs.pitch = THREE.MathUtils.lerp(fs.pitch, 0, 0.1);
      fs.speed = THREE.MathUtils.lerp(fs.speed, 0.35, 0.05);
    }

    // Forward vector calculation
    const forward = new THREE.Vector3(0, 0, -1);
    const rotationEuler = new THREE.Euler(fs.pitch, fs.yaw, fs.roll, "YXZ");
    forward.applyEuler(rotationEuler);

    fs.pos.addScaledVector(forward, fs.speed);
    // Keep within diorama bounds
    fs.pos.y = Math.max(1.5, Math.min(30, fs.pos.y));

    miloRef.current.position.copy(fs.pos);
    miloRef.current.rotation.copy(rotationEuler);

    // Dynamic wing flap
    const flap = Math.sin(state.clock.elapsedTime * (fs.speed * 20)) * 0.45;
    if (leftWingRef.current) leftWingRef.current.rotation.z = flap;
    if (rightWingRef.current) rightWingRef.current.rotation.z = -flap;

    // Camera chase logic
    const camOffset = new THREE.Vector3(0, 2.5, 6);
    camOffset.applyEuler(new THREE.Euler(0, fs.yaw, 0));
    const targetCamPos = fs.pos.clone().add(camOffset);
    camera.position.lerp(targetCamPos, 0.1);
    camera.lookAt(fs.pos.clone().add(new THREE.Vector3(0, 0.5, 0)));
  });

  if (!active) return null;

  return (
    <group ref={miloRef} position={[0, 5, 0]}>
      {/* Milo Body */}
      <mesh geometry={bodyGeo} rotation={[Math.PI / 2, 0, 0]}>
        <meshToonMaterial color="#fefefe" side={THREE.DoubleSide} />
      </mesh>

      {/* Head / Beak */}
      <mesh position={[0, 0.15, -0.6]} rotation={[-0.4, 0, 0]}>
        <coneGeometry args={[0.1, 0.4, 4]} />
        <meshToonMaterial color="#fbbf24" />
      </mesh>

      {/* Left Wing */}
      <group ref={leftWingRef} position={[-0.2, 0.1, 0]}>
        <group rotation={[0, 0, 0.3]}>
          <mesh geometry={wingGeo} position={[-0.6, 0, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <meshToonMaterial color="#fefefe" side={THREE.DoubleSide} />
          </mesh>
          <lineSegments geometry={edgeGeo} position={[-0.6, 0, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <lineBasicMaterial color="#1a1a2e" transparent opacity={0.4} />
          </lineSegments>
        </group>
      </group>

      {/* Right Wing (slightly asymmetrical per lore) */}
      <group ref={rightWingRef} position={[0.2, 0.1, 0]}>
        <group rotation={[0, 0, -0.3]}>
          <mesh geometry={wingGeo} position={[0.7, 0, 0]} scale={[1.1, 1.1, 1.1]} rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <meshToonMaterial color="#fefefe" side={THREE.DoubleSide} />
          </mesh>
          <lineSegments geometry={edgeGeo} position={[0.7, 0, 0]} scale={[1.1, 1.1, 1.1]} rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <lineBasicMaterial color="#1a1a2e" transparent opacity={0.4} />
          </lineSegments>
        </group>
      </group>

      {/* Tail */}
      <mesh position={[0, 0.1, 0.6]} rotation={[0.4, 0, 0]}>
        <coneGeometry args={[0.15, 0.5, 3]} />
        <meshToonMaterial color="#fefefe" />
      </mesh>
    </group>
  );
}
