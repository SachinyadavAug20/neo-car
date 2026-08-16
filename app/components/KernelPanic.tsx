"use client";

import { useStore } from "zustand";
import { gameStore } from "../store/gameStore";

const TERMINAL_FONT =
  "var(--font-geist-mono), 'Fira Code', 'JetBrains Mono', monospace";

export default function KernelPanic() {
  const panicked = useStore(gameStore, (state) => state.panicked);
  const gameState = useStore(gameStore, (state) => state.gameState);
  const returnToMenu = useStore(gameStore, (state) => state.returnToMenu);

  if (!panicked && gameState !== "gameover") return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black p-4"
      style={{ fontFamily: TERMINAL_FONT, color: "#ff003c" }}
    >
      <div className="max-w-2xl">
        <h2 className="mb-4 text-xl font-bold tracking-[0.15em] text-[#ff003c] sm:text-3xl">
          KERNEL PANIC - not syncing: MEMORY CORRUPTION
        </h2>
        <pre className="mb-6 whitespace-pre-wrap text-xs leading-relaxed text-[#ff003c]/90 sm:text-sm">
{`[   12.34] MEOW_TUI: fatal exception in core module
[   12.34] CPU: 0 PID: 1337 Comm: player
[   12.34] Memory: 0/100 available
[   12.34] RBP: 0xffffffffc0013f00
[   12.34] Kernel Offset: 0x4f0000000
[   12.34] ---[ end Kernel panic - not syncing: MEMORY CORRUPTION ]---`}
        </pre>
        <button
          type="button"
          onClick={returnToMenu}
          className="border border-[#ff003c]/70 bg-black px-4 py-2 text-sm font-bold tracking-[0.15em] text-[#ff003c] shadow-[0_0_18px_rgba(255,0,60,0.4)] transition hover:bg-[#ff003c] hover:text-black active:scale-95"
        >
          &gt; ./return_to_menu.sh
        </button>
      </div>
    </div>
  );
}