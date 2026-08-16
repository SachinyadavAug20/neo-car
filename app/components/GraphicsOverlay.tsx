"use client";

import { useEffect } from "react";
import { useStore } from "zustand";
import { contextStore } from "../store/contextStore";
import { probeWebGL } from "../utils/webglProbe";

export default function GraphicsOverlay() {
  const state = useStore(contextStore, (s) => s.state);
  const diagnostic = useStore(contextStore, (s) => s.diagnostic);

  useEffect(() => {
    if (state === "ok") return;
    contextStore.getState().setDiagnostic(probeWebGL());
  }, [state]);

  if (state === "ok") return null;

  const title =
    state === "lost" ? "GRAPHICS CONTEXT LOST" : "GRAPHICS CONTEXT UNAVAILABLE";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex items-center justify-center p-3">
<div
        className="pointer-events-auto flex max-w-2xl flex-col items-center gap-2 rounded border border-[#f38ba8]/40 bg-[#050505]/95 px-4 py-3 text-center shadow-[0_0_24px_rgba(243,139,168,0.25)]"
        style={{ fontFamily: "var(--font-geist-mono), monospace", color: "#cad3f5" }}
      >
        <p className="text-[10px] font-bold tracking-[0.25em] text-[#f38ba8]">
          &gt; {title}
        </p>
        <p className="max-w-xl text-[10px] leading-relaxed text-[#8aadf4]">
          {state === "lost"
            ? "The WebGL context was lost. If this happens on a fresh tab too, the browser's GPU process has crashed — fully quit the browser (all windows) and reopen it to restart WebGL."
            : "A WebGL context could not be acquired. If this happens on a fresh tab too, the browser's GPU process is unavailable — fully quit the browser (all windows) and reopen it."}
        </p>
        {diagnostic ? (
          <p className="max-w-xl text-[9px] leading-relaxed text-[#cad3f5]/70">
            probe: webgl2={String(diagnostic.webgl2)} webgl1=
            {String(diagnostic.webgl1)} support={diagnostic.support} renderer=
            {diagnostic.renderer}
          </p>
        ) : null}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.open(window.location.href, "_blank")}
            className="cursor-pointer border border-[#94e2d5]/50 px-4 py-1 text-[10px] font-bold tracking-[0.25em] text-[#94e2d5] hover:bg-[#94e2d5]/10"
          >
            &gt; OPEN IN NEW TAB
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="cursor-pointer border border-[#8aadf4]/40 px-4 py-1 text-[10px] font-bold tracking-[0.25em] text-[#8aadf4] hover:bg-[#8aadf4]/10"
          >
            &gt; RELOAD
          </button>
        </div>
      </div>
    </div>
  );
}