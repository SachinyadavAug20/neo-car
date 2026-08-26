"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import gsap from "gsap";
import { NarrativeState, getCurrentAct, getCurrentBeat, nextBeat, STORY_ACTS } from "@/app/lib/narrative";

interface NarrativeOverlayProps {
  state: NarrativeState;
  onAdvance: (newState: NarrativeState) => void;
  onInteractionProgress: (progress: number) => void;
  onInteractionComplete: () => void;
}

export default function NarrativeOverlay({ state, onAdvance, onInteractionProgress, onInteractionComplete }: NarrativeOverlayProps) {
  const textRef = useRef<HTMLDivElement>(null);
  const charRef = useRef<HTMLDivElement>(null);
  const actTitleRef = useRef<HTMLDivElement>(null);
  const interactionUIRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [showEnd, setShowEnd] = useState(false);
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
    }
  }, [isInteraction, state.interactionState]);

  // End screen
  useEffect(() => {
    if (state.ended) {
      setTimeout(() => setShowEnd(true), 1000);
    }
  }, [state.ended]);

  const handleSkip = useCallback(() => {
    if (state.isAnimating) return;
    const beat = getCurrentBeat(state);
    if (beat?.interaction && beat.interaction !== "none" && state.interactionState !== "complete") return;
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

  if (showEnd) {
    return (
      <div style={{
        position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 50, fontFamily: "Georgia, serif", background: "rgba(253,246,227,0.95)",
      }}>
        <div ref={endRef} style={{ textAlign: "center", maxWidth: 500, padding: "40px" }}>
          <div style={{ fontSize: 48, fontWeight: "bold", color: "#1a1a2e", letterSpacing: -2, marginBottom: 16 }}>DRIFT</div>
          <div style={{ fontSize: 18, color: "#1a1a2e", lineHeight: 1.8, marginBottom: 24 }}>
            You are not your folds. You are the paper. You are everything.
          </div>
          <div style={{ width: 60, height: 2, background: "#1a1a2e", margin: "0 auto 24px" }} />
          <div style={{ fontSize: 13, color: "#1a1a2e", marginBottom: 32 }}>A Paper World</div>
          <button
            onClick={() => { setShowEnd(false); window.location.reload(); }}
            style={{
              background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 12,
              padding: "14px 36px", fontSize: 16, fontFamily: "Georgia, serif", cursor: "pointer",
              boxShadow: "3px 3px 0 #6b7280",
            }}
          >
            Play Again
          </button>
        </div>
      </div>
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
            </div>
          )}

          {/* Skip button (only for non-interactive beats) */}
          {!isInteraction && !state.isAnimating && (
            <div style={{ marginTop: 12, pointerEvents: "auto" }}>
              <button onClick={handleSkip} style={{
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
        <div style={{
          background: "#fff", border: "3px solid #1a1a2e", borderRadius: 12,
          padding: "8px 14px", boxShadow: "3px 3px 0 #1a1a2e", fontSize: 12, color: "#1a1a2e", fontWeight: 600,
        }}>
          {act ? `${act.id} / ${STORY_ACTS.length}` : ""}
        </div>
      </div>

      {/* Progress dots */}
      <div style={{
        position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
        display: "flex", gap: 6,
      }}>
        {STORY_ACTS.map((_, i) => (
          <div key={i} style={{
            width: i + 1 === (act?.id || 0) ? 20 : 8, height: 8, borderRadius: 4,
            background: i + 1 <= (act?.id || 0) ? "#1a1a2e" : "#e5e7eb",
            border: "1.5px solid #1a1a2e", transition: "all 0.3s",
          }} />
        ))}
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
    </div>
  );
}
