"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import gsap from "gsap";
import { NarrativeState, getCurrentAct, getCurrentBeat, nextBeat, STORY_ACTS } from "@/app/lib/narrative";
import EndScreen from "./EndScreen";
import HowToPlay from "./HowToPlay";
import { JourneyStats } from "@/app/lib/useJourneyTracker";

interface NarrativeOverlayProps {
  state: NarrativeState;
  onAdvance: (newState: NarrativeState) => void;
  onInteractionProgress: (progress: number) => void;
  onInteractionComplete: () => void;
  journeyStats?: JourneyStats;
  onRestart?: () => void;
}

export default function NarrativeOverlay({
  state, onAdvance, onInteractionProgress, onInteractionComplete,
  journeyStats, onRestart = () => window.location.reload(),
}: NarrativeOverlayProps) {
  const textRef = useRef<HTMLDivElement>(null);
  const charRef = useRef<HTMLDivElement>(null);
  const actTitleRef = useRef<HTMLDivElement>(null);
  const interactionUIRef = useRef<HTMLDivElement>(null);
  const [showEnd, setShowEnd] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [flashOpacity, setFlashOpacity] = useState(0);
  const [floatTexts, setFloatTexts] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const floatIdRef = useRef(0);
  const startTimeRef = useRef(Date.now());
  const stateRef = useRef(state);
  stateRef.current = state;
  const onAdvanceRef = useRef(onAdvance);
  onAdvanceRef.current = onAdvance;
  const timerRef = useRef<HTMLSpanElement>(null);

  const act = getCurrentAct(state);
  const beat = getCurrentBeat(state);
  const isInteraction = beat?.interaction && beat.interaction !== "none" && state.interactionState !== "complete";

  useEffect(() => {
    if (state.ended) return;
    const interval = setInterval(() => {
      if (!timerRef.current) return;
      const secs = Math.floor((Date.now() - startTimeRef.current) / 1000);
      timerRef.current.textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
    }, 1000);
    return () => clearInterval(interval);
  }, [state.ended]);

  useEffect(() => {
    const handler = () => {
      setFlashOpacity(0.15);
      setTimeout(() => setFlashOpacity(0), 120);
      const id = floatIdRef.current++;
      const x = 40 + Math.random() * 20;
      const y = 40 + Math.random() * 10;
      setFloatTexts((prev) => [...prev, { id, x, y }]);
      setTimeout(() => setFloatTexts((prev) => prev.filter((t) => t.id !== id)), 1000);
    };
    window.addEventListener("milo-jump", handler);
    return () => window.removeEventListener("milo-jump", handler);
  }, []);

  useEffect(() => {
    if (!beat || !textRef.current) return;
    const tl = gsap.timeline();
    gsap.set(textRef.current, { opacity: 0, y: 8 });
    gsap.set(charRef.current, { opacity: 0, y: 6 });
    tl.to(textRef.current, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" })
      .to(charRef.current, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }, "-=0.2");
    return () => { tl.kill(); };
  }, [state.currentAct, state.currentBeat]);

  useEffect(() => {
    if (!act || !actTitleRef.current) return;
    const tl = gsap.timeline();
    gsap.set(actTitleRef.current, { opacity: 0, y: -8 });
    tl.to(actTitleRef.current, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" })
      .to(actTitleRef.current, { opacity: 0, duration: 0.4, delay: 2.5 });
    return () => { tl.kill(); };
  }, [state.currentAct]);

  useEffect(() => {
    if (!interactionUIRef.current) return;
    if (isInteraction) {
      gsap.fromTo(interactionUIRef.current, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" });
      window.dispatchEvent(new CustomEvent("interaction-start"));
    }
  }, [isInteraction, state.interactionState]);

  useEffect(() => {
    if (state.ended) setTimeout(() => setShowEnd(true), 2500);
  }, [state.ended]);

  const handleSkip = useCallback(() => {
    const s = stateRef.current;
    if (s.isAnimating) return;
    const b = getCurrentBeat(s);
    if (b?.interaction && b.interaction !== "none" && s.interactionState !== "complete") return;
    const beatSounds: Record<string, string> = {
      "click-jump": "coin-collect", "drag-wind": "whoosh-fast", "click-unfold": "paper-shower",
      "click-reveal": "discovery", "collect-leaves": "leaf-rustle", "toggle-cells": "ding",
      "row-boat": "splash", "celebrate": "joy", "follow-butterfly": "wind-chime",
    };
    window.dispatchEvent(new CustomEvent(beatSounds[b?.interaction || ""] || "success"));
    onAdvanceRef.current(nextBeat(s));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); handleSkip(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSkip]);

  const [fadeOpacity, setFadeOpacity] = useState(0);
  useEffect(() => {
    if (state.ended) {
      gsap.to({}, { duration: 2.5, onUpdate: function () { setFadeOpacity(this.progress()); }, ease: "power2.inOut" });
    }
  }, [state.ended]);

  if (showEnd) {
    return (
      <EndScreen
        stats={journeyStats || {
          startTime: Date.now() - 1000, endTime: Date.now(),
          totalClicks: 0, totalKeys: 0, totalMouseMoveDistance: 0,
          actTimes: [0, 0, 0, 0, 0, 0, 0, 0], actClicks: [0, 0, 0, 0, 0, 0, 0, 0],
          actInteractions: [0, 0, 0, 0, 0, 0, 0, 0], actBeatCount: [0, 0, 0, 0, 0, 0, 0, 0],
          secretsFound: [], currentAct: 7, loreCollected: 0, charactersMet: [],
          jumpsMade: 0, windGenerated: 0, leavesCollected: 0, cellsToggled: 0,
          boatStrokes: 0, butterfliesFollowed: 0, cranesReleased: 0,
          shattersTriggered: 0, pendulumsPushed: 0, crittersFound: 0, foldsUnlocked: false,
        }}
        onRestart={onRestart}
      />
    );
  }

  const progress = beat?.interactionTarget ? state.interactionProgress / beat.interactionTarget : 0;

  // Shared card style
  const card = {
    background: "var(--bg-card)",
    border: "2px solid var(--border)",
    color: "var(--text)",
    transition: "background 0.3s, color 0.3s, border-color 0.3s",
  } as const;

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 20, fontFamily: "Georgia, serif" }}>
      {/* Screen flash */}
      <div style={{
        position: "absolute", inset: 0, background: "var(--accent)",
        opacity: flashOpacity, transition: "opacity 0.12s", pointerEvents: "none",
      }} />

      {/* Floating "+1" */}
      {floatTexts.map((t) => (
        <div key={t.id} style={{
          position: "absolute", left: `${t.x}%`, top: `${t.y}%`,
          fontSize: 24, fontWeight: 700, color: "var(--accent)",
          textShadow: "0 1px 4px var(--shadow-color)",
          animation: "floatUp 1s ease-out forwards", pointerEvents: "none",
        }}>
          +1
        </div>
      ))}

      {/* Cinematic fade */}
      {state.ended && (
        <div style={{
          position: "absolute", inset: 0, background: "var(--bg)",
          opacity: fadeOpacity, pointerEvents: "none", zIndex: 100,
          transition: "background 0.3s",
        }} />
      )}

      {/* Act title */}
      {act && (
        <div ref={actTitleRef} style={{
          position: "absolute", top: "18%", left: 0, right: 0, textAlign: "center",
          opacity: 0, pointerEvents: "none",
        }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 8, fontWeight: 600, transition: "color 0.3s" }}>
            Act {state.currentAct + 1}
          </div>
          <div style={{ fontSize: 28, fontWeight: "bold", color: "var(--text)", letterSpacing: -1, transition: "color 0.3s" }}>
            {act.title}
          </div>
          <div style={{ fontSize: 14, color: "var(--text-muted)", fontStyle: "italic", marginTop: 8, opacity: 0.6, transition: "color 0.3s" }}>
            {act.subtitle}
          </div>
        </div>
      )}

      {/* Story progress bar */}
      {!state.ended && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 3,
          background: "var(--border-light)", transition: "background 0.3s",
        }}>
          <div style={{
            height: "100%",
            width: `${((state.currentAct + (state.currentBeat / (act?.beats.length || 1))) / STORY_ACTS.length) * 100}%`,
            background: "var(--accent)",
            transition: "width 0.5s ease-out, background 0.3s",
          }} />
        </div>
      )}

      {/* Bottom section */}
      {beat && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "0 20px 28px",
        }}>
          {/* Interaction prompt */}
          {isInteraction && (
            <div ref={interactionUIRef} style={{ marginBottom: 14, opacity: 0 }}>
              <div style={{ ...card, borderRadius: 12, padding: "12px 20px", boxShadow: "3px 3px 0 var(--shadow)", textAlign: "center", maxWidth: 360 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                  {beat.interaction === "click-jump" && "Click to make Milo jump"}
                  {beat.interaction === "drag-wind" && "Click and drag to create wind"}
                  {beat.interaction === "click-unfold" && "Click the glowing paper"}
                  {beat.interaction === "collect-leaves" && "Collect the glowing leaves"}
                  {beat.interaction === "toggle-cells" && "Click cells to awaken the pattern"}
                  {beat.interaction === "row-boat" && "Click rapidly to row"}
                  {beat.interaction === "celebrate" && "Click to release cranes"}
                  {beat.interaction === "follow-butterfly" && "Follow the butterfly"}
                </div>
                {(beat.interaction === "click-jump" || beat.interaction === "collect-leaves" || beat.interaction === "celebrate" || beat.interaction === "follow-butterfly") && (
                  <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                    {Array.from({ length: beat.interactionTarget || 5 }).map((_, i) => (
                      <div key={i} style={{
                        width: 8, height: 8, borderRadius: "50%", border: "1.5px solid var(--border)",
                        background: i < state.interactionProgress
                          ? (beat.interaction === "celebrate" ? ["#fbbf24", "#f472b6", "#a78bfa"][i % 3]
                            : beat.interaction === "collect-leaves" ? "#22c55e"
                            : beat.interaction === "follow-butterfly" ? "#a78bfa"
                            : "var(--accent)")
                          : "transparent",
                        transition: "background 0.2s, border-color 0.3s",
                      }} />
                    ))}
                  </div>
                )}
                {(beat.interaction === "drag-wind" || beat.interaction === "toggle-cells" || beat.interaction === "row-boat") && (
                  <>
                    <div style={{ width: 120, height: 5, background: "var(--border-light)", borderRadius: 3, overflow: "hidden", margin: "0 auto", transition: "background 0.3s" }}>
                      <div style={{
                        width: `${progress * 100}%`, height: "100%", borderRadius: 3,
                        background: beat.interaction === "toggle-cells" ? "#a78bfa" : beat.interaction === "row-boat" ? "#67e8f9" : "var(--text)",
                        transition: "width 0.1s",
                      }} />
                    </div>
                    <div style={{ fontSize: 10, marginTop: 4, fontWeight: 600, color: "var(--text-muted)" }}>
                      {state.interactionProgress} / {beat.interactionTarget}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Story text card */}
          <div style={{
            ...card, maxWidth: 480, width: "100%", textAlign: "center",
            borderRadius: 12, padding: "16px 24px", boxShadow: "3px 3px 0 var(--shadow)",
            marginBottom: 12,
          }}>
            <div ref={textRef} style={{ fontSize: 15, lineHeight: 1.7, opacity: 0 }}>
              {beat.text}
            </div>
            <div ref={charRef} style={{
              fontSize: 11, marginTop: 8, fontStyle: "italic", opacity: 0,
              fontWeight: 700, textTransform: "lowercase", letterSpacing: 0.5, color: "var(--text-muted)",
            }}>
              {beat.character && beat.character !== "narrator" && beat.character !== "prompt"
                ? `-- ${beat.character}` : ""}
            </div>
          </div>

          {/* Continue button */}
          {!isInteraction && !state.isAnimating && (
            <button onClick={handleSkip}
              onMouseEnter={() => window.dispatchEvent(new CustomEvent("button-hover"))}
              onMouseLeave={() => window.dispatchEvent(new CustomEvent("hover-out"))}
              style={{
                ...card, borderRadius: 10, padding: "10px 24px", fontSize: 14,
                fontFamily: "Georgia, serif", cursor: "pointer", fontWeight: 700,
                boxShadow: "3px 3px 0 var(--shadow)", marginBottom: 12, pointerEvents: "auto",
              }}>
              Continue
            </button>
          )}

          {/* Progress dots */}
          <div style={{ display: "flex", gap: 4, alignItems: "center" }} role="progressbar" aria-label={`Story progress: act ${state.currentAct + 1} of ${STORY_ACTS.length}`}>
            {STORY_ACTS.map((a, i) => {
              const isCurrent = a.id === (act?.id || 0);
              const isComplete = a.id < (act?.id || 0);
              return (
                <div key={i} aria-hidden="true" style={{
                  width: isCurrent ? 18 : 6, height: 6, borderRadius: 3,
                  background: isCurrent ? "var(--accent)" : isComplete ? "var(--text)" : "var(--border-light)",
                  transition: "all 0.3s ease",
                }} />
              );
            })}
          </div>
        </div>
      )}

      {/* Top bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "12px 16px",
      }}>
        <div style={{
          fontSize: 14, fontWeight: 700, color: "var(--text)", letterSpacing: -0.5,
          background: "var(--bg-card)", border: "2px solid var(--border)", borderRadius: 8,
          padding: "5px 12px", boxShadow: "2px 2px 0 var(--shadow)",
          transition: "background 0.3s, color 0.3s, border-color 0.3s",
        }}>
          DRIFT
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Act / Timer combined */}
          <div style={{
            fontSize: 11, fontWeight: 600, color: "var(--text-muted)",
            background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: 6,
            padding: "4px 10px", fontFamily: "monospace", whiteSpace: "nowrap",
            transition: "background 0.3s, color 0.3s, border-color 0.3s",
          }}>
            {act ? `${state.currentAct + 1}/${STORY_ACTS.length}` : ""} &middot; <span ref={timerRef}>{Math.floor((Date.now() - startTimeRef.current) / 1000 / 60)}:{String(Math.floor((Date.now() - startTimeRef.current) / 1000) % 60).padStart(2, "0")}</span>
          </div>
          {/* Help */}
          <button
            onClick={() => { setShowHowToPlay(true); window.dispatchEvent(new CustomEvent("context-open")); }}
            onMouseEnter={() => window.dispatchEvent(new CustomEvent("button-hover"))}
            onMouseLeave={() => window.dispatchEvent(new CustomEvent("hover-out"))}
            style={{
              background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: 6,
              width: 26, height: 26, cursor: "pointer",
              fontSize: 12, fontWeight: 700, color: "var(--text-muted)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "1px 1px 0 var(--shadow)", flexShrink: 0,
              transition: "background 0.3s, color 0.3s, border-color 0.3s",
            }}
            title="How to play"
          >?</button>
        </div>
      </div>

      {showHowToPlay && <HowToPlay onClose={() => setShowHowToPlay(false)} />}
    </div>
  );
}
