"use client";

import { useEffect, useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Gauge,
} from "lucide-react";
import { useAudioAnalyzer } from "../hooks/useAudioAnalyzer";

type PlayState = "playing" | "paused";
type DriveMode = "CRUISE" | "TURBO";

export default function HUD() {
  const { play, pause, getState, subscribe } = useAudioAnalyzer();
  const [playState, setPlayState] = useState<PlayState>("paused");
  const [driveMode, setDriveMode] = useState<DriveMode>("CRUISE");

  useEffect(() => {
    return subscribe(setPlayState);
  }, [subscribe]);

  const togglePlay = () => {
    if (getState() === "playing") pause();
    else play();
  };

  const toggleMode = () =>
    setDriveMode((prev) => (prev === "CRUISE" ? "TURBO" : "CRUISE"));

  const isTurbo = driveMode === "TURBO";

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-6 text-white sm:p-10">
      <header className="flex items-start justify-between">
        <div>
          <p className="mb-1 text-[10px] font-semibold tracking-[0.5em] text-cyan-300/80 sm:text-xs">
            SYNTHWAVE · AUDIO-REACTIVE
          </p>
          <h1 className="bg-gradient-to-r from-fuchsia-400 via-pink-400 to-cyan-300 bg-clip-text text-4xl font-black tracking-[0.25em] text-transparent drop-shadow-[0_0_14px_rgba(255,45,149,0.7)] sm:text-6xl">
            NEON DRIVE
          </h1>
        </div>

        <span className="rounded-full border border-fuchsia-400/40 bg-fuchsia-950/40 px-3 py-1 text-[10px] font-semibold tracking-[0.3em] text-fuchsia-300 backdrop-blur-sm sm:text-xs">
          {playState === "playing" ? "LIVE" : "STANDBY"}
        </span>
      </header>

      <footer className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <section className="pointer-events-auto w-full max-w-md rounded-2xl border border-white/10 bg-black/40 p-4 shadow-[0_0_30px_rgba(255,45,149,0.15)] backdrop-blur-md">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-[0.3em] text-white/50">
              NIGHT CRUISER RADIO
            </span>
            <Volume2 className="h-4 w-4 text-cyan-300" />
          </div>

          <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={
                playState === "playing"
                  ? "h-full w-2/3 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400"
                  : "h-full w-1/3 rounded-full bg-white/30"
              }
            />
          </div>

          <div className="flex items-center justify-center gap-5">
            <button
              type="button"
              aria-label="Previous track"
              className="rounded-full p-2 text-white/60 transition hover:text-cyan-300"
            >
              <SkipBack className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={togglePlay}
              aria-label={playState === "playing" ? "Pause" : "Play"}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white shadow-[0_0_24px_rgba(255,45,149,0.6)] transition hover:scale-105 active:scale-95"
            >
              {playState === "playing" ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="ml-0.5 h-6 w-6" />
              )}
            </button>

            <button
              type="button"
              aria-label="Next track"
              className="rounded-full p-2 text-white/60 transition hover:text-cyan-300"
            >
              <SkipForward className="h-5 w-5" />
            </button>
          </div>
        </section>

        <section className="pointer-events-auto flex items-center gap-3">
          <button
            type="button"
            onClick={toggleMode}
            aria-pressed={isTurbo}
            className={`flex items-center gap-2 rounded-full border px-5 py-2.5 font-bold tracking-[0.2em] backdrop-blur-md transition hover:scale-105 active:scale-95 ${
              isTurbo
                ? "border-pink-400/60 bg-pink-500/20 text-pink-300 shadow-[0_0_20px_rgba(255,45,149,0.5)]"
                : "border-cyan-400/50 bg-cyan-500/10 text-cyan-300 shadow-[0_0_20px_rgba(0,229,255,0.35)]"
            }`}
          >
            <Gauge className="h-4 w-4" />
            {driveMode}
          </button>
        </section>
      </footer>
    </div>
  );
}