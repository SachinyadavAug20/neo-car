"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useState, useCallback, useRef, useEffect } from "react";
import PaperWorld from "./PaperWorld";
import { LoreEntry } from "./PaperWorld";
import StoryCamera from "./StoryCamera";
import NarrativeOverlay from "../ui/NarrativeOverlay";
import DraftingTerminal from "../ui/DraftingTerminal";
import CommandPalette from "../ui/CommandPalette";
import Fog from "./Fog";
import { NarrativeState, INITIAL_STATE, getCurrentBeat, getCurrentAct, nextBeat, STORY_ACTS } from "@/app/lib/narrative";
import { usePersistentFolds } from "@/app/lib/usePersistentFolds";
import { TerminalLine } from "../ui/DraftingTerminal";
import gsap from "gsap";

export default function Scene() {
  const [narrativeState, setNarrativeState] = useState<NarrativeState>({
    ...INITIAL_STATE,
    started: false,
  });
  const [showTitle, setShowTitle] = useState(true);
  const [isCinematic, setIsCinematic] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [loreModal, setLoreModal] = useState<LoreEntry | null>(null);
  const [windForce, setWindForce] = useState(0.3);
  const [currentMood, setCurrentMood] = useState("warm");
  const [cameraPos, setCameraPos] = useState<[number, number, number]>([3, 2, 5]);

  const { folds, unlockSecretFold, completeAct, incrementPlaythrough, resetFolds } = usePersistentFolds();

  // Toggle terminal with Ctrl+~
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "~") {
        e.preventDefault();
        setTerminalOpen(prev => !prev);
      }
      if (e.ctrlKey && e.key === "k") {
        e.preventDefault();
        setPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Track mood from narrative state
  useEffect(() => {
    const beat = getCurrentBeat(narrativeState);
    if (beat?.mood) setCurrentMood(beat.mood);
  }, [narrativeState.currentAct, narrativeState.currentBeat]);

  // Sync camera position from StoryCamera
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.position) setCameraPos(detail.position);
    };
    window.addEventListener("camera-sync", handler);
    return () => window.removeEventListener("camera-sync", handler);
  }, []);

  const handleStart = useCallback(() => {
    setShowTitle(false);
    setNarrativeState({
      ...INITIAL_STATE,
      started: true,
      currentAct: 0,
      currentBeat: 0,
    });
    incrementPlaythrough();
  }, [incrementPlaythrough]);

  const handleAdvance = useCallback((newState: NarrativeState) => {
    setNarrativeState(newState);
  }, []);

  const handleInteractionProgress = useCallback((progress: number) => {
    setNarrativeState(prev => ({ ...prev, interactionProgress: progress }));
  }, []);

  const handleInteractionComplete = useCallback(() => {
    setNarrativeState(prev => {
      const beat = getCurrentBeat(prev);
      // Auto-advance after both interaction types complete
      if (beat?.interaction === "drag-wind" || beat?.interaction === "click-jump") {
        setTimeout(() => {
          setNarrativeState(p => nextBeat(p));
        }, 1500);
      }
      return { ...prev, interactionState: "complete" };
    });
  }, []);

  const handleSecretFoldInteract = useCallback(() => {
    setNarrativeState(prev => ({ ...prev, interactionState: "complete" }));
    unlockSecretFold();
    setTimeout(() => {
      setNarrativeState(prev => nextBeat(prev));
    }, 1000);
  }, [unlockSecretFold]);

  const handleLoreCollect = useCallback((entry: LoreEntry) => {
    setLoreModal(entry);
  }, []);

  // Track act completion
  useEffect(() => {
    if (narrativeState.started) {
      completeAct(narrativeState.currentAct);
    }
  }, [narrativeState.currentAct, narrativeState.started, completeAct]);

  // Listen for cinematic events
  useEffect(() => {
    const onStart = () => setIsCinematic(true);
    const onEnd = () => setIsCinematic(false);
    window.addEventListener("cinematic-start", onStart);
    window.addEventListener("cinematic-complete", onEnd);
    return () => {
      window.removeEventListener("cinematic-start", onStart);
      window.removeEventListener("cinematic-complete", onEnd);
    };
  }, []);

  // Terminal command handler
  const handleTerminalCommand = useCallback((cmd: string, args: string[]): TerminalLine[] => {
    switch (cmd) {
      case "set_wind_force": {
        const val = parseFloat(args[0]);
        if (isNaN(val) || val < 0 || val > 10) {
          return [{ type: "error", text: "Usage: set_wind_force <0-10>" }];
        }
        setWindForce(val);
        window.dispatchEvent(new CustomEvent("set-wind-force", { detail: { force: val } }));
        return [{ type: "output", text: `Wind force set to ${val}` }];
      }

      case "set_mood": {
        const mood = args[0]?.toLowerCase();
        const validMoods = ["warm", "storm", "calm", "secret", "sorrow", "hope", "final"];
        if (!mood || !validMoods.includes(mood)) {
          return [{ type: "error", text: `Usage: set_mood <${validMoods.join("|")}>` }];
        }
        setCurrentMood(mood);
        window.dispatchEvent(new CustomEvent("set-mood", { detail: { mood } }));
        return [{ type: "output", text: `Mood set to "${mood}"` }];
      }

      case "set_camera": {
        const x = parseFloat(args[0]);
        const y = parseFloat(args[1]);
        const z = parseFloat(args[2]);
        if ([x, y, z].some(isNaN)) {
          return [{ type: "error", text: "Usage: set_camera <x> <y> <z>" }];
        }
        setCameraPos([x, y, z]);
        window.dispatchEvent(new CustomEvent("set-camera", { detail: { position: [x, y, z] } }));
        return [{ type: "output", text: `Camera moved to [${x}, ${y}, ${z}]` }];
      }

      case "jump_to": {
        const act = parseInt(args[0]) - 1;
        const beatIdx = parseInt(args[1]) - 1;
        if (isNaN(act) || isNaN(beatIdx) || act < 0 || act >= STORY_ACTS.length) {
          return [{ type: "error", text: `Usage: jump_to <1-${STORY_ACTS.length}> <beat>` }];
        }
        const targetAct = STORY_ACTS[act];
        if (beatIdx < 0 || beatIdx >= targetAct.beats.length) {
          return [{ type: "error", text: `Beat out of range. Act ${act + 1} has ${targetAct.beats.length} beats.` }];
        }
        setNarrativeState(prev => ({
          ...prev,
          currentAct: act,
          currentBeat: beatIdx,
          interactionState: "idle",
          interactionProgress: 0,
        }));
        return [{ type: "output", text: `Jumped to Act ${act + 1}, Beat ${beatIdx + 1}: "${targetAct.beats[beatIdx].id}"` }];
      }

      case "spawn_entity": {
        const name = args[0]?.toLowerCase();
        const valid = ["pip", "sage", "lira", "milo"];
        if (!name || !valid.includes(name)) {
          return [{ type: "error", text: `Usage: spawn_entity <${valid.join("|")}>` }];
        }
        window.dispatchEvent(new CustomEvent("spawn-entity", { detail: { name } }));
        return [{ type: "output", text: `Spawned ${name}` }];
      }

      case "list_acts": {
        return STORY_ACTS.map(a => ({
          type: "output" as const,
          text: `  ${a.id}: ${a.title} (${a.beats.length} beats)`,
        }));
      }

      case "get_folds": {
        return [
          { type: "output", text: `secret_fold_unlocked: ${folds.secretFoldUnlocked}` },
          { type: "output", text: `acts_completed: [${folds.actsCompleted.join(", ")}]` },
          { type: "output", text: `total_playthroughs: ${folds.totalPlaythroughs}` },
          { type: "output", text: `last_visit: ${folds.lastVisit || "never"}` },
        ];
      }

      case "reset_folds": {
        resetFolds();
        return [{ type: "output", text: "Persistent folds reset." }];
      }

      default:
        return [];
    }
  }, [folds, resetFolds]);

  // Title screen
  if (showTitle) {
    return (
      <div style={{
        position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 50, fontFamily: "Georgia, serif", background: "#fdf6e3",
      }}>
        <TitleScreen onStart={handleStart} folds={folds} />
      </div>
    );
  }

  return (
    <>
      <Canvas
        camera={{ position: [3, 2, 5], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 1.5]}
        style={{ position: "absolute", inset: 0 }}
      >
        <color attach="background" args={["#fdf6e3"]} />
        <Fog />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
        <directionalLight position={[-3, 4, -2]} intensity={0.3} color="#e0e7ff" />
        <hemisphereLight args={["#fdf6e3", "#e8e0d4", 0.4]} />
        <Suspense fallback={null}>
          <PaperWorld
            narrativeState={narrativeState}
            onSecretFoldInteract={handleSecretFoldInteract}
            windForce={windForce}
            onLoreCollect={handleLoreCollect}
          />
          <StoryCamera
            narrativeState={narrativeState}
            onInteractionProgress={handleInteractionProgress}
            onInteractionComplete={handleInteractionComplete}
          />
        </Suspense>
      </Canvas>

      {/* Cinematic overlay */}
      {isCinematic && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 40, pointerEvents: "none",
        }}>
          <div style={{
            width: 30, height: 30, border: "3px solid #1a1a2e", borderRadius: "50%",
            borderTopColor: "transparent", animation: "spin 1s linear infinite",
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      <NarrativeOverlay
        state={narrativeState}
        onAdvance={handleAdvance}
        onInteractionProgress={handleInteractionProgress}
        onInteractionComplete={handleInteractionComplete}
      />

      {/* Persistent folds indicator */}
      {folds.secretFoldUnlocked && (
        <div style={{
          position: "fixed", bottom: 16, left: 16,
          background: "rgba(251, 191, 36, 0.15)",
          border: "1px solid rgba(251, 191, 36, 0.3)",
          borderRadius: 8,
          padding: "6px 12px",
          fontSize: 11,
          color: "#92400e",
          fontFamily: "Georgia, serif",
          zIndex: 30,
        }}>
          The paper remembers.
        </div>
      )}

      {/* Drafting Terminal */}
      <DraftingTerminal
        visible={terminalOpen}
        onClose={() => setTerminalOpen(false)}
        sceneState={{
          windForce,
          mood: currentMood,
          currentAct: narrativeState.currentAct,
          currentBeat: narrativeState.currentBeat,
          cameraPos,
        }}
        onCommand={handleTerminalCommand}
      />

      {/* Lore Modal */}
      {loreModal && (
        <LoreModal entry={loreModal} onClose={() => setLoreModal(null)} />
      )}

      {/* Command Palette (Ctrl+K) */}
      <CommandPalette
        visible={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        commands={[
          { id: "act-1", label: "Jump to Act 1: The Crane Who Couldn't Fly", category: "Chapters", shortcut: "1", action: () => setNarrativeState(prev => ({ ...prev, currentAct: 0, currentBeat: 0, interactionState: "idle" })) },
          { id: "act-2", label: "Jump to Act 2: The Storm", category: "Chapters", shortcut: "2", action: () => setNarrativeState(prev => ({ ...prev, currentAct: 1, currentBeat: 0, interactionState: "idle" })) },
          { id: "act-3", label: "Jump to Act 3: The Fox Who Was Hiding", category: "Chapters", shortcut: "3", action: () => setNarrativeState(prev => ({ ...prev, currentAct: 2, currentBeat: 0, interactionState: "idle" })) },
          { id: "act-4", label: "Jump to Act 4: The Unfolded Lands", category: "Chapters", shortcut: "4", action: () => setNarrativeState(prev => ({ ...prev, currentAct: 3, currentBeat: 0, interactionState: "idle" })) },
          { id: "act-5", label: "Jump to Act 5: The Secret Fold", category: "Chapters", shortcut: "5", action: () => setNarrativeState(prev => ({ ...prev, currentAct: 4, currentBeat: 0, interactionState: "idle" })) },
          { id: "act-6", label: "Jump to Act 6: The Return", category: "Chapters", shortcut: "6", action: () => setNarrativeState(prev => ({ ...prev, currentAct: 5, currentBeat: 0, interactionState: "idle" })) },
          { id: "act-7", label: "Jump to Act 7: The Boat Named Pip", category: "Chapters", shortcut: "7", action: () => setNarrativeState(prev => ({ ...prev, currentAct: 6, currentBeat: 0, interactionState: "idle" })) },
          { id: "act-8", label: "Jump to Act 8: The Moral Fold", category: "Chapters", shortcut: "8", action: () => setNarrativeState(prev => ({ ...prev, currentAct: 7, currentBeat: 0, interactionState: "idle" })) },
          { id: "wind-up", label: "Increase Wind Force", category: "Scene", action: () => { setWindForce(prev => Math.min(10, prev + 1)); window.dispatchEvent(new CustomEvent("set-wind-force", { detail: { force: Math.min(10, windForce + 1) } })); } },
          { id: "wind-down", label: "Decrease Wind Force", category: "Scene", action: () => { setWindForce(prev => Math.max(0, prev - 1)); window.dispatchEvent(new CustomEvent("set-wind-force", { detail: { force: Math.max(0, windForce - 1) } })); } },
          { id: "mood-storm", label: "Set Mood: Storm", category: "Scene", action: () => { setCurrentMood("storm"); window.dispatchEvent(new CustomEvent("set-mood", { detail: { mood: "storm" } })); } },
          { id: "mood-calm", label: "Set Mood: Calm", category: "Scene", action: () => { setCurrentMood("calm"); window.dispatchEvent(new CustomEvent("set-mood", { detail: { mood: "calm" } })); } },
          { id: "mood-hope", label: "Set Mood: Hope", category: "Scene", action: () => { setCurrentMood("hope"); window.dispatchEvent(new CustomEvent("set-mood", { detail: { mood: "hope" } })); } },
          { id: "terminal", label: "Open Drafting Terminal", category: "Tools", shortcut: "Ctrl+~", action: () => setTerminalOpen(true) },
          { id: "reset", label: "Reset All Progress", category: "Tools", action: () => { resetFolds(); window.location.reload(); } },
        ]}
      />
    </>
  );
}

// ─── Lore Modal (Obsidian-style markdown) ──────────────────────────────

function LoreModal({ entry, onClose }: { entry: LoreEntry; onClose: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (overlayRef.current) {
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    }
    if (contentRef.current) {
      gsap.fromTo(contentRef.current, { opacity: 0, y: 20, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "power2.out", delay: 0.1 });
    }
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Simple markdown renderer (headers, blockquotes, bold, line breaks)
  const renderMarkdown = (md: string) => {
    return md.split("\n").map((line, i) => {
      if (line.startsWith("## ")) {
        return <h2 key={i} style={{ fontSize: 18, fontWeight: 700, color: "#1a1a2e", marginTop: i === 0 ? 0 : 16, marginBottom: 8 }}>{line.slice(3)}</h2>;
      }
      if (line.startsWith("> ")) {
        return <blockquote key={i} style={{ borderLeft: "3px solid #a78bfa", paddingLeft: 12, color: "#1a1a2e", fontStyle: "italic", margin: "8px 0" }}>{line.slice(2)}</blockquote>;
      }
      if (line.startsWith("- ")) {
        return <li key={i} style={{ marginLeft: 16, color: "#1a1a2e" }}>{line.slice(2)}</li>;
      }
      if (line.match(/^\d+\./)) {
        return <div key={i} style={{ marginLeft: 16, color: "#1a1a2e" }}>{line}</div>;
      }
      if (line.trim() === "") return <div key={i} style={{ height: 8 }} />;
      // Bold
      const bolded = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      return <p key={i} style={{ color: "#1a1a2e", lineHeight: 1.7, margin: "4px 0" }} dangerouslySetInnerHTML={{ __html: bolded }} />;
    });
  };

  return (
    <div
      ref={overlayRef}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(8px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={contentRef}
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "32px 36px",
          maxWidth: 520,
          width: "90%",
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
          fontFamily: "'Georgia', serif",
        }}
      >
        {/* Title bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2, color: "#a78bfa", marginBottom: 4, fontFamily: "monospace" }}>
              Lore Fragment
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a2e", margin: 0 }}>{entry.title}</h1>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "1px solid #e5e7eb", borderRadius: 6,
              width: 28, height: 28, cursor: "pointer", color: "#1a1a2e",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontFamily: "monospace",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ width: "100%", height: 1, background: "#f3f4f6", margin: "0 0 16px" }} />

        {/* Content */}
        <div style={{ fontSize: 14, lineHeight: 1.6 }}>
          {renderMarkdown(entry.content)}
        </div>

        <div style={{ width: "100%", height: 1, background: "#f3f4f6", margin: "16px 0 12px" }} />

        <div style={{ fontSize: 10, color: "#1a1a2e", textAlign: "center", fontFamily: "monospace", fontWeight: 600 }}>
          Press Esc or click outside to close
        </div>
      </div>
    </div>
  );
}

// ─── Title Screen ─────────────────────────────────────────────────────

function TitleScreen({ onStart, folds }: { onStart: () => void; folds: ReturnType<typeof usePersistentFolds>["folds"] }) {
  const titleRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const tl = gsap.timeline();
    gsap.set([titleRef.current, subRef.current, textRef.current, btnRef.current], { opacity: 0, y: 20 });
    tl.to(titleRef.current, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.2 })
      .to(subRef.current, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.4")
      .to(textRef.current, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, "-=0.2")
      .to(btnRef.current, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.2");
    return () => { tl.kill(); };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onStart(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onStart]);

  return (
    <div style={{
      background: "#fff", border: "3px solid #1a1a2e", borderRadius: 20,
      padding: "48px 56px", boxShadow: "6px 6px 0 #1a1a2e", textAlign: "center",
      maxWidth: 460, width: "90%",
    }}>
      <div ref={titleRef} style={{ fontSize: 52, fontWeight: "bold", color: "#1a1a2e", letterSpacing: -2, marginBottom: 4 }}>
        DRIFT
      </div>
      <div ref={subRef} style={{ fontSize: 15, color: "#1a1a2e", marginBottom: 24, fontStyle: "italic" }}>
        A Paper World
      </div>
      <div style={{ width: 60, height: 2, background: "#1a1a2e", margin: "0 auto 24px" }} />
      <div ref={textRef} style={{ fontSize: 14, color: "#1a1a2e", lineHeight: 1.8, marginBottom: 28 }}>
        There was a paper crane named Milo who could not fly. One wing was bigger than the other.
        But he never stopped jumping.
      </div>

      {/* Persistent state hint */}
      {folds.totalPlaythroughs > 0 && (
        <div style={{
          fontSize: 11, color: "#1a1a2e", marginBottom: 16,
          fontStyle: "italic", fontFamily: "Georgia, serif",
        }}>
          The world remembers {folds.totalPlaythroughs} previous {folds.totalPlaythroughs === 1 ? "visit" : "visits"}.
          {folds.secretFoldUnlocked && " The secret fold was unlocked."}
        </div>
      )}

      <button ref={btnRef} onClick={onStart} style={{
        background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 12,
        padding: "14px 36px", fontSize: 16, fontFamily: "Georgia, serif", cursor: "pointer",
        boxShadow: "3px 3px 0 #6b7280",
      }}>
        {folds.totalPlaythroughs > 0 ? "Enter Again" : "Begin the Story"}
      </button>
      <div style={{ fontSize: 11, color: "#1a1a2e", marginTop: 20, fontWeight: 600 }}>or press Enter</div>
    </div>
  );
}
