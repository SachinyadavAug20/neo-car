"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import gsap from "gsap";

interface CommandEntry {
  id: string;
  label: string;
  category: string;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  visible: boolean;
  onClose: () => void;
  commands: CommandEntry[];
}

export default function CommandPalette({ visible, onClose, commands }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!query) return commands;
    const q = query.toLowerCase();
    return commands.filter(c =>
      c.label.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q)
    );
  }, [query, commands]);

  useEffect(() => {
    if (visible) {
      setQuery("");
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [visible]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  const execute = useCallback((cmd: CommandEntry) => {
    cmd.action();
    onClose();
  }, [onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx(prev => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIdx]) execute(filtered[selectedIdx]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  }, [filtered, selectedIdx, execute, onClose]);

  // Scroll selected into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[selectedIdx] as HTMLElement;
    if (item) item.scrollIntoView({ block: "nearest" });
  }, [selectedIdx]);

  if (!visible) return null;

  // Group by category
  const grouped = filtered.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, CommandEntry[]>);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingTop: "15vh",
        background: "rgba(0, 0, 0, 0.4)", backdropFilter: "blur(8px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "90%", maxWidth: 520,
        background: "#1a1a2e", border: "1px solid #333",
        borderRadius: 12, overflow: "hidden",
        boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      }}>
        {/* Search input */}
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #333", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "#6b7280", fontSize: 14 }}>{">"}</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commands..."
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: "#e5e7eb", fontSize: 14, fontFamily: "inherit",
            }}
            spellCheck={false}
          />
          <span style={{ color: "#4b5563", fontSize: 11 }}>ESC</span>
        </div>

        {/* Results */}
        <div ref={listRef} style={{ maxHeight: 340, overflowY: "auto", padding: "6px 0" }}>
          {filtered.length === 0 && (
            <div style={{ padding: "16px", color: "#6b7280", fontSize: 13, textAlign: "center" }}>
              No commands found
            </div>
          )}
          {Object.entries(grouped).map(([category, cmds]) => (
            <div key={category}>
              <div style={{
                padding: "6px 16px", fontSize: 10, textTransform: "uppercase",
                letterSpacing: 1.5, color: "#6b7280", fontWeight: 600,
              }}>
                {category}
              </div>
              {cmds.map((cmd) => {
                const idx = filtered.indexOf(cmd);
                const isSelected = idx === selectedIdx;
                return (
                  <div
                    key={cmd.id}
                    onClick={() => execute(cmd)}
                    style={{
                      padding: "8px 16px", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      background: isSelected ? "rgba(167, 139, 250, 0.15)" : "transparent",
                      borderLeft: isSelected ? "2px solid #a78bfa" : "2px solid transparent",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={() => setSelectedIdx(idx)}
                  >
                    <span style={{ color: "#e5e7eb", fontSize: 13 }}>{cmd.label}</span>
                    {cmd.shortcut && (
                      <span style={{ color: "#6b7280", fontSize: 11, marginLeft: 12 }}>{cmd.shortcut}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: "8px 16px", borderTop: "1px solid #333",
          display: "flex", gap: 16, fontSize: 10, color: "#4b5563",
        }}>
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
