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
  const endRef = useRef<HTMLDivElement>(null);
  const [showEnd, setShowEnd] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [flashOpacity, setFlashOpacity] = useState(0);
  const [floatTexts, setFloatTexts] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const floatIdRef = useRef(0);

  const act = getCurrentAct(state);
  const beat = getCurrentBeat(state);
  const isInteraction = beat?.interaction && beat.interaction !== "none" && state.interactionState !== "complete";

  // Listen for click-jump events — flash screen + floating "+1"
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      // Screen flash
      setFlashOpacity(0.25);
      setTimeout(() => setFlashOpacity(0), 100);

      // Floating "+1" at center of screen
      const id = floatIdRef.current++;
      const x = 40 + Math.random() * 20;
      const y = 40 + Math.random() * 10;
      setFloatTexts((prev) => [...prev, { id, x, y }]);
      setTimeout(() => setFloatTexts((prev) => prev.filter((t) => t.id !== id)), 1200);
    };
    window.addEventListener("milo-jump", handler);
    return () => window.removeEventListener("milo-jump", handler);
  }, []);

  // Animate text on beat change
  useEffect(() => {
    if (!beat || !textRef.current) return;
    const tl = gsap.timeline();
    gsap.set(textRef.current, { opacity: 0, y: 15 });
    gsap.set(charRef.current, { opacity: 0, y: 10 });
    tl.to(textRef.current, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" })
      .to(charRef.current, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, "-=0.3");
    return () => { tl.kill(); };
  }, [state.currentAct, state.currentBeat]);

  // Animate act title
  useEffect(() => {
    if (!act || !actTitleRef.current) return;
    const tl = gsap.timeline();
    gsap.set(actTitleRef.current, { opacity: 0, scale: 0.9 });
    tl.to(actTitleRef.current, { opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.4)" })
      .to(actTitleRef.current, { opacity: 0, duration: 0.5, delay: 2 });
    return () => { tl.kill(); };
  }, [state.currentAct]);

  // Animate interaction UI
  useEffect(() => {
    if (!interactionUIRef.current) return;
    if (isInteraction) {
      gsap.fromTo(interactionUIRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" });
      window.dispatchEvent(new CustomEvent("interaction-start"));
    }
  }, [isInteraction, state.interactionState]);

  // End screen
  useEffect(() => {
    if (state.ended) {
      setTimeout(() => setShowEnd(true), 2500);
    }
  }, [state.ended]);

  const handleSkip = useCallback(() => {
    if (state.isAnimating) return;
    const beat = getCurrentBeat(state);
    if (beat?.interaction && beat.interaction !== "none" && state.interactionState !== "complete") return;
    // Different sound per beat type
    const beatSounds: Record<string, string> = {
      "click-jump": "coin-collect",
      "drag-wind": "whoosh-fast",
      "click-unfold": "paper-shower",
      "click-reveal": "discovery",
      "collect-leaves": "leaf-rustle",
      "toggle-cells": "ding",
      "row-boat": "splash",
      "celebrate": "joy",
      "follow-butterfly": "wind-chime",
    };
    window.dispatchEvent(new CustomEvent(beatSounds[beat?.interaction || ""] || "success"));
    onAdvance(nextBeat(state));
  }, [state, onAdvance]);

  // Keyboard: space/enter to advance
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleSkip();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSkip]);

  // Cinematic fade-to-white when story ends
  const [fadeOpacity, setFadeOpacity] = useState(0);
  useEffect(() => {
    if (state.ended) {
      // Slow cinematic fade to white
      gsap.to({}, {
        duration: 2.5,
        onUpdate: function () {
          setFadeOpacity(this.progress());
        },
        ease: "power2.inOut",
      });
    }
  }, [state.ended]);

  if (showEnd) {
    return (
      <EndScreen
        stats={journeyStats || {
          startTime: Date.now() - 1000,
          endTime: Date.now(),
          totalClicks: 0,
          totalKeys: 0,
          totalMouseMoveDistance: 0,
          actTimes: [0, 0, 0, 0, 0, 0, 0, 0],
          actClicks: [0, 0, 0, 0, 0, 0, 0, 0],
          actInteractions: [0, 0, 0, 0, 0, 0, 0, 0],
          actBeatCount: [0, 0, 0, 0, 0, 0, 0, 0],
          secretsFound: [],
          currentAct: 7,
          loreCollected: 0,
          charactersMet: [],
          jumpsMade: 0,
          windGenerated: 0,
          leavesCollected: 0,
          cellsToggled: 0,
          boatStrokes: 0,
          butterfliesFollowed: 0,
          cranesReleased: 0,
          shattersTriggered: 0,
          pendulumsPushed: 0,
          crittersFound: 0,
          foldsUnlocked: false,
        }}
        onRestart={onRestart}
      />
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 20, fontFamily: "Georgia, serif" }}>
      {/* Screen flash on click */}
      <div style={{
        position: "absolute", inset: 0, background: "#fbbf24",
        opacity: flashOpacity, transition: "opacity 0.1s", pointerEvents: "none",
      }} />

      {/* Floating "+1" texts */}
      {floatTexts.map((t) => (
        <div key={t.id} style={{
          position: "absolute", left: `${t.x}%`, top: `${t.y}%`,
          fontSize: 36, fontWeight: "bold", color: "#f59e0b",
          textShadow: "0 2px 8px rgba(245,158,11,0.5)",
          animation: "floatUp 1.2s ease-out forwards", pointerEvents: "none",
        }}>
          +1
        </div>
      ))}

      {/* Cinematic fade-to-white overlay */}
      {state.ended && (
        <div style={{
          position: "absolute", inset: 0, background: "#fdf6e3",
          opacity: fadeOpacity, pointerEvents: "none", zIndex: 100,
        }} />
      )}

      {/* Act title overlay */}
      {act && (
        <div ref={actTitleRef} style={{
          position: "absolute", top: "15%", left: 0, right: 0, textAlign: "center",
          opacity: 0, pointerEvents: "none",
        }}>
          <div style={{ fontSize: 11, color: "#1a1a2e", letterSpacing: 3, textTransform: "uppercase", marginBottom: 8, fontWeight: 600 }}>
            Act {act.id}
          </div>
          <div style={{ fontSize: 28, fontWeight: "bold", color: "#1a1a2e", letterSpacing: -1 }}>
            {act.title}
          </div>
          <div style={{ fontSize: 14, color: "#1a1a2e", fontStyle: "italic", marginTop: 8 }}>
            {act.subtitle}
          </div>
        </div>
      )}

      {/* Story text — bottom center */}
      {beat && (
        <div style={{
          position: "absolute", bottom: 60, left: "50%", transform: "translateX(-50%)",
          maxWidth: 520, width: "90%", textAlign: "center",
        }}>
          <div style={{
            background: "#fff", border: "3px solid #1a1a2e", borderRadius: 16,
            padding: "20px 28px", boxShadow: "4px 4px 0 #1a1a2e",
          }}>
            <div ref={textRef} style={{ fontSize: 15, color: "#1a1a2e", lineHeight: 1.8, opacity: 0 }}>
              {beat.text}
            </div>
            <div ref={charRef} style={{
              fontSize: 11, color: "#1a1a2e", marginTop: 10, fontStyle: "italic", opacity: 0, fontWeight: 600,
              textTransform: beat.character === "narrator" || beat.character === "prompt" ? "none" : "lowercase",
            }}>
              {beat.character && beat.character !== "narrator" && beat.character !== "prompt"
                ? `— ${beat.character}`
                : ""}
            </div>
          </div>

          {/* Interaction prompt */}
          {isInteraction && (
            <div ref={interactionUIRef} style={{
              marginTop: 16, opacity: 0,
            }}>
              {beat.interaction === "click-jump" && (
                <div style={{
                  background: "#fff", border: "2px solid #1a1a2e", borderRadius: 12,
                  padding: "14px 20px", boxShadow: "2px 2px 0 #1a1a2e",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                }}>
                  <div style={{ fontSize: 13, color: "#1a1a2e", fontWeight: 700 }}>
                    CLICK anywhere to make Milo jump
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {Array.from({ length: beat.interactionTarget || 5 }).map((_, i) => (
                      <div key={i} style={{
                        width: 14, height: 14, borderRadius: "50%", border: "2px solid #1a1a2e",
                        background: i < state.interactionProgress ? "#fbbf24" : "transparent",
                        transition: "background 0.2s",
                      }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 12, color: "#1a1a2e", fontWeight: 600 }}>
                    {state.interactionProgress} / {beat.interactionTarget} jumps
                  </div>
                </div>
              )}
              {beat.interaction === "drag-wind" && (
                <div style={{
                  background: "#fff", border: "2px solid #1a1a2e", borderRadius: 12,
                  padding: "14px 20px", boxShadow: "2px 2px 0 #1a1a2e",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                }}>
                  <div style={{ fontSize: 13, color: "#1a1a2e", fontWeight: 700 }}>
                    CLICK and DRAG across the scene to create wind
                  </div>
                  <div style={{ width: 140, height: 8, background: "#e5e7eb", borderRadius: 4, overflow: "hidden", border: "1px solid #1a1a2e" }}>
                    <div style={{
                      width: `${(state.interactionProgress / (beat.interactionTarget || 30)) * 100}%`,
                      height: "100%", background: "#1a1a2e", borderRadius: 4, transition: "width 0.1s",
                    }} />
                  </div>
                  <div style={{ fontSize: 12, color: "#1a1a2e", fontWeight: 600 }}>
                    Wind power: {state.interactionProgress} / {beat.interactionTarget}
                  </div>
                </div>
              )}
              {beat.interaction === "click-unfold" && (
                <div style={{
                  background: "#fbbf24", border: "2px solid #1a1a2e", borderRadius: 12,
                  padding: "14px 20px", boxShadow: "2px 2px 0 #1a1a2e",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 14, color: "#1a1a2e", fontWeight: 700 }}>
                    CLICK the glowing golden paper in the scene
                  </div>
                  <div style={{ fontSize: 12, color: "#1a1a2e", marginTop: 4 }}>
                    It floats and rotates — find it and click to unfold
                  </div>
                </div>
              )}
              {beat.interaction === "collect-leaves" && (
                <div style={{
                  background: "#fff", border: "2px solid #1a1a2e", borderRadius: 12,
                  padding: "14px 20px", boxShadow: "2px 2px 0 #1a1a2e",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                }}>
                  <div style={{ fontSize: 13, color: "#1a1a2e", fontWeight: 700 }}>
                    CLICK to collect glowing paper leaves!
                  </div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
                    {Array.from({ length: beat.interactionTarget || 8 }).map((_, i) => (
                      <div key={i} style={{
                        width: 12, height: 12, borderRadius: "50%", border: "2px solid #1a1a2e",
                        background: i < state.interactionProgress ? ["#22c55e", "#4ade80", "#fbbf24", "#f472b6"][i % 4] : "transparent",
                        transition: "background 0.2s",
                      }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 12, color: "#1a1a2e", fontWeight: 600 }}>
                    {state.interactionProgress} / {beat.interactionTarget} leaves
                  </div>
                </div>
              )}
              {beat.interaction === "toggle-cells" && (
                <div style={{
                  background: "#faf5ff", border: "2px solid #1a1a2e", borderRadius: 12,
                  padding: "14px 20px", boxShadow: "2px 2px 0 #1a1a2e",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                }}>
                  <div style={{ fontSize: 13, color: "#1a1a2e", fontWeight: 700 }}>
                    CLICK the grid cells to awaken the pattern!
                  </div>
                  <div style={{ width: 140, height: 8, background: "#e5e7eb", borderRadius: 4, overflow: "hidden", border: "1px solid #1a1a2e" }}>
                    <div style={{
                      width: `${(state.interactionProgress / (beat.interactionTarget || 10)) * 100}%`,
                      height: "100%", background: "#a78bfa", borderRadius: 4, transition: "width 0.1s",
                    }} />
                  </div>
                  <div style={{ fontSize: 12, color: "#1a1a2e", fontWeight: 600 }}>
                    {state.interactionProgress} / {beat.interactionTarget} cells awakened
                  </div>
                </div>
              )}
              {beat.interaction === "row-boat" && (
                <div style={{
                  background: "#fff", border: "2px solid #1a1a2e", borderRadius: 12,
                  padding: "14px 20px", boxShadow: "2px 2px 0 #1a1a2e",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                }}>
                  <div style={{ fontSize: 13, color: "#1a1a2e", fontWeight: 700 }}>
                    CLICK rapidly to row to Pip!
                  </div>
                  <div style={{ width: 140, height: 8, background: "#e5e7eb", borderRadius: 4, overflow: "hidden", border: "1px solid #1a1a2e" }}>
                    <div style={{
                      width: `${(state.interactionProgress / (beat.interactionTarget || 20)) * 100}%`,
                      height: "100%", background: "#67e8f9", borderRadius: 4, transition: "width 0.1s",
                    }} />
                  </div>
                  <div style={{ fontSize: 12, color: "#1a1a2e", fontWeight: 600 }}>
                    {state.interactionProgress} / {beat.interactionTarget} strokes
                  </div>
                </div>
              )}
              {beat.interaction === "celebrate" && (
                <div style={{
                  background: "linear-gradient(135deg, #fbbf24, #f472b6, #a78bfa)",
                  border: "2px solid #1a1a2e", borderRadius: 12,
                  padding: "14px 20px", boxShadow: "2px 2px 0 #1a1a2e",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                }}>
                  <div style={{ fontSize: 13, color: "#1a1a2e", fontWeight: 700 }}>
                    CLICK anywhere to release paper cranes!
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {Array.from({ length: beat.interactionTarget || 15 }).map((_, i) => (
                      <div key={i} style={{
                        width: 10, height: 10, borderRadius: "50%", border: "2px solid #1a1a2e",
                        background: i < state.interactionProgress ? ["#fbbf24", "#f472b6", "#a78bfa", "#67e8f9"][i % 4] : "transparent",
                        transition: "background 0.2s",
                      }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 12, color: "#1a1a2e", fontWeight: 600 }}>
                    {state.interactionProgress} / {beat.interactionTarget} cranes released
                  </div>
                </div>
              )}
              {beat.interaction === "follow-butterfly" && (
                <div style={{
                  background: "#fff", border: "2px solid #1a1a2e", borderRadius: 12,
                  padding: "14px 20px", boxShadow: "2px 2px 0 #1a1a2e",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                }}>
                  <div style={{ fontSize: 13, color: "#1a1a2e", fontWeight: 700 }}>
                    CLICK to follow the butterfly through the world!
                  </div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
                    {Array.from({ length: beat.interactionTarget || 25 }).map((_, i) => (
                      <div key={i} style={{
                        width: 8, height: 8, borderRadius: "50%", border: "2px solid #1a1a2e",
                        background: i < state.interactionProgress ? ["#a78bfa", "#f472b6", "#67e8f9"][i % 3] : "transparent",
                        transition: "background 0.2s",
                      }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 12, color: "#1a1a2e", fontWeight: 600 }}>
                    {state.interactionProgress} / {beat.interactionTarget} steps followed
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Skip button (only for non-interactive beats) */}
          {!isInteraction && !state.isAnimating && (
            <div style={{ marginTop: 12, pointerEvents: "auto" }}>
              <button onClick={handleSkip}
                onMouseEnter={() => window.dispatchEvent(new CustomEvent("button-hover"))}
                onMouseLeave={() => window.dispatchEvent(new CustomEvent("hover-out"))}
                style={{
                  background: "#fff", border: "2px solid #1a1a2e", borderRadius: 8,
                  padding: "6px 16px", fontSize: 11, fontFamily: "Georgia, serif", cursor: "pointer",
                  color: "#1a1a2e", fontWeight: 600, boxShadow: "2px 2px 0 #1a1a2e",
                }}>
                Continue ▸
              </button>
            </div>
          )}
        </div>
      )}

      {/* Top bar */}
      <div style={{
        position: "absolute", top: 16, left: 16, right: 16,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{
          background: "#fff", border: "3px solid #1a1a2e", borderRadius: 12,
          padding: "8px 16px", boxShadow: "3px 3px 0 #1a1a2e", fontSize: 16, fontWeight: "bold",
          color: "#1a1a2e", letterSpacing: -1,
        }}>
          DRIFT
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Help button */}
          <button
            onClick={() => { setShowHowToPlay(true); window.dispatchEvent(new CustomEvent("context-open")); }}
            onMouseEnter={() => window.dispatchEvent(new CustomEvent("tooltip"))}
            onMouseLeave={() => window.dispatchEvent(new CustomEvent("hover-out"))}
            style={{
              background: "#fff", border: "2px solid #1a1a2e", borderRadius: 10,
              width: 32, height: 32, cursor: "pointer", fontSize: 14, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#1a1a2e", boxShadow: "2px 2px 0 #1a1a2e",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            title="How to play"
          >
            ?
          </button>
          <div style={{
            background: "#fff", border: "3px solid #1a1a2e", borderRadius: 12,
            padding: "8px 14px", boxShadow: "3px 3px 0 #1a1a2e", fontSize: 12, color: "#1a1a2e", fontWeight: 600,
          }}>
            {act ? `${act.id} / ${STORY_ACTS.length}` : ""}
          </div>
        </div>
      </div>

      {/* Progress dots */}
      <div style={{
        position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
        display: "flex", gap: 6, alignItems: "center",
      }}>
        {STORY_ACTS.map((a, i) => {
          const isCurrent = a.id === (act?.id || 0);
          const isComplete = a.id < (act?.id || 0);
          return (
            <div key={i} style={{
              width: isCurrent ? 24 : 8, height: 8, borderRadius: 4,
              background: isCurrent ? "#fbbf24" : isComplete ? "#1a1a2e" : "#e5e7eb",
              border: "1.5px solid #1a1a2e", transition: "all 0.4s ease",
              boxShadow: isCurrent ? "0 0 8px rgba(251,191,36,0.5)" : "none",
            }} />
          );
        })}
      </div>

      {/* Keyboard hints */}
      <div style={{
        position: "absolute", bottom: 16, right: 16,
        fontSize: 10, color: "#1a1a2e", textAlign: "right", lineHeight: 1.6, fontWeight: 600,
      }}>
        <div>WASD / HJKL — move</div>
        <div>Ctrl+K — commands</div>
        <div>Ctrl+~ — terminal</div>
      </div>

      {/* Space/Enter hint */}
      {!isInteraction && !state.isAnimating && (
        <div style={{
          position: "absolute", bottom: 50, left: "50%", transform: "translateX(-50%)",
          fontSize: 10, color: "#1a1a2e", opacity: 0.3, fontWeight: 600,
          animation: "pulse 2s ease-in-out infinite",
        }}>
          Press Space or Enter to continue
        </div>
      )}

      {/* How to Play overlay */}
      {showHowToPlay && <HowToPlay onClose={() => setShowHowToPlay(false)} />}
    </div>
  );
}
