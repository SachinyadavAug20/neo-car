"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useState, useCallback, useRef, useEffect, useMemo } from "react";
import PaperWorld from "./PaperWorld";
import { LoreEntry } from "./PaperWorld";
import StoryCamera from "./StoryCamera";
import NarrativeOverlay from "../ui/NarrativeOverlay";
import DraftingTerminal from "../ui/DraftingTerminal";
import CommandPalette from "../ui/CommandPalette";
import CustomCursor from "../ui/CustomCursor";
import AudioController from "../ui/AudioController";
import LoadingScreen from "../ui/LoadingScreen";
import { useKeyboardSecrets } from "../ui/useInteractions";
import { useJourneyTracker } from "@/app/lib/useJourneyTracker";
import { setupAudioEvents, playBeatAdvance, playActTransition } from "@/app/lib/audio";
import Fog from "./Fog";
import { NarrativeState, INITIAL_STATE, getCurrentBeat, getCurrentAct, nextBeat, STORY_ACTS } from "@/app/lib/narrative";
import { usePersistentFolds } from "@/app/lib/usePersistentFolds";
import { TerminalLine } from "../ui/DraftingTerminal";
import ThemeToggle from "../ui/ThemeToggle";
import { useTheme } from "@/app/lib/ThemeContext";
import gsap from "gsap";
import * as THREE from "three";

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
  const [isLoading, setIsLoading] = useState(true);
  const secretTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const windForceRef = useRef(windForce);

  // Hide loading screen after mount
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Journey tracker
  const { stats: journeyStats, setCurrentAct, visitBeat, completeInteraction, trackEvent } = useJourneyTracker();

  const { folds, unlockSecretFold, completeAct, incrementPlaythrough, addPlayTime, resetFolds } = usePersistentFolds();
  const storyStartTimeRef = useRef<number>(0);

  // Setup audio events on mount
  useEffect(() => {
    const cleanup = setupAudioEvents();
    return () => { if (cleanup) cleanup(); };
  }, []);

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

  // Keyboard secrets (type "wind", "paper", "fold", etc.)
  const [secretNotification, setSecretNotification] = useState<string | null>(null);
  useEffect(() => { windForceRef.current = windForce; }, [windForce]);
  useKeyboardSecrets(useCallback((word: string) => {
    trackEvent("secret-found", { word });
    switch (word) {
      case "wind":
        setWindForce(prev => Math.min(10, prev + 2));
        window.dispatchEvent(new CustomEvent("set-wind-force", { detail: { force: Math.min(10, windForceRef.current + 2) } }));
        trackEvent("wind-generated", { force: 2 });
        break;
      case "paper":
        window.dispatchEvent(new CustomEvent("paper-shower"));
        break;
      case "fold":
        window.dispatchEvent(new CustomEvent("fold-crease"));
        break;
      case "pip":
      case "milo":
      case "crane":
        window.dispatchEvent(new CustomEvent("spawn-entity", { detail: { name: word } }));
        break;
      case "sudo":
        window.dispatchEvent(new CustomEvent("toggle-debug"));
        break;
      case "help":
        setTerminalOpen(true);
        break;
      case "drift":
        window.dispatchEvent(new CustomEvent("drift-mode"));
        break;
    }
    if (secretTimeoutRef.current) clearTimeout(secretTimeoutRef.current);
    setSecretNotification(`"${word}" activated`);
    secretTimeoutRef.current = setTimeout(() => setSecretNotification(null), 2000);
  }, []));

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
    storyStartTimeRef.current = Date.now();
    setNarrativeState({
      ...INITIAL_STATE,
      started: true,
      currentAct: 0,
      currentBeat: 0,
    });
    incrementPlaythrough();
  }, [incrementPlaythrough]);

  const handleAdvance = useCallback((newState: NarrativeState) => {
    const prevAct = narrativeState.currentAct;
    setNarrativeState(newState);
    // Audio: beat advance
    window.dispatchEvent(new CustomEvent("beat-advance"));
    // Audio: act transition
    if (newState.currentAct !== prevAct) {
      window.dispatchEvent(new CustomEvent("act-transition"));
    }
  }, [narrativeState.currentAct]);

  const handleInteractionProgress = useCallback((progress: number) => {
    setNarrativeState(prev => ({ ...prev, interactionProgress: progress }));
  }, []);

  const handleInteractionComplete = useCallback(() => {
    setNarrativeState(prev => {
      const beat = getCurrentBeat(prev);
      completeInteraction(prev.currentAct);
      if (beat?.interaction === "drag-wind" || beat?.interaction === "click-jump") {
        setTimeout(() => {
          setNarrativeState(p => nextBeat(p));
        }, 1500);
      }
      return { ...prev, interactionState: "complete" };
    });
  }, [completeInteraction]);

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

  // Track act completion and journey
  useEffect(() => {
    if (narrativeState.started) {
      completeAct(narrativeState.currentAct);
      setCurrentAct(narrativeState.currentAct);
      visitBeat(narrativeState.currentAct, narrativeState.currentBeat);
    }
  }, [narrativeState.currentAct, narrativeState.currentBeat, narrativeState.started, completeAct, setCurrentAct, visitBeat]);

  // Track specific interaction events
  useEffect(() => {
    const events = [
      "milo-jump", "collect-leaf", "toggle-cell", "row-boat",
      "follow-butterfly", "celebrate", "shatter", "pendulum-push",
      "critter-found", "lore-collected",
    ];
    const handlers = events.map(evt => {
      const handler = () => trackEvent(evt);
      window.addEventListener(evt, handler);
      return { evt, handler };
    });
    return () => handlers.forEach(({ evt, handler }) => window.removeEventListener(evt, handler));
  }, [trackEvent]);

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

  // Memoized command palette commands — stable reference
  const paletteCommands = useMemo(() => [
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
    { id: "terminal", label: "Open Drafting Terminal", category: "Tools", shortcut: "Ctrl + ~", action: () => setTerminalOpen(true) },
    { id: "reset", label: "Reset All Progress", category: "Tools", action: () => { resetFolds(); window.location.reload(); } },
  ], [windForce, resetFolds]);

  // Loading screen
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Title screen
  if (showTitle) {
    return (
      <div style={{
        position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 50, fontFamily: "Georgia, serif", background: "var(--bg)",
      }}>
        <TitleScreen onStart={handleStart} folds={folds} resetFolds={resetFolds} />
      </div>
    );
  }

  return (
    <>
      {/* Custom cursor */}
      <CustomCursor />

      {/* Audio controller */}
      <AudioController mood={currentMood as any} />
      <Canvas
        camera={{ position: [3, 2, 5], fov: 50 }}
        gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
        dpr={[1, 1.5]}
        shadows
        style={{ position: "absolute", inset: 0 }}
      >
        <color attach="background" args={["#fdf6e3"]} />
        <Fog />

        {/* Improved lighting setup */}
        <ambientLight intensity={0.6} color="#fdf6e3" />
        <directionalLight
          position={[8, 12, 8]}
          intensity={1.5}
          color="#fff8e7"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.1}
          shadow-camera-far={100}
          shadow-camera-left={-30}
          shadow-camera-right={30}
          shadow-camera-top={30}
          shadow-camera-bottom={-30}
        />
        <directionalLight position={[-5, 6, -3]} intensity={0.4} color="#e0e7ff" />
        <pointLight position={[0, 5, 0]} intensity={0.3} color="#fbbf24" distance={20} />
        <hemisphereLight args={["#fdf6e3", "#e8e0d4", 0.5]} />

        {/* Rim light for depth */}
        <directionalLight position={[0, 3, -10]} intensity={0.2} color="#c4b5fd" />

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
        journeyStats={{ ...journeyStats, foldsUnlocked: folds.secretFoldUnlocked }}
        onRestart={() => {
          if (storyStartTimeRef.current > 0) {
            addPlayTime(Date.now() - storyStartTimeRef.current);
          }
          window.location.reload();
        }}
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

      {/* Secret word notification */}
      {secretNotification && (
        <div style={{
          position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)",
          background: "rgba(26, 26, 46, 0.9)", color: "var(--accent)",
          borderRadius: 12, padding: "10px 24px",
          fontSize: 14, fontFamily: "monospace", fontWeight: 700,
          zIndex: 100, animation: "fadeSlideIn 0.3s ease-out",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}>
          {secretNotification}
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
        commands={paletteCommands}
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
        return <h2 key={i} style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginTop: i === 0 ? 0 : 16, marginBottom: 8 }}>{line.slice(3)}</h2>;
      }
      if (line.startsWith("> ")) {
        return <blockquote key={i} style={{ borderLeft: "3px solid var(--accent)", paddingLeft: 12, color: "var(--text-muted)", fontStyle: "italic", margin: "8px 0" }}>{line.slice(2)}</blockquote>;
      }
      if (line.startsWith("- ")) {
        return <li key={i} style={{ marginLeft: 16, color: "var(--text-muted)" }}>{line.slice(2)}</li>;
      }
      if (line.match(/^\d+\./)) {
        return <div key={i} style={{ marginLeft: 16, color: "var(--text-muted)" }}>{line}</div>;
      }
      if (line.trim() === "") return <div key={i} style={{ height: 8 }} />;
      // Bold
      const bolded = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      return <p key={i} style={{ color: "var(--text-muted)", lineHeight: 1.7, margin: "4px 0" }} dangerouslySetInnerHTML={{ __html: bolded }} />;
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
          background: "var(--bg-card)",
          border: "1px solid var(--border-light)",
          borderRadius: 12,
          padding: "32px 36px",
          maxWidth: 520,
          width: "90%",
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
          fontFamily: "'Georgia', serif",
          transition: "background 0.3s, border-color 0.3s",
        }}
      >
        {/* Title bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2, color: "var(--accent)", marginBottom: 4, fontFamily: "monospace" }}>
              Lore Fragment
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", margin: 0, transition: "color 0.3s" }}>{entry.title}</h1>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "1px solid var(--border-light)", borderRadius: 6,
              width: 28, height: 28, cursor: "pointer", color: "var(--text-muted)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontFamily: "monospace",
              transition: "border-color 0.3s, color 0.3s",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ width: "100%", height: 1, background: "var(--border-light)", margin: "0 0 16px", transition: "background 0.3s" }} />

        {/* Content */}
        <div style={{ fontSize: 14, lineHeight: 1.6 }}>
          {renderMarkdown(entry.content)}
        </div>

        <div style={{ width: "100%", height: 1, background: "var(--border-light)", margin: "16px 0 12px", transition: "background 0.3s" }} />

        <div style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "center", fontFamily: "monospace", fontWeight: 600, transition: "color 0.3s" }}>
          Press Esc or click outside to close
        </div>
      </div>
    </div>
  );
}

// ─── Title Screen ─────────────────────────────────────────────────────

function TitleScreen({ onStart, folds, resetFolds }: { onStart: () => void; folds: ReturnType<typeof usePersistentFolds>["folds"]; resetFolds: () => void }) {
  const titleRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const { theme } = useTheme();
  const [particles] = useState(() => Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 3 + Math.random() * 10,
    delay: Math.random() * 8,
    duration: 10 + Math.random() * 12,
    opacity: 0.05 + Math.random() * 0.1,
    rotation: Math.random() * 360,
  })));

  useEffect(() => {
    const tl = gsap.timeline();
    gsap.set([titleRef.current, subRef.current, textRef.current, btnRef.current, navRef.current, featuresRef.current], { opacity: 0, y: 16 });
    tl.to(navRef.current, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", delay: 0.2 })
      .to(titleRef.current, { opacity: 1, y: 0, duration: 1, ease: "power3.out" }, "-=0.3")
      .to(subRef.current, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, "-=0.5")
      .to(textRef.current, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }, "-=0.3")
      .to(featuresRef.current, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.2")
      .to(btnRef.current, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.2");
    return () => { tl.kill(); };
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) / rect.width;
        const dy = (e.clientY - cy) / rect.height;
        cardRef.current.style.transform = `perspective(800px) rotateY(${dx * 3}deg) rotateX(${-dy * 3}deg)`;
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
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
      position: "absolute", inset: 0, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", zIndex: 30,
      pointerEvents: "auto", overflow: "hidden",
      background: "var(--bg)", transition: "background 0.3s",
    }}>
      {/* Floating paper particles */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {particles.map((p) => (
          <div key={p.id} style={{
            position: "absolute", left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size, background: "var(--text)",
            opacity: p.opacity,
            borderRadius: p.id % 3 === 0 ? "50%" : p.id % 3 === 1 ? "2px" : "0",
            transform: `rotate(${p.rotation}deg)`,
            animation: `float-particle ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
          }} />
        ))}
      </div>

      {/* Top nav */}
      <div ref={navRef} style={{
        position: "absolute", top: 0, left: 0, right: 0,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 20px", opacity: 0,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", letterSpacing: -0.5, transition: "color 0.3s" }}>
          DRIFT
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <a href="/about" style={{
            fontSize: 12, color: "var(--text)", textDecoration: "none", fontWeight: 600,
            opacity: 0.5, transition: "opacity 0.2s, color 0.3s",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
          >About</a>
          <a href="https://github.com/SachinyadavAug20/neo-car" target="_blank" rel="noopener noreferrer" style={{
            fontSize: 12, color: "var(--text)", textDecoration: "none", fontWeight: 600,
            opacity: 0.5, transition: "opacity 0.2s, color 0.3s",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
          >GitHub</a>
          <ThemeToggle />
        </div>
      </div>

      {/* Main card */}
      <div ref={cardRef} style={{
        background: "var(--bg-card)", border: "2px solid var(--border)", borderRadius: 16,
        padding: "48px 56px", textAlign: "center",
        boxShadow: "6px 6px 0 var(--shadow)",
        maxWidth: 500, width: "90%", transition: "transform 0.1s ease-out, background 0.3s, border-color 0.3s, box-shadow 0.3s",
        willChange: "transform",
      }}>
        {/* Crane icon */}
        <div style={{ marginBottom: 20, opacity: 0.35 }}>
          <svg width="40" height="40" viewBox="0 0 60 60" fill="none" style={{ display: "block", margin: "0 auto" }}>
            <path d="M30 8 L52 30 L30 26 L8 30 Z" fill="currentColor" opacity="0.8"/>
            <path d="M30 26 L30 52" stroke="currentColor" strokeWidth="2"/>
            <path d="M30 26 L52 30 L44 42" fill="currentColor" opacity="0.6"/>
            <path d="M30 26 L8 30 L16 42" fill="currentColor" opacity="0.6"/>
          </svg>
        </div>

        <div ref={titleRef} style={{
          fontSize: 56, fontWeight: "bold", color: "var(--text)", letterSpacing: -3,
          marginBottom: 6, opacity: 0, lineHeight: 1, transition: "color 0.3s",
        }}>
          DRIFT
        </div>
        <div ref={subRef} style={{
          fontSize: 17, color: "var(--text)", marginBottom: 20, fontStyle: "italic",
          opacity: 0, letterSpacing: 1.5, transition: "color 0.3s",
        }}>
          A Paper World
        </div>
        <div style={{ width: 48, height: 2, background: "var(--text)", margin: "0 auto 20px", opacity: 0.2, transition: "background 0.3s" }} />
        <div ref={textRef} style={{
          fontSize: 15, color: "var(--text-muted)", lineHeight: 1.8, marginBottom: 28,
          opacity: 0, maxWidth: 380, margin: "0 auto 28px", transition: "color 0.3s",
        }}>
          There was a paper crane named Milo who could not fly.
          One wing was bigger than the other. But he never stopped jumping.
        </div>

        {/* Feature highlights */}
        <div ref={featuresRef} style={{
          display: "flex", justifyContent: "center", gap: 20, marginBottom: 28,
          opacity: 0, flexWrap: "wrap",
        }}>
          {[
            { dot: "#1a1a2e", label: "8 Acts" },
            { dot: "#fbbf24", label: "110 Sounds" },
            { dot: "#a78bfa", label: "Secrets" },
          ].map((f, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 12, color: "var(--text-muted)", fontWeight: 600, opacity: 0.55,
              transition: "color 0.3s",
            }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: f.dot }} />
              {f.label}
            </div>
          ))}
        </div>

        {folds.totalPlaythroughs > 0 && (
          <div style={{
            fontSize: 12, color: "var(--text-muted)", marginBottom: 20,
            fontStyle: "italic", opacity: 0.4, transition: "color 0.3s",
          }}>
            The world remembers {folds.totalPlaythroughs} previous {folds.totalPlaythroughs === 1 ? "visit" : "visits"}.
            {folds.secretFoldUnlocked && " The secret fold was unlocked."}
          </div>
        )}

        <button ref={btnRef} onClick={onStart} style={{
          background: "var(--text)", color: "var(--bg)", border: "none", borderRadius: 10,
          padding: "15px 44px", fontSize: 15, fontFamily: "Georgia, serif", cursor: "pointer",
          fontWeight: 600, boxShadow: "3px 3px 0 var(--shadow)",
          transition: "transform 0.15s, box-shadow 0.15s, background 0.3s, color 0.3s", opacity: 0,
        }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translate(-1px, -1px)";
            e.currentTarget.style.boxShadow = "4px 4px 0 var(--shadow)";
            window.dispatchEvent(new CustomEvent("button-hover"));
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translate(0, 0)";
            e.currentTarget.style.boxShadow = "3px 3px 0 var(--shadow)";
            window.dispatchEvent(new CustomEvent("hover-out"));
          }}
        >
          {folds.totalPlaythroughs > 0 ? "Enter Again" : "Begin the Story"}
        </button>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 14, fontWeight: 600, opacity: 0.35, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "color 0.3s" }}>
          <kbd style={{ padding: "2px 8px", border: "1px solid var(--border-light)", borderRadius: 4, fontSize: 10, background: "var(--bg-elevated)", transition: "background 0.3s, border-color 0.3s" }}>Enter</kbd>
          <span>to start</span>
        </div>
        {folds.totalPlaythroughs > 0 && (
          <button onClick={() => { if (confirm("Reset all progress? This cannot be undone.")) resetFolds(); }} style={{
            background: "none", border: "none", color: "var(--text-muted)", fontSize: 11,
            cursor: "pointer", marginTop: 12, opacity: 0.3, textDecoration: "underline",
            transition: "opacity 0.2s, color 0.3s",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.7"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.3"; }}
          >Reset all progress</button>
        )}
      </div>
    </div>
  );
}
