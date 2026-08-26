"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import gsap from "gsap";

export interface TerminalLine {
  type: "input" | "output" | "error" | "system";
  text: string;
}

interface DraftingTerminalProps {
  visible: boolean;
  onClose: () => void;
  sceneState: {
    windForce: number;
    mood: string;
    currentAct: number;
    currentBeat: number;
    cameraPos: [number, number, number];
  };
  onCommand: (cmd: string, args: string[]) => TerminalLine[];
}

const HELP_TEXT = [
  "DRIFT Drafting Terminal v1.0",
  "─────────────────────────────────────",
  "",
  "Commands:",
  "  help                     Show this help",
  "  get_state                Dump current scene state",
  "  set_wind_force <0-10>    Adjust global wind intensity",
  "  set_mood <mood>          Change mood (warm/storm/calm/secret/sorrow/hope/final)",
  "  set_camera <x> <y> <z>   Teleport camera position",
  "  jump_to <act> <beat>     Jump to a specific act and beat",
  "  spawn_entity <name>      Spawn character (pip/sage/lira/milo)",
  "  list_acts                List all acts in the story",
  "  get_folds                Show persistent fold state",
  "  reset_folds              Reset all saved progress",
  "  clear                    Clear terminal history",
  "",
  "  Hidden: Ctrl+~ opens this terminal.",
  "  Hidden: Check the console for secret coordinates.",
  "  Hidden: Collect purple fragments for Sage's notes.",
  "",
  "Press Ctrl+~ or Esc to close.",
];

export default function DraftingTerminal({ visible, onClose, sceneState, onCommand }: DraftingTerminalProps) {
  const [history, setHistory] = useState<TerminalLine[]>([]);
  const [input, setInput] = useState("");
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus();
      if (history.length === 0) {
        setHistory([
          { type: "system", text: "DRIFT Drafting Terminal v1.0" },
          { type: "system", text: "Type 'help' for available commands." },
          { type: "system", text: "" },
        ]);
      }
    }
  }, [visible]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const executeCommand = useCallback((raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    // Add input to history
    const newLines: TerminalLine[] = [{ type: "input", text: `> ${trimmed}` }];

    if (cmd === "clear") {
      setHistory([]);
      return;
    }

    // Built-in commands
    if (cmd === "help") {
      HELP_TEXT.forEach(l => newLines.push({ type: "output", text: l }));
    } else if (cmd === "get_state") {
      newLines.push({ type: "output", text: `wind_force: ${sceneState.windForce}` });
      newLines.push({ type: "output", text: `mood: ${sceneState.mood}` });
      newLines.push({ type: "output", text: `act: ${sceneState.currentAct + 1}, beat: ${sceneState.currentBeat + 1}` });
      newLines.push({ type: "output", text: `camera: [${sceneState.cameraPos.map(v => v.toFixed(2)).join(", ")}]` });
    } else if (cmd === "list_acts") {
      const acts = [
        "1: The Crane Who Couldn't Fly",
        "2: The Storm",
        "3: The Fox Who Was Hiding",
        "4: The Unfolded Lands",
        "5: The Secret Fold",
        "6: The Return",
        "7: The Boat Named Pip",
        "8: The Moral Fold",
      ];
      acts.forEach(a => newLines.push({ type: "output", text: a }));
    } else {
      // Delegate to scene handler
      const result = onCommand(cmd, args);
      if (result.length === 0) {
        newLines.push({ type: "error", text: `Unknown command: '${cmd}'. Type 'help' for available commands.` });
      } else {
        result.forEach(l => newLines.push(l));
      }
    }

    setHistory(prev => [...prev, ...newLines]);
    setCmdHistory(prev => [trimmed, ...prev.slice(0, 49)]);
    setHistoryIdx(-1);
    setInput("");
  }, [sceneState, onCommand]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      executeCommand(input);
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length > 0) {
        const newIdx = Math.min(historyIdx + 1, cmdHistory.length - 1);
        setHistoryIdx(newIdx);
        setInput(cmdHistory[newIdx]);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx > 0) {
        const newIdx = historyIdx - 1;
        setHistoryIdx(newIdx);
        setInput(cmdHistory[newIdx]);
      } else {
        setHistoryIdx(-1);
        setInput("");
      }
      return;
    }
  }, [input, cmdHistory, historyIdx, executeCommand, onClose]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'SF Mono', monospace",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: "90%",
          maxWidth: 720,
          maxHeight: "80vh",
          background: "#0a0a0a",
          border: "1px solid #333",
          borderRadius: 8,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}
      >
        {/* Title bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 16px",
            background: "#111",
            borderBottom: "1px solid #222",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#eab308" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e" }} />
          </div>
          <span style={{ color: "#666", fontSize: 12 }}>drift — drafting terminal</span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#666",
              cursor: "pointer",
              fontSize: 16,
              fontFamily: "inherit",
              padding: "0 4px",
            }}
          >
            ×
          </button>
        </div>

        {/* Output area */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "12px 16px",
            minHeight: 300,
            maxHeight: "calc(80vh - 80px)",
          }}
        >
          {history.map((line, i) => (
            <div
              key={i}
              style={{
                color: line.type === "input" ? "#60a5fa" : line.type === "error" ? "#f87171" : line.type === "system" ? "#a78bfa" : "#d4d4d4",
                fontSize: 13,
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {line.text}
            </div>
          ))}

          {/* Input line */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <span style={{ color: "#22c55e", fontSize: 13 }}>{">"}</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#d4d4d4",
                fontSize: 13,
                fontFamily: "inherit",
                caretColor: "#22c55e",
              }}
              spellCheck={false}
              autoComplete="off"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
