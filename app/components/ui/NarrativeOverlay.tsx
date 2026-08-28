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

  const act = getCurrentAct(state);
  const beat = getCurrentBeat(state);
  const isInteraction = beat?.interaction && beat.interaction !== "none" && state.interactionState !== "complete";

  // Jump feedback
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

  // Animate story text
  useEffect(() => {
    if (!beat || !textRef.current) return;
    const tl = gsap.timeline();
    gsap.set(textRef.current, { opacity: 0, y: 8 });
    gsap.set(charRef.current, { opacity: 0, y: 6 });
    tl.to(textRef.current, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" })
      .to(charRef.current, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }, "-=0.2");
    return () => { tl.kill(); };
  }, [state.currentAct, state.currentBeat]);

  // Animate act title
  useEffect(() => {
    if (!act || !actTitleRef.current) return;
    const tl = gsap.timeline();
    gsap.set(actTitleRef.current, { opacity: 0, y: -8 });
    tl.to(actTitleRef.current, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" })
      .to(actTitleRef.current, { opacity: 0, duration: 0.4, delay: 2.5 });
    return () => { tl.kill(); };
  }, [state.currentAct]);

  // Animate interaction UI
  useEffect(() => {
    if (!interactionUIRef.current) return;
    if (isInteraction) {
      gsap.fromTo(interactionUIRef.current, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" });
      window.dispatchEvent(new CustomEvent("interaction-start"));
    }
  }, [isInteraction, state.interactionState]);

  // End screen
  useEffect(() => {
    if (state.ended) setTimeout(() => setShowEnd(true), 2500);
  }, [state.ended]);

  // Advance story
  const handleSkip = useCallback(() => {
    if (state.isAnimating) return;
    const beat = getCurrentBeat(state);
    if (beat?.interaction && beat.interaction !== "none" && state.interactionState !== "complete") return;
    const beatSounds: Record<string, string> = {
      "click-jump": "coin-collect", "drag-wind": "whoosh-fast", "click-unfold": "paper-shower",
      "click-reveal": "discovery", "collect-leaves": "leaf-rustle", "toggle-cells": "ding",
      "row-boat": "splash", "celebrate": "joy", "follow-butterfly": "wind-chime",
    };
    window.dispatchEvent(new CustomEvent(beatSounds[beat?.interaction || ""] || "success"));
    onAdvance(nextBeat(state));
  }, [state, onAdvance]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); handleSkip(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSkip]);

  // Cinematic fade
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

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 20, fontFamily: "Georgia, serif" }}>
      {/* Screen flash */}
      <div style={{
        position: "absolute", inset: 0, background: "#fbbf24",
        opacity: flashOpacity, transition: "opacity 0.12s", pointerEvents: "none",
      }} />

      {/* Floating "+1" */}
      {floatTexts.map((t) => (
        <div key={t.id} style={{
          position: "absolute", left: `${t.x}%`, top: `${t.y}%`,
          fontSize: 24, fontWeight: 700, color: "#f59e0b",
          textShadow: "0 1px 4px rgba(245,158,11,0.3)",
          animation: "floatUp 1s ease-out forwards", pointerEvents: "none",
        }}>
          +1
        </div>
      ))}

      {/* Cinematic fade */}
      {state.ended && (
        <div style={{
          position: "absolute", inset: 0, background: "#fdf6e3",
          opacity: fadeOpacity, pointerEvents: "none", zIndex: 100,
        }} />
      )}

      {/* Act title */}
      {act && (
        <div ref={actTitleRef} style={{
          position: "absolute", top: "14%", left: 0, right: 0, textAlign: "center",
          opacity: 0, pointerEvents: "none",
        }}>
          <div style={{ fontSize: 11, color: "#1a1a2e", letterSpacing: 3, textTransform: "uppercase", marginBottom: 8, fontWeight: 600, opacity: 0.45 }}>
            Act {act.id}
          </div>
          <div style={{ fontSize: 28, fontWeight: "bold", color: "#1a1a2e", letterSpacing: -1 }}>
            {act.title}
          </div>
          <div style={{ fontSize: 14, color: "#1a1a2e", fontStyle: "italic", marginTop: 8, opacity: 0.5 }}>
            {act.subtitle}
          </div>
        </div>
      )}

      {/* Bottom section: story + interactions + progress */}
      {beat && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "0 20px 28px",
        }}>
          {/* Interaction prompt */}
          {isInteraction && (
            <div ref={interactionUIRef} style={{ marginBottom: 14, opacity: 0 }}>
              {beat.interaction === "click-jump" && (
                <div style={{
                  background: "#fff", border: "2px solid #1a1a2e", borderRadius: 12,
                  padding: "14px 24px", boxShadow: "3px 3px 0 #1a1a2e",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 13, color: "#1a1a2e", fontWeight: 700, marginBottom: 8 }}>
                    Click anywhere to make Milo jump
                  </div>
                  <div style={{ display: "flex", gap: 5, justifyContent: "center" }}>
                    {Array.from({ length: beat.interactionTarget || 5 }).map((_, i) => (
                      <div key={i} style={{
                        width: 10, height: 10, borderRadius: "50%", border: "2px solid #1a1a2e",
                        background: i < state.interactionProgress ? "#fbbf24" : "transparent",
                        transition: "background 0.2s",
                      }} />
                    ))}
                  </div>
                </div>
              )}
              {beat.interaction === "drag-wind" && (
                <div style={{
                  background: "#fff", border: "2px solid #1a1a2e", borderRadius: 12,
                  padding: "14px 24px", boxShadow: "3px 3px 0 #1a1a2e",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 13, color: "#1a1a2e", fontWeight: 700, marginBottom: 8 }}>
                    Click and drag to create wind
                  </div>
                  <div style={{ width: 140, height: 6, background: "#e5e7eb", borderRadius: 3, overflow: "hidden", border: "1px solid #d1d5db", margin: "0 auto" }}>
                    <div style={{ width: `${progress * 100}%`, height: "100%", background: "#1a1a2e", borderRadius: 3, transition: "width 0.1s" }} />
                  </div>
                  <div style={{ fontSize: 11, color: "#1a1a2e", marginTop: 6, fontWeight: 600 }}>
                    {state.interactionProgress} / {beat.interactionTarget}
                  </div>
                </div>
              )}
              {beat.interaction === "click-unfold" && (
                <div style={{
                  background: "#fbbf24", border: "2px solid #1a1a2e", borderRadius: 12,
                  padding: "14px 24px", boxShadow: "3px 3px 0 #1a1a2e",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 13, color: "#1a1a2e", fontWeight: 700 }}>
                    Click the glowing golden paper
                  </div>
                </div>
              )}
              {beat.interaction === "collect-leaves" && (
                <div style={{
                  background: "#fff", border: "2px solid #1a1a2e", borderRadius: 12,
                  padding: "14px 24px", boxShadow: "3px 3px 0 #1a1a2e",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 13, color: "#1a1a2e", fontWeight: 700, marginBottom: 8 }}>
                    Collect the glowing leaves
                  </div>
                  <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                    {Array.from({ length: beat.interactionTarget || 8 }).map((_, i) => (
                      <div key={i} style={{
                        width: 8, height: 8, borderRadius: "50%", border: "2px solid #1a1a2e",
                        background: i < state.interactionProgress ? "#22c55e" : "transparent",
                        transition: "background 0.2s",
                      }} />
                    ))}
                  </div>
                </div>
              )}
              {beat.interaction === "toggle-cells" && (
                <div style={{
                  background: "#faf5ff", border: "2px solid #1a1a2e", borderRadius: 12,
                  padding: "14px 24px", boxShadow: "3px 3px 0 #1a1a2e",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 13, color: "#1a1a2e", fontWeight: 700, marginBottom: 8 }}>
                    Click the grid cells to awaken the pattern
                  </div>
                  <div style={{ width: 140, height: 6, background: "#e5e7eb", borderRadius: 3, overflow: "hidden", border: "1px solid #d1d5db", margin: "0 auto" }}>
                    <div style={{ width: `${progress * 100}%`, height: "100%", background: "#a78bfa", borderRadius: 3, transition: "width 0.1s" }} />
                  </div>
                </div>
              )}
              {beat.interaction === "row-boat" && (
                <div style={{
                  background: "#fff", border: "2px solid #1a1a2e", borderRadius: 12,
                  padding: "14px 24px", boxShadow: "3px 3px 0 #1a1a2e",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 13, color: "#1a1a2e", fontWeight: 700, marginBottom: 8 }}>
                    Click rapidly to row to Pip
                  </div>
                  <div style={{ width: 140, height: 6, background: "#e5e7eb", borderRadius: 3, overflow: "hidden", border: "1px solid #d1d5db", margin: "0 auto" }}>
                    <div style={{ width: `${progress * 100}%`, height: "100%", background: "#67e8f9", borderRadius: 3, transition: "width 0.1s" }} />
                  </div>
                </div>
              )}
              {beat.interaction === "celebrate" && (
                <div style={{
                  background: "linear-gradient(135deg, #fbbf24, #f472b6, #a78bfa)",
                  border: "2px solid #1a1a2e", borderRadius: 12,
                  padding: "14px 24px", boxShadow: "3px 3px 0 #1a1a2e",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 13, color: "#1a1a2e", fontWeight: 700, marginBottom: 8 }}>
                    Click to release paper cranes
                  </div>
                  <div style={{ display: "flex", gap: 3, justifyContent: "center" }}>
                    {Array.from({ length: beat.interactionTarget || 15 }).map((_, i) => (
                      <div key={i} style={{
                        width: 6, height: 6, borderRadius: "50%", border: "1.5px solid #1a1a2e",
                        background: i < state.interactionProgress ? ["#fbbf24", "#f472b6", "#a78bfa"][i % 3] : "transparent",
                        transition: "background 0.2s",
                      }} />
                    ))}
                  </div>
                </div>
              )}
              {beat.interaction === "follow-butterfly" && (
                <div style={{
                  background: "#fff", border: "2px solid #1a1a2e", borderRadius: 12,
                  padding: "14px 24px", boxShadow: "3px 3px 0 #1a1a2e",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 13, color: "#1a1a2e", fontWeight: 700, marginBottom: 8 }}>
                    Follow the butterfly through the world
                  </div>
                  <div style={{ display: "flex", gap: 3, justifyContent: "center" }}>
                    {Array.from({ length: beat.interactionTarget || 25 }).map((_, i) => (
                      <div key={i} style={{
                        width: 5, height: 5, borderRadius: "50%", border: "1.5px solid #1a1a2e",
                        background: i < state.interactionProgress ? "#a78bfa" : "transparent",
                        transition: "background 0.2s",
                      }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Story text card */}
          <div style={{
            maxWidth: 500, width: "100%", textAlign: "center",
            background: "#fff", border: "2px solid #1a1a2e", borderRadius: 14,
            padding: "18px 28px", boxShadow: "4px 4px 0 #1a1a2e",
            marginBottom: 14,
          }}>
            <div ref={textRef} style={{ fontSize: 15, color: "#1a1a2e", lineHeight: 1.8, opacity: 0 }}>
              {beat.text}
            </div>
            <div ref={charRef} style={{
              fontSize: 11, color: "#1a1a2e", marginTop: 10, fontStyle: "italic", opacity: 0,
              fontWeight: 700, textTransform: "lowercase", letterSpacing: 0.5,
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
                background: "#fff", border: "2px solid #1a1a2e", borderRadius: 8,
                padding: "8px 20px", fontSize: 12, fontFamily: "Georgia, serif", cursor: "pointer",
                color: "#1a1a2e", fontWeight: 700, boxShadow: "2px 2px 0 #1a1a2e",
                marginBottom: 12, pointerEvents: "auto",
              }}>
              Continue
            </button>
          )}

          {/* Progress dots */}
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            {STORY_ACTS.map((a, i) => {
              const isCurrent = a.id === (act?.id || 0);
              const isComplete = a.id < (act?.id || 0);
              return (
                <div key={i} style={{
                  width: isCurrent ? 20 : 8, height: 8, borderRadius: 4,
                  background: isCurrent ? "#fbbf24" : isComplete ? "#1a1a2e" : "#e5e7eb",
                  border: "1.5px solid #1a1a2e", transition: "all 0.3s ease",
                  boxShadow: isCurrent ? "0 0 8px rgba(251,191,36,0.4)" : "none",
                }} />
              );
            })}
          </div>
        </div>
      )}

      {/* Top bar */}
      <div style={{
        position: "absolute", top: 14, left: 14, right: 14,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{
          background: "#fff", border: "2px solid #1a1a2e", borderRadius: 8,
          padding: "6px 14px", boxShadow: "2px 2px 0 #1a1a2e",
          fontSize: 15, fontWeight: 700, color: "#1a1a2e", letterSpacing: -0.5,
        }}>
          DRIFT
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => { setShowHowToPlay(true); window.dispatchEvent(new CustomEvent("context-open")); }}
            onMouseEnter={() => window.dispatchEvent(new CustomEvent("button-hover"))}
            onMouseLeave={() => window.dispatchEvent(new CustomEvent("hover-out"))}
            style={{
              background: "#fff", border: "2px solid #1a1a2e", borderRadius: 8,
              width: 28, height: 28, cursor: "pointer", fontSize: 13, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#1a1a2e", boxShadow: "2px 2px 0 #1a1a2e",
            }}
            title="How to play"
          >
            ?
          </button>
          <div style={{
            background: "#fff", border: "2px solid #1a1a2e", borderRadius: 8,
            padding: "6px 12px", boxShadow: "2px 2px 0 #1a1a2e",
            fontSize: 12, color: "#1a1a2e", fontWeight: 700,
          }}>
            {act ? `${act.id} / ${STORY_ACTS.length}` : ""}
          </div>
        </div>
      </div>

      {showHowToPlay && <HowToPlay onClose={() => setShowHowToPlay(false)} />}
    </div>
  );
}
