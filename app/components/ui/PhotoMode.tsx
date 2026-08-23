"use client";

import { useState, useCallback } from "react";
import { Camera, Download, X } from "lucide-react";
import { useNarrative } from "@/app/lib/narrativeStore";

export default function PhotoMode() {
  const { started } = useNarrative();
  const [active, setActive] = useState(false);
  const [flash, setFlash] = useState(false);
  const [captured, setCaptured] = useState<string | null>(null);

  const capture = useCallback(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    const dataUrl = canvas.toDataURL("image/png");
    setCaptured(dataUrl);
  }, []);

  const download = useCallback(() => {
    if (!captured) return;
    const a = document.createElement("a");
    a.href = captured;
    a.download = `drift-${Date.now()}.png`;
    a.click();
  }, [captured]);

  return (
    <>
      {/* Photo mode button */}
      {!active && (
        <button
          onClick={() => setActive(true)}
          className="fixed top-6 right-20 z-40 glass p-3 rounded-full text-white/30 hover:text-white/60 transition-colors pointer-events-auto"
          title="Photo Mode (P)"
        >
          <Camera size={16} />
        </button>
      )}

      {/* Photo mode HUD */}
      {active && (
        <div className="fixed inset-0 z-[60] pointer-events-none">
          {/* Flash effect */}
          {flash && (
            <div className="absolute inset-0 bg-white/80 animate-pulse z-[70]" />
          )}

          {/* Viewfinder frame */}
          <div className="absolute inset-8 border border-white/10 rounded-lg" />
          <div className="absolute top-12 left-12 text-[10px] tracking-[0.3em] text-white/20">
            PHOTO MODE
          </div>
          <div className="absolute bottom-12 right-12 text-[10px] tracking-[0.3em] text-white/20">
            {new Date().toLocaleDateString()}
          </div>

          {/* Corner marks */}
          {[
            "top-8 left-8",
            "top-8 right-8 rotate-90",
            "bottom-8 left-8 -rotate-90",
            "bottom-8 right-8 rotate-180",
          ].map((pos, i) => (
            <div key={i} className={`absolute ${pos} w-6 h-6 border-t border-l border-white/20`} />
          ))}

          {/* Controls */}
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-4 pointer-events-auto">
            <button
              onClick={capture}
              className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center hover:border-white/60 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors" />
            </button>
          </div>
          <button
            onClick={() => { setActive(false); setCaptured(null); }}
            className="absolute top-12 right-12 pointer-events-auto text-white/30 hover:text-white/60"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Captured preview */}
      {captured && !active && (
        <div className="fixed bottom-20 right-20 z-50 glass rounded-xl p-3 pointer-events-auto animate-fadeIn">
          <img src={captured} alt="Captured" className="w-32 h-20 object-cover rounded-lg" />
          <div className="flex gap-2 mt-2">
            <button
              onClick={download}
              className="flex-1 flex items-center justify-center gap-1 text-[10px] text-white/40 hover:text-white/70 py-1"
            >
              <Download size={10} />
              SAVE
            </button>
            <button
              onClick={() => setCaptured(null)}
              className="flex-1 text-[10px] text-white/30 hover:text-white/60 py-1"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </>
  );
}
