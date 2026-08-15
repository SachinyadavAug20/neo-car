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
  const { play, pause, getState, subscribe } = useAudioAnalyzer();
  const flashRef = useRef<HTMLDivElement>(null);
  const bootedRef = useRef(false);
  const log = useStore(gameStore, (state) => state.log);
  const [playState, setPlayState] = useState<PlayState>("paused");
  const [driveMode, setDriveMode] = useState<DriveMode>("CRUISE");
  const [cpu, setCpu] = useState(34);
  const [ram, setRam] = useState(48);

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
      setRam(35 + Math.random() * 60);
    }, 1200);
    return () => clearInterval(id);
  }, []);

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

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-4 sm:p-6"
      style={{
        fontFamily: TERMINAL_FONT,
        color: "#00ff41",
        backgroundColor: "#050505",
      }}
    >
      <header className="flex items-start justify-between">
        <div>
          <p className="mb-1 text-[10px] font-bold tracking-[0.2em] text-[#ffb000] sm:text-xs">
            +---[ MEOW_TUI v0.1 ]---+
          </p>
          <h1 className="text-3xl font-bold tracking-[0.15em] text-[#00ff41] drop-shadow-[0_0_12px_rgba(0,255,65,0.5)] sm:text-5xl">
            &gt; NEON_DRIVE<span className="animate-pulse">_</span>
          </h1>
        </div>

        <div className="pointer-events-auto flex flex-col items-end gap-3">
          <span className="rounded border border-[#00ff41]/40 bg-black px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-[#00ff41] sm:text-xs">
            {playState === "playing" ? "[LIVE]" : "[STANDBY]"}
          </span>
          <button
            type="button"
            onClick={enterTheGrid}
            className="border border-[#ffb000]/60 bg-black px-4 py-2 text-xs font-bold tracking-[0.15em] text-[#ffb000] shadow-[0_0_18px_rgba(255,176,0,0.35)] transition hover:bg-[#ffb000] hover:text-black active:scale-95 sm:text-sm"
          >
            &gt; ./execute_warp.sh
          </button>
        </div>
      </header>

      <section className="flex w-full justify-end">
        <aside className="pointer-events-auto w-full max-w-xs rounded border border-[#00ff41]/30 bg-black/80 p-3 shadow-[0_0_24px_rgba(0,255,65,0.1)]">
          <p className="mb-2 text-[10px] font-bold tracking-[0.2em] text-[#ffb000]">
            +--[ STDOUT ]--+
          </p>
          <div className="max-h-36 overflow-hidden text-[11px] leading-relaxed text-[#00ff41]">
            {log.map((line, index) => (
              <p key={`${line}-${index}`} className="whitespace-pre-wrap break-all">
                {line}
              </p>
            ))}
          </div>

          <div className="mt-3 border-t border-[#00ff41]/20 pt-2 text-[10px] text-[#ffb000]">
            <p className="mb-1 tracking-[0.15em]">
              CPU {Math.round(cpu)}%&nbsp;&nbsp;MEM {Math.round(ram)}%
            </p>
            <div className="mb-1 h-1.5 w-full overflow-hidden rounded border border-[#00ff41]/40 bg-black">
              <div
                className="h-full bg-[#ffb000] transition-all duration-700"
                style={{ width: `${cpu}%` }}
              />
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded border border-[#00ff41]/40 bg-black">
              <div
                className="h-full bg-[#00ff41] transition-all duration-700"
                style={{ width: `${ram}%` }}
              />
            </div>
          </div>
        </aside>
      </section>

      <footer className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <section className="pointer-events-auto w-full max-w-md rounded border border-[#00ff41]/30 bg-black/80 p-4 shadow-[0_0_24px_rgba(0,255,65,0.12)]">
          <div className="mb-3 flex items-center justify-between text-[10px] font-bold tracking-[0.2em] text-[#ffb000]">
            <span>NIGHT_CRUISER_RADIO.EXE</span>
            <span>{playState === "playing" ? "● RUNNING" : "● PAUSED"}</span>
          </div>

          <div className="mb-4 h-1.5 w-full overflow-hidden rounded border border-[#00ff41]/40 bg-black">
            <div
              className={
                playState === "playing"
                  ? "h-full w-2/3 rounded bg-[#00ff41]"
                  : "h-full w-1/3 rounded bg-[#ffb000]"
              }
            />
          </div>

          <div className="flex items-center justify-center gap-4 text-sm">
            <button
              type="button"
              aria-label="Previous track"
              className="rounded border border-[#00ff41]/30 px-2 py-1 text-[#00ff41]/60 transition hover:border-[#00ff41] hover:text-[#00ff41]"
            >
              &lt;&lt;
            </button>

            <button
              type="button"
              onClick={togglePlay}
              aria-label={playState === "playing" ? "Pause" : "Play"}
              className="rounded border border-[#00ff41]/60 bg-black px-4 py-1.5 font-bold text-[#00ff41] shadow-[0_0_14px_rgba(0,255,65,0.35)] transition hover:bg-[#00ff41] hover:text-black active:scale-95"
            >
              {playState === "playing" ? "[II PAUSE]" : "[&gt; PLAY]"}
            </button>

            <button
              type="button"
              aria-label="Next track"
              className="rounded border border-[#00ff41]/30 px-2 py-1 text-[#00ff41]/60 transition hover:border-[#00ff41] hover:text-[#00ff41]"
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
                ? "border-[#ffb000]/70 bg-black text-[#ffb000] shadow-[0_0_18px_rgba(255,176,0,0.4)]"
                : "border-[#00ff41]/50 bg-black text-[#00ff41] shadow-[0_0_18px_rgba(0,255,65,0.3)]"
            }`}
          >
            {isTurbo ? "&gt; ./set_mode TURBO" : "&gt; ./set_mode CRUISE"}
          </button>
        </section>
      </footer>

      <div
        ref={flashRef}
        className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-black opacity-0"
      >
        <span className="text-4xl font-bold tracking-[0.3em] text-[#00ff41] drop-shadow-[0_0_20px_rgba(0,255,65,0.8)] sm:text-6xl">
          MEOW_TUI::WARP_EXEC
        </span>
      </div>
    </div>
  );
}