"use client";

import { useEffect, useRef } from "react";
import { useStore } from "zustand";
import { gameStore } from "../store/gameStore";

const COLORS = {
  bg: "#0b0f19",
  road: "#141a2e",
  roadEdge: "#8aadf4",
  lane: "#2a3a5e",
  car: "#cad3f5",
  carGlow: "#8aadf4",
  ring: "#94e2d5",
  daemon: "#f38ba8",
  warp: "#1e2030",
};

interface Gate {
  x: number;
  y: number;
  kind: "ring" | "daemon";
  speed: number;
  w: number;
}

export default function GameCanvas2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionId = useStore(gameStore, (s) => s.sessionId);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();
    let gates: Gate[] = [];
    let playerX = 0;
    let speed = 0.14;
    let scroll = 0;
    let spawnTimer = 0;
    let spawnInterval = 1.1;
    const keys = { left: false, right: false };

    const onKey = (e: KeyboardEvent, down: boolean) => {
      const k = e.key.toLowerCase();
      if (k === "arrowleft" || k === "a") keys.left = down;
      if (k === "arrowright" || k === "d") keys.right = down;
    };
    const onKeyDown = (e: KeyboardEvent) => onKey(e, true);
    const onKeyUp = (e: KeyboardEvent) => onKey(e, false);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const resetRun = () => {
      gates = [];
      playerX = 0;
      speed = 0.14;
      scroll = 0;
      spawnTimer = 0;
      spawnInterval = 1.1;
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const W = window.innerWidth;
      const H = window.innerHeight;
      const cx = W / 2;
      const store = gameStore.getState();
      const playing = store.gameState === "playing";

      if (playing) {
        speed = Math.min(speed + dt * 0.004, 0.42);
        scroll += dt * 100;
        if (keys.left) playerX = Math.max(playerX - dt * 1.7, -1);
        if (keys.right) playerX = Math.min(playerX + dt * 1.7, 1);

        spawnTimer += dt;
        if (spawnTimer >= spawnInterval) {
          spawnTimer = 0;
          spawnInterval = Math.max(0.5, 1.1 - (speed - 0.14) * 2.4);
          const kind: Gate["kind"] = Math.random() < 0.42 ? "daemon" : "ring";
          gates.push({
            x: (Math.random() * 2 - 1) * 0.72,
            y: 0,
            kind,
            speed,
            w: kind === "ring" ? 0.28 : 0.34,
          });
        }

        const px = cx + playerX * W * 0.3;
        for (let i = gates.length - 1; i >= 0; i--) {
          const g = gates[i];
          g.y += dt * (0.16 + g.speed * 0.95);
          if (g.y > 1.15) {
            gates.splice(i, 1);
            continue;
          }
          if (g.y > 0.84 && g.y < 0.98) {
            const gx = cx + g.x * W * 0.3;
            const dx = (gx - px) / (W * 0.3);
            const dy = (g.y * H - H * 0.9) / H;
            if (Math.hypot(dx, dy * 1.5) < g.w) {
              if (g.kind === "ring") {
                store.incrementScore();
                store.addLog("[SYS] GATE PASSED +1");
              } else {
                store.damageMemory(25);
                store.addLog("[SYS] COLLISION -25% MEM");
              }
              gates.splice(i, 1);
            }
          }
        }
      }

      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = COLORS.warp;
      ctx.lineWidth = 1;
      const spacing = 90;
      const offset = scroll % spacing;
      for (let y = -spacing + offset; y < H + spacing; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      const halfRoad = W * 0.34;
      ctx.fillStyle = COLORS.road;
      ctx.fillRect(cx - halfRoad, 0, halfRoad * 2, H);

      ctx.strokeStyle = COLORS.roadEdge;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - halfRoad, 0);
      ctx.lineTo(cx - halfRoad, H);
      ctx.moveTo(cx + halfRoad, 0);
      ctx.lineTo(cx + halfRoad, H);
      ctx.stroke();

      ctx.strokeStyle = COLORS.lane;
      ctx.lineWidth = 2;
      ctx.setLineDash([26, 34]);
      ctx.lineDashOffset = -scroll * 1.4;
      for (const fx of [-0.5, 0.5]) {
        const lx = cx + fx * halfRoad * 0.62;
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx, H);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      for (const g of gates) {
        const gx = cx + g.x * W * 0.3;
        const gy = g.y * H;
        if (g.kind === "ring") {
          ctx.strokeStyle = COLORS.ring;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(gx, gy, (W * 0.3 * g.w) / 2, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = COLORS.daemon;
          const s = W * 0.3 * g.w;
          ctx.fillRect(gx - s / 2, gy - s / 2, s, s);
        }
      }

      const px = cx + playerX * W * 0.3;
      const py = H * 0.9;
      const carW = W * 0.09;
      const carH = W * 0.15;
      ctx.save();
      ctx.shadowColor = COLORS.carGlow;
      ctx.shadowBlur = 18;
      ctx.fillStyle = COLORS.car;
      ctx.beginPath();
      ctx.moveTo(px, py - carH);
      ctx.lineTo(px + carW / 2, py);
      ctx.lineTo(px, py + carH / 2);
      ctx.lineTo(px - carW / 2, py);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const start = () => {
      resetRun();
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    start();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [sessionId]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}