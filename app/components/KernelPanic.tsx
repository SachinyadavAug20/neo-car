"use client";

import { useStore } from "zustand";
import { gameStore } from "../store/gameStore";

const TERMINAL_FONT =
  "var(--font-geist-mono), 'Fira Code', 'JetBrains Mono', monospace";

export default function KernelPanic() {
  const gameState = useStore(gameStore, (state) => state.gameState);
  const finished = useStore(gameStore, (state) => state.finished);
  const score = useStore(gameStore, (state) => state.score);
  const highScore = useStore(gameStore, (state) => state.highScore);
  const reboot = useStore(gameStore, (state) => state.reboot);

  if (gameState !== "gameover") return null;

  const accent = finished ? "#94e2d5" : "#ff003c";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black p-4"
      style={{ fontFamily: TERMINAL_FONT, color: accent }}
    >
      <div className="max-w-2xl">
        <h2 className="mb-4 text-xl font-bold tracking-[0.15em] sm:text-3xl">
          {finished
            ? "TRANSMISSION COMPLETE - RUNWAY CLEARED"
            : "KERNEL PANIC - not syncing: MEMORY CORRUPTION"}
        </h2>
        {finished ? (
          <pre className="mb-6 whitespace-pre-wrap text-xs leading-relaxed opacity-90 sm:text-sm">
{`[   12.34] NEON_DRIVE: final approach acknowledged
[   12.34] CPU: 0 PID: 1337 Comm: player
[   12.34] Final score: ${score}
[   12.34] High score: ${highScore}
[   12.34] status: cleared`}
          </pre>
        ) : (
          <pre className="mb-6 whitespace-pre-wrap text-xs leading-relaxed opacity-90 sm:text-sm">
{`[   12.34] NEON_DRIVE: fatal exception in core module
[   12.34] CPU: 0 PID: 1337 Comm: player
[   12.34] Memory: 0/100 available
[   12.34] Final score: ${score}
[   12.34] High score: ${highScore}
[   12.34] RBP: 0xffffffffc0013f00
[   12.34] Kernel Offset: 0x4f0000000
[   12.34] ---[ end Kernel panic - not syncing: MEMORY CORRUPTION ]---`}
          </pre>
        )}
        <button
          type="button"
          onClick={reboot}
          className="border px-4 py-2 text-sm font-bold tracking-[0.15em] transition active:scale-95"
          style={{
            borderColor: `${accent}70`,
            backgroundColor: "black",
            color: accent,
            boxShadow: `0 0 18px ${accent}66`,
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.backgroundColor = accent;
            event.currentTarget.style.color = "black";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.backgroundColor = "black";
            event.currentTarget.style.color = accent;
          }}
        >
          &gt; ./reboot.sh
        </button>
      </div>
    </div>
  );
}