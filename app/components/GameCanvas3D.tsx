"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useStore } from "zustand";
import { gameStore } from "../store/gameStore";
import EffectBoundary from "./EffectBoundary";

const CAR_MODEL_URL = "/models/auto_union_type_c_streamliner/scene.gltf";
const GRID_Y = -0.6;
const TARGET_CAR_WIDTH = 2.3;

interface Hazard {
  mesh: THREE.Mesh;
  kind: "ring" | "daemon";
  speed: number;
}

function ModelCar() {
  const { scene: model } = useGLTF(CAR_MODEL_URL);

  useEffect(() => {
    model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const materials = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material];
        for (const material of materials) {
          if (!material) continue;
          material.side = THREE.DoubleSide;
          material.needsUpdate = true;
        }
      }
    });
  }, [model]);

  return (
    <primitive
      object={model}
      rotation={[Math.PI / 2, 0, Math.PI]}
      position={[0, -0.6, -0.25]}
      scale={1.05}
    />
  );
}

interface BoxCarProps {
  bodyMaterial: THREE.Material;
  glowMaterial: THREE.Material;
  wheelMaterial: THREE.Material;
}

function BoxCar({ bodyMaterial, glowMaterial, wheelMaterial }: BoxCarProps) {
  return (
    <group>
      <mesh material={bodyMaterial}>
        <boxGeometry args={[1.8, 0.7, 3.2]} />
      </mesh>
      <mesh material={glowMaterial} position={[0, 0.55, -0.2]}>
        <boxGeometry args={[1.2, 0.5, 1.6]} />
      </mesh>
      {[
        [-0.9, -0.5, 1.2],
        [0.9, -0.5, 1.2],
        [-0.9, -0.5, -1.2],
        [0.9, -0.5, -1.2],
      ].map((position, index) => (
        <mesh
          key={index}
          material={wheelMaterial}
          position={position as [number, number, number]}
        >
          <boxGeometry args={[0.3, 0.4, 0.3]} />
        </mesh>
      ))}
    </group>
  );
}

export default function GameCanvas3D() {
  const sessionId = useStore(gameStore, (s) => s.sessionId);
  const scene = useThree((s) => s.scene);
  const carRef = useRef<THREE.Group>(null);
  const hazardsRef = useRef<Hazard[]>([]);
  const keysRef = useRef({ left: false, right: false });
  const runRef = useRef({ speed: 0.2, spawn: 0 });

  const ringGeometry = useMemo(() => new THREE.TorusGeometry(1.1, 0.12, 8, 20), []);
  const daemonGeometry = useMemo(() => new THREE.BoxGeometry(1.4, 1.4, 1.4), []);
  const ringMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#94e2d5" }),
    [],
  );
  const daemonMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#f38ba8" }),
    [],
  );
  const carBodyMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#cad3f5" }),
    [],
  );
  const carGlowMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#8aadf4" }),
    [],
  );
  const wheelMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#1e2030" }),
    [],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent, down: boolean) => {
      const k = e.key.toLowerCase();
      if (k === "arrowleft" || k === "a") keysRef.current.left = down;
      if (k === "arrowright" || k === "d") keysRef.current.right = down;
    };
    const keyDown = (e: KeyboardEvent) => onKey(e, true);
    const keyUp = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
    };
  }, []);

  useEffect(() => {
    for (const hazard of hazardsRef.current) scene.remove(hazard.mesh);
    hazardsRef.current = [];
    runRef.current = { speed: 0.2, spawn: 0 };
    if (carRef.current) carRef.current.position.x = 0;
  }, [sessionId, scene]);

  useEffect(() => {
    return () => {
      for (const hazard of hazardsRef.current) scene.remove(hazard.mesh);
      hazardsRef.current = [];
      ringGeometry.dispose();
      daemonGeometry.dispose();
      ringMaterial.dispose();
      daemonMaterial.dispose();
      carBodyMaterial.dispose();
      carGlowMaterial.dispose();
      wheelMaterial.dispose();
    };
  }, [
    scene,
    ringGeometry,
    daemonGeometry,
    ringMaterial,
    daemonMaterial,
    carBodyMaterial,
    carGlowMaterial,
    wheelMaterial,
  ]);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const store = gameStore.getState();
    const car = carRef.current;
    if (!car || store.gameState !== "playing") return;

    const run = runRef.current;
    run.speed = Math.min(run.speed + dt * 0.01, 0.9);
    run.spawn -= dt;
    if (run.spawn <= 0) {
      run.spawn = Math.max(0.4, 1.4 - run.speed);
      const kind: Hazard["kind"] = Math.random() < 0.42 ? "daemon" : "ring";
      const mesh = new THREE.Mesh(
        kind === "ring" ? ringGeometry : daemonGeometry,
        kind === "ring" ? ringMaterial : daemonMaterial,
      );
      mesh.position.set((Math.random() * 2 - 1) * 5.5, kind === "ring" ? 1.1 : 0.9, -160);
      scene.add(mesh);
      hazardsRef.current.push({ mesh, kind, speed: run.speed });
    }

    if (keysRef.current.left) car.position.x = Math.max(car.position.x - dt * 6, -6);
    if (keysRef.current.right) car.position.x = Math.min(car.position.x + dt * 6, 6);
    car.rotation.z = -car.position.x * 0.05;

    const hazards = hazardsRef.current;
    for (let i = hazards.length - 1; i >= 0; i--) {
      const hazard = hazards[i];
      hazard.mesh.position.z += dt * (18 + hazard.speed * 60);
      if (hazard.mesh.position.z > 8) {
        scene.remove(hazard.mesh);
        hazards.splice(i, 1);
        continue;
      }
      if (hazard.mesh.position.z > 0.2 && hazard.mesh.position.z < 1.2) {
        const dx = Math.abs(hazard.mesh.position.x - car.position.x);
        if (dx < 1.6) {
          if (hazard.kind === "ring") {
            store.incrementScore();
            store.addLog("[SYS] GATE PASSED +1");
          } else {
            store.damageMemory(25);
            store.addLog("[SYS] COLLISION -25% MEM");
          }
          scene.remove(hazard.mesh);
          hazards.splice(i, 1);
        }
      }
    }
  });

  return (
    <group>
      <color attach="background" args={["#0b0f19"]} />
      <ambientLight intensity={1.4} color="#ffffff" />
      <hemisphereLight intensity={1} color="#b4befe" groundColor="#1e2030" />
      <directionalLight position={[12, 20, 8]} intensity={3} color="#ffffff" />
      <gridHelper
        args={[600, 60, "#8aadf4", "#1e2030"]}
        position={[0, -0.6, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <group ref={carRef} position={[0, 0, 0]}>
        <Suspense fallback={<BoxCar bodyMaterial={carBodyMaterial} glowMaterial={carGlowMaterial} wheelMaterial={wheelMaterial} />}>
          <EffectBoundary fallback={<BoxCar bodyMaterial={carBodyMaterial} glowMaterial={carGlowMaterial} wheelMaterial={wheelMaterial} />}>
            <ModelCar />
          </EffectBoundary>
        </Suspense>
      </group>
    </group>
  );
}