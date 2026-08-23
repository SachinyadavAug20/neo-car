"use client";

import { useEffect, useState } from "react";
import { useNarrative } from "@/app/lib/narrativeStore";
import { CHAPTERS } from "@/app/lib/narrative";
import GlitchText from "./GlitchText";

export default function StoryOverlay() {
  const { started, currentChapter, currentBeat, playing, setStoryTextVisible, nextBeat } = useNarrative();
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [effect, setEffect] = useState<"glitch" | "pulse" | "fade" | "shatter" | "ripple" | "typewriter">("fade");
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");
  const [color, setColor] = useState("#fff");
  const [trigger, setTrigger] = useState(false);

  const chapter = CHAPTERS[currentChapter];
  const beat = chapter?.beats[currentBeat];

  useEffect(() => {
    if (!started || !playing || !beat) {
      setVisible(false);
      return;
    }
    setPhase("enter");
    setVisible(true);
    setText(beat.text);
    setSubtitle(beat.subtitle || "");
    setEffect(beat.effect || "fade");
    setColor(chapter.color);
    setStoryTextVisible(true);
    setTrigger((t) => !t);

    const holdTimer = setTimeout(() => {
      setPhase("exit");
    }, beat.duration - 800);

    const exitTimer = setTimeout(() => {
      setStoryTextVisible(false);
      nextBeat();
    }, beat.duration);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
    };
  }, [started, playing, currentChapter, currentBeat, beat]);

  if (!visible || !beat) return null;

  return (
    <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center">
      {/* Ambient glow behind text */}
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          background: `radial-gradient(ellipse at center, ${color}08 0%, transparent 70%)`,
          opacity: phase === "hold" ? 1 : 0,
        }}
      />

      <div
        className={`text-center px-8 max-w-3xl transition-all duration-700 ${
          phase === "enter"
            ? "opacity-0 translate-y-6"
            : phase === "exit"
            ? "opacity-0 -translate-y-6"
            : "opacity-100 translate-y-0"
        }`}
      >
        <GlitchText
          text={text}
          effect={effect}
          trigger={trigger}
          color={color}
          className="text-lg md:text-2xl lg:text-3xl font-display font-light leading-relaxed tracking-wide"
        />
        {subtitle && (
          <div className="mt-6 text-xs md:text-sm text-white/30 tracking-[0.2em] italic">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
