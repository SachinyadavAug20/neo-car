"use client";

import { useState } from "react";
import { Settings, Zap, Eye, Sparkles } from "lucide-react";

type Quality = "low" | "medium" | "high";

export default function QualitySettings() {
  const [quality, setQuality] = useState<Quality>("high");
  const [open, setOpen] = useState(false);

  const settings = {
    low: { label: "Performance", icon: Zap, desc: "Best FPS", particles: "minimal", postfx: false },
    medium: { label: "Balanced", icon: Eye, desc: "Good mix", particles: "normal", postfx: true },
    high: { label: "Quality", icon: Sparkles, desc: "Best visuals", particles: "maximum", postfx: true },
  };

  return (
    <div className="fixed top-6 right-28 z-40 pointer-events-auto">
      <button
        onClick={() => setOpen(!open)}
        className="glass p-3 rounded-full text-white/30 hover:text-white/60 transition-colors"
      >
        <Settings size={16} />
      </button>

      {open && (
        <div className="absolute top-12 right-0 glass rounded-xl p-3 w-48 animate-fadeIn">
          <div className="text-[10px] tracking-[0.3em] text-white/30 mb-2">QUALITY</div>
          {(["low", "medium", "high"] as Quality[]).map((q) => {
            const s = settings[q];
            const Icon = s.icon;
            return (
              <button
                key={q}
                onClick={() => { setQuality(q); setOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  quality === q ? "bg-white/5" : "hover:bg-white/3"
                }`}
              >
                <Icon size={12} className={quality === q ? "text-cyan-400" : "text-white/30"} />
                <div>
                  <div className="text-[10px] tracking-[0.15em] text-white/50">{s.label}</div>
                  <div className="text-[8px] text-white/20">{s.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
