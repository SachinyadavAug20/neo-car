"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useStore } from "zustand";
import { useAudioAnalyzer } from "../hooks/useAudioAnalyzer";
import { getCamera } from "../lib/cameraStore";
import { gameStore } from "../store/gameStore";

type PlayState = "playing" | "paused";
type DriveMode = "CRUISE" | "TURBO";

const TERMINAL_FONT =
  "var(--font-geist-mono), 'Fira Code', 'JetBrains Mono', monospace";

export default function HUD() {
  const router = useRouter();
  const { play, pause, getState, subscribe, nextTrack, prevTrack, getProgress } =
    useAudioAnalyzer();
  const flashRef = useRef<HTMLDivElement>(null);
  const bootedRef = useRef(false);
  const log = useStore(gameStore, (state) => state.log);
  const memory = useStore(gameStore, (state) => state.memory);
  const gameState = useStore(gameStore, (state) => state.gameState);
  const highScore = useStore(gameStore, (state) => state.highScore);
  const outOfBounds = useStore(gameStore, (state) => state.outOfBounds);
  const oobTimer = useStore(gameStore, (state) => state.oobTimer);
  const [playState, setPlayState] = useState<PlayState>("paused");
  const [driveMode, setDriveMode] = useState<DriveMode>("CRUISE");
  const [cpu, setCpu] = useState(34);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    return subscribe(setPlayState);
  }, [subscribe]);

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    const { addLog } = gameStore.getState();
    addLog("[SYS] MEOW_TUI_OS v0.1 BOOT");
    addLog("[SYS] HYPR_WM WM_LOADED");
    addLog("[SYS] AUDIO_STREAM READY");
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setCpu(18 + Math.random() * 82);
    }, 1200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (playState !== "playing") return;
      const next = getProgress() * 100;
      setProgress((prev) => (Math.abs(prev - next) < 0.05 ? prev : next));
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playState, getProgress]);

  const togglePlay = () => {
    if (getState() === "playing") pause();
    else play();
  };

  const toggleMode = () =>
    setDriveMode((prev) => (prev === "CRUISE" ? "TURBO" : "CRUISE"));

  const enterTheGrid = () => {
    const camera = getCamera();
    const flash = flashRef.current;
    const timeline = gsap.timeline();

    if (camera) {
      timeline.to(camera, {
        fov: 150,
        duration: 0.9,
        ease: "expo.in",
        onUpdate: () => camera.updateProjectionMatrix(),
      });
    }

    if (flash) {
      timeline.fromTo(
        flash,
        { opacity: 0 },
        { opacity: 1, duration: 0.6, ease: "power2.in" },
        0,
      );
    }

    timeline.call(() => {
      if (camera) {
        camera.fov = 50;
        camera.updateProjectionMatrix();
      }
    });

    timeline.add(() => router.push("/explore"), 0.65);
  };

  const isTurbo = driveMode === "TURBO";

  if (gameState !== "playing") return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-4 sm:p-6"
      style={{
        fontFamily: TERMINAL_FONT,
        color: "#cad3f5",
      }}
    >
      <header className="flex items-start justify-between">
        <div className="pointer-events-auto rounded border border-[#8aadf4]/30 bg-[#1e2030]/70 p-3 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="mb-1 text-[10px] font-bold tracking-[0.2em] text-[#cba6f7] sm:text-xs">
                +---[ MEOW_TUI v0.1 ]---+
              </p>
              <h1 className="text-3xl font-bold tracking-[0.15em] text-[#b4befe] drop-shadow-[0_0_12px_rgba(180,190,254,0.45)] sm:text-5xl">
                &gt; NEON_DRIVE_
              </h1>
            </div>

            <div className="flex flex-col items-end gap-3">
              <span className="rounded border border-[#8aadf4]/40 bg-[#1e2030] px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-[#b4befe] sm:text-xs">
                {playState === "playing" ? "[LIVE]" : "[STANDBY]"}
              </span>
              <button
                type="button"
                onClick={enterTheGrid}
                className="border border-[#cba6f7]/60 bg-[#1e2030] px-4 py-2 text-xs font-bold tracking-[0.15em] text-[#cba6f7] shadow-[0_0_18px_rgba(203,166,247,0.3)] transition hover:bg-[#cba6f7] hover:text-[#1e2030] active:scale-95 sm:text-sm"
              >
                &gt; ./execute_warp.sh
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="flex w-full justify-end">
        <aside className="pointer-events-auto w-full max-w-xs rounded border border-[#8aadf4]/30 bg-[#1e2030]/80 p-3 shadow-[0_0_24px_rgba(138,173,244,0.12)] backdrop-blur-md">
          <p className="mb-2 text-[10px] font-bold tracking-[0.2em] text-[#cba6f7]">
            +--[ STDOUT ]--+
          </p>
          <div
            className="max-h-36 overflow-hidden text-[11px] leading-relaxed text-[#a5adcb]"
            style={{ textShadow: "1px 1px 2px black" }}
          >
            {log.map((line, index) => (
              <p key={`${line}-${index}`} className="whitespace-pre-wrap break-all">
                {line}
              </p>
            ))}
          </div>

          <div className="mt-3 border-t border-[#8aadf4]/20 pt-2 text-[10px] text-[#cba6f7]">
            <p className="mb-1 tracking-[0.15em]">
              CPU {Math.round(cpu)}%&nbsp;&nbsp;MEM {Math.round(memory)}%
            </p>
            <div className="mb-1 h-1.5 w-full overflow-hidden rounded border border-[#cba6f7]/40 bg-[#1e2030]">
              <div
                className="h-full bg-[#cba6f7] transition-all duration-700"
                style={{ width: `${cpu}%` }}
              />
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded border border-[#f38ba8]/50 bg-[#1e2030]">
              <div
                className="h-full bg-[#f38ba8] transition-all duration-700"
                style={{ width: `${memory}%` }}
              />
            </div>
          </div>

          <div className="mt-2 border-t border-[#8aadf4]/20 pt-2 text-[10px] text-[#94e2d5]">
            <p className="tracking-[0.15em]">
              HIGH_SCORE: {highScore.toString().padStart(6, "0")}
            </p>
          </div>
        </aside>
      </section>

      <footer className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <section className="pointer-events-auto w-full max-w-md rounded border border-[#8aadf4]/30 bg-[#1e2030]/80 p-4 shadow-[0_0_24px_rgba(138,173,244,0.12)] backdrop-blur-md">
          <div className="mb-3 flex items-center justify-between text-[10px] font-bold tracking-[0.2em] text-[#cba6f7]">
            <span>NIGHT_CRUISER_RADIO.EXE</span>
            <span>{playState === "playing" ? "● RUNNING" : "● PAUSED"}</span>
          </div>

          <div className="mb-4 h-1.5 w-full overflow-hidden rounded border border-[#8aadf4]/40 bg-[#1e2030]">
            <div
              className={
                playState === "playing"
                  ? "h-full rounded bg-[#b4befe]"
                  : "h-full rounded bg-[#cba6f7]"
              }
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-center gap-4 text-sm">
            <button
              type="button"
              onClick={prevTrack}
              aria-label="Previous track"
              className="rounded border border-[#8aadf4]/30 px-2 py-1 text-[#cad3f5]/60 transition hover:border-[#8aadf4] hover:text-[#cad3f5]"
            >
              &lt;&lt;
            </button>

            <button
              type="button"
              onClick={togglePlay}
              aria-label={playState === "playing" ? "Pause" : "Play"}
              className="rounded border border-[#8aadf4]/60 bg-[#1e2030] px-4 py-1.5 font-bold text-[#cad3f5] shadow-[0_0_14px_rgba(138,173,244,0.3)] transition hover:bg-[#8aadf4] hover:text-[#1e2030] active:scale-95"
            >
              {playState === "playing" ? "[II PAUSE]" : "[> PLAY]"}
            </button>

            <button
              type="button"
              onClick={nextTrack}
              aria-label="Next track"
              className="rounded border border-[#8aadf4]/30 px-2 py-1 text-[#cad3f5]/60 transition hover:border-[#8aadf4] hover:text-[#cad3f5]"
            >
              &gt;&gt;
            </button>
          </div>
        </section>

        <section className="pointer-events-auto flex items-center gap-3">
          <button
            type="button"
            onClick={toggleMode}
            aria-pressed={isTurbo}
            className={`border px-4 py-2 text-xs font-bold tracking-[0.15em] transition hover:scale-105 active:scale-95 sm:text-sm ${
              isTurbo
                ? "border-[#f5bde6]/70 bg-[#1e2030] text-[#f5bde6] shadow-[0_0_18px_rgba(245,189,230,0.35)]"
                : "border-[#8aadf4]/50 bg-[#1e2030] text-[#8aadf4] shadow-[0_0_18px_rgba(138,173,244,0.25)]"
            }`}
          >
            {isTurbo ? "> ./set_mode TURBO" : "> ./set_mode CRUISE"}
          </button>
        </section>
      </footer>

      {outOfBounds && (
        <div className="pointer-events-none fixed inset-0 z-[55] flex items-center justify-center bg-[#ff003c]/15 animate-pulse">
          <div className="text-center">
            <p className="mb-4 text-lg font-bold tracking-[0.3em] text-[#ff003c] drop-shadow-[0_0_20px_rgba(255,0,60,0.8)] sm:text-2xl">
              [ WARNING: SIGNAL DEGRADATION ]
            </p>
            <p className="text-3xl font-black tracking-[0.2em] text-[#ff003c] drop-shadow-[0_0_30px_rgba(255,0,60,0.9)] sm:text-5xl">
              RETURN TO GRID IN: {oobTimer.toFixed(1)}s
            </p>
            <p className="mt-4 text-xs tracking-[0.25em] text-[#ff003c]/70 sm:text-sm">
              LATERAL DRIFT EXCEEDS SAFE CORRIDOR
            </p>
          </div>
        </div>
      )}

      <div
        ref={flashRef}
        className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-black opacity-0"
      >
        <span className="text-4xl font-bold tracking-[0.3em] text-[#b4befe] drop-shadow-[0_0_20px_rgba(180,190,254,0.7)] sm:text-6xl">
          MEOW_TUI::WARP_EXEC
        </span>
      </div>
    </div>
  );
}