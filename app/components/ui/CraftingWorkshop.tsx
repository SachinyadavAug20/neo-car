"use client";

import { useState, useRef, useEffect } from "react";
import gsap from "gsap";

interface CraftingWorkshopProps {
  visible: boolean;
  onClose: () => void;
}

interface OrigamiPattern {
  id: string;
  name: string;
  icon: string;
  steps: {
    title: string;
    instruction: string;
    creaseType: "valley" | "mountain" | "pleat" | "squash";
  }[];
}

const PATTERNS: OrigamiPattern[] = [
  {
    id: "crane",
    name: "Peace Crane (Orizuru)",
    icon: "🦢",
    steps: [
      { title: "Step 1: Valley Fold", instruction: "Fold the square diagonally corner to corner to make a triangle.", creaseType: "valley" },
      { title: "Step 2: Preliminary Base", instruction: "Fold corners inward to form a diamond square base.", creaseType: "squash" },
      { title: "Step 3: Bird Base Crease", instruction: "Petal fold the outer edges to create the long wings and neck.", creaseType: "pleat" },
      { title: "Step 4: Wing Spread", instruction: "Gently pull wings outward and flatten the crane body.", creaseType: "mountain" },
    ],
  },
  {
    id: "boat",
    name: "Pip the Sailboat",
    icon: "⛵",
    steps: [
      { title: "Step 1: Half Fold", instruction: "Fold the rectangle paper downwards in half.", creaseType: "valley" },
      { title: "Step 2: Triangle Crease", instruction: "Fold both top corners inwards towards the central crease line.", creaseType: "mountain" },
      { title: "Step 3: Hat Fold", instruction: "Fold the bottom flaps upwards on both sides.", creaseType: "pleat" },
      { title: "Step 4: Hull Pull", instruction: "Open from the center and flatten into a diamond, then pull the hull.", creaseType: "squash" },
    ],
  },
  {
    id: "fox",
    name: "Sage the Fox",
    icon: "🦊",
    steps: [
      { title: "Step 1: Diagonal Triangle", instruction: "Fold square in half corner to corner.", creaseType: "valley" },
      { title: "Step 2: Ear Folds", instruction: "Fold outer flaps towards center triangle point.", creaseType: "mountain" },
      { title: "Step 3: Head Crease", instruction: "Fold the entire model in half along the vertical axis.", creaseType: "pleat" },
      { title: "Step 4: Snout Unfold", instruction: "Open middle layer to reveal the nose and two pointed ears.", creaseType: "squash" },
    ],
  },
];

export function CraftingWorkshop({ visible, onClose }: CraftingWorkshopProps) {
  const [selectedPattern, setSelectedPattern] = useState<OrigamiPattern>(PATTERNS[0]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isFolding, setIsFolding] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible && modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { scale: 0.9, opacity: 0, y: 30 },
        { scale: 1, opacity: 1, y: 0, duration: 0.35, ease: "back.out(1.5)" }
      );
    }
  }, [visible]);

  const performFold = () => {
    if (isFolding) return;
    setIsFolding(true);
    window.dispatchEvent(new CustomEvent("fold-crease"));

    if (paperRef.current) {
      gsap.timeline({
        onComplete: () => {
          setIsFolding(false);
          if (currentStep < selectedPattern.steps.length - 1) {
            setCurrentStep((prev) => prev + 1);
            window.dispatchEvent(new CustomEvent("magic-sparkle"));
          } else {
            // Completed model!
            window.dispatchEvent(new CustomEvent("celebrate", { detail: { count: 8 } }));
            window.dispatchEvent(new CustomEvent("success"));
            window.dispatchEvent(new CustomEvent("star-collect"));
          }
        },
      })
        .to(paperRef.current, { rotateY: 90, scaleX: 0.2, duration: 0.25, ease: "power2.in" })
        .to(paperRef.current, { rotateY: 0, scaleX: 1, duration: 0.25, ease: "power2.out" });
    }
  };

  const resetCraft = (p: OrigamiPattern) => {
    setSelectedPattern(p);
    setCurrentStep(0);
  };

  if (!visible) return null;

  const isCompleted = currentStep === selectedPattern.steps.length - 1 && !isFolding;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(26, 26, 46, 0.7)",
        backdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-card)",
          border: "2px solid var(--border)",
          borderRadius: 24,
          padding: "36px 40px",
          width: "90%",
          maxWidth: 680,
          boxShadow: "0 24px 60px rgba(0,0,0,0.35), 4px 4px 0 var(--shadow)",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "var(--text)" }}>
              Origami Crafting Workshop
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0", fontFamily: "monospace" }}>
              Fold tactile paper creatures step by step
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "var(--text-muted)" }}
          >
            ×
          </button>
        </div>

        {/* Pattern Picker */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          {PATTERNS.map((p) => (
            <button
              key={p.id}
              onClick={() => resetCraft(p)}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: 12,
                border: `2px solid ${selectedPattern.id === p.id ? "var(--text)" : "var(--border)"}`,
                background: selectedPattern.id === p.id ? "var(--text)" : "var(--bg)",
                color: selectedPattern.id === p.id ? "var(--bg)" : "var(--text)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontSize: 13,
                fontWeight: 700,
                transition: "all 0.2s",
              }}
            >
              <span>{p.icon}</span>
              <span>{p.name}</span>
            </button>
          ))}
        </div>

        {/* Paper Canvas & Crease Simulation */}
        <div
          style={{
            background: "var(--bg)",
            border: "1.5px solid var(--border-light)",
            borderRadius: 16,
            height: 220,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
            marginBottom: 24,
            perspective: 800,
          }}
        >
          {/* Animated Folding Sheet */}
          <div
            ref={paperRef}
            style={{
              width: 140,
              height: 140,
              background: "#fefefe",
              border: "2px solid #1a1a2e",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 38,
              position: "relative",
              borderRadius: 6,
              transformStyle: "preserve-3d",
            }}
          >
            {isCompleted ? (
              <span style={{ animation: "pulse 1.5s infinite" }}>{selectedPattern.icon}</span>
            ) : (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  border: "1px dashed #fbbf24",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontFamily: "monospace",
                  color: "#92400e",
                  fontWeight: 700,
                }}
              >
                {selectedPattern.steps[currentStep]?.creaseType.toUpperCase()}
              </div>
            )}
          </div>

          <div
            style={{
              position: "absolute",
              bottom: 12,
              fontSize: 12,
              fontFamily: "monospace",
              color: "var(--text-muted)",
            }}
          >
            Step {currentStep + 1} of {selectedPattern.steps.length}: {selectedPattern.steps[currentStep]?.title}
          </div>
        </div>

        {/* Step Instruction Card */}
        <div style={{ marginBottom: 24, textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "var(--text)", margin: 0, lineHeight: 1.5 }}>
            {selectedPattern.steps[currentStep]?.instruction}
          </p>
        </div>

        {/* Action Button */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={performFold}
            disabled={isFolding}
            style={{
              flex: 1,
              background: "var(--text)",
              color: "var(--bg)",
              border: "none",
              borderRadius: 12,
              padding: "14px 20px",
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "Georgia, serif",
              cursor: isFolding ? "not-allowed" : "pointer",
              boxShadow: "2px 2px 0 var(--shadow)",
              transition: "transform 0.15s, opacity 0.15s",
              opacity: isFolding ? 0.7 : 1,
            }}
          >
            {isCompleted ? "Craft Another Model" : isFolding ? "Creasing Paper..." : "Execute Fold (Space/Click)"}
          </button>
        </div>
      </div>
    </div>
  );
}
