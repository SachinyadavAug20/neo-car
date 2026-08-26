"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

interface CommandEntry {
  id: string;
  label: string;
  category: string;
  shortcut?: string;
  icon?: React.ReactNode;
  action: () => void;
}

interface CommandPaletteProps {
  visible: boolean;
  onClose: () => void;
  commands: CommandEntry[];
}

export default function CommandPalette({ visible, onClose, commands }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  // Group commands by category
  const groups = useMemo(() => {
    const map = new Map<string, CommandEntry[]>();
    for (const cmd of commands) {
      if (!map.has(cmd.category)) map.set(cmd.category, []);
      map.get(cmd.category)!.push(cmd);
    }
    return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
  }, [commands]);

  // Filter groups by query
  const filtered = useMemo(() => {
    if (!query.trim()) return groups;
    const q = query.toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (c) =>
            c.label.toLowerCase().includes(q) ||
            c.category.toLowerCase().includes(q) ||
            c.id.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [query, groups]);

  // Flat list of all visible items for index tracking
  const flatItems = useMemo(() => filtered.flatMap((g) => g.items), [filtered]);

  // Reset selection when query or visible changes
  useEffect(() => {
    setActiveIndex(0);
  }, [query, visible]);

  // Focus input when palette opens
  useEffect(() => {
    if (!visible) return;
    const raf = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => cancelAnimationFrame(raf);
  }, [visible]);

  // Scroll active item into view
  useEffect(() => {
    if (!activeRef.current || !listRef.current) return;
    const list = listRef.current;
    const el = activeRef.current;
    const listRect = list.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();

    if (elRect.top < listRect.top) {
      list.scrollTop -= listRect.top - elRect.top + 8;
    } else if (elRect.bottom > listRect.bottom) {
      list.scrollTop += elRect.bottom - listRect.bottom + 8;
    }
  }, [activeIndex]);

  const execute = useCallback(
    (cmd: CommandEntry) => {
      cmd.action();
      onClose();
    },
    [onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((i) => (i < flatItems.length - 1 ? i + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((i) => (i > 0 ? i - 1 : flatItems.length - 1));
          break;
        case "Enter":
          e.preventDefault();
          if (flatItems[activeIndex]) execute(flatItems[activeIndex]);
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
        case "Home":
          e.preventDefault();
          setActiveIndex(0);
          break;
        case "End":
          e.preventDefault();
          setActiveIndex(flatItems.length - 1);
          break;
      }
    },
    [flatItems, activeIndex, execute, onClose]
  );

  if (!visible) return null;

  let runningIndex = -1;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "15vh",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(12px)",
        }}
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        style={{
          position: "relative",
          width: "90%",
          maxWidth: 540,
          background: "#1a1a2e",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
        }}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {/* Search icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            aria-autocomplete="list"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#f3f4f6",
              fontSize: 15,
              fontFamily: "inherit",
            }}
            spellCheck={false}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "none",
                borderRadius: 6,
                padding: "2px 6px",
                cursor: "pointer",
                color: "#9ca3af",
                fontSize: 11,
                fontFamily: "inherit",
              }}
            >
              ESC
            </button>
          )}
        </div>

        {/* Results list */}
        <div
          ref={listRef}
          role="listbox"
          style={{
            maxHeight: 360,
            overflowY: "auto",
            overscrollBehavior: "contain",
            padding: "6px",
          }}
        >
          {flatItems.length === 0 && (
            <div
              style={{
                padding: "32px 16px",
                color: "#6b7280",
                fontSize: 13,
                textAlign: "center",
              }}
            >
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {filtered.map((group) => (
            <div key={group.label}>
              {/* Category header */}
              <div
                style={{
                  padding: "8px 10px 4px",
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 1.2,
                  color: "#6b7280",
                  userSelect: "none",
                }}
              >
                {group.label}
              </div>

              {/* Items */}
              {group.items.map((cmd) => {
                runningIndex++;
                const idx = runningIndex;
                const isActive = idx === activeIndex;
                const capturedIdx = idx;

                return (
                  <div
                    key={cmd.id}
                    ref={isActive ? activeRef : undefined}
                    role="option"
                    aria-selected={isActive}
                    data-selected={isActive ? "true" : undefined}
                    onClick={() => execute(cmd)}
                    onMouseEnter={() => setActiveIndex(capturedIdx)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      borderRadius: 8,
                      cursor: "pointer",
                      background: isActive ? "rgba(167, 139, 250, 0.12)" : "transparent",
                      borderLeft: isActive ? "2px solid #a78bfa" : "2px solid transparent",
                      transition: "background 0.06s",
                    }}
                  >
                    <span
                      style={{
                        color: isActive ? "#f3f4f6" : "#d1d5db",
                        fontSize: 13,
                        fontWeight: isActive ? 500 : 400,
                      }}
                    >
                      {cmd.label}
                    </span>
                    {cmd.shortcut && (
                      <span
                        style={{
                          display: "flex",
                          gap: 4,
                        }}
                      >
                        {cmd.shortcut.split("+").map((key, i) => (
                          <kbd
                            key={i}
                            style={{
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              borderRadius: 4,
                              padding: "1px 6px",
                              fontSize: 11,
                              color: "#9ca3af",
                              fontFamily: "inherit",
                              lineHeight: "18px",
                            }}
                          >
                            {key}
                          </kbd>
                        ))}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "10px 18px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            fontSize: 11,
            color: "#6b7280",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <kbd style={kbdStyle}>↑</kbd>
            <kbd style={kbdStyle}>↓</kbd>
            <span>navigate</span>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <kbd style={kbdStyle}>↵</kbd>
            <span>select</span>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <kbd style={kbdStyle}>esc</kbd>
            <span>close</span>
          </span>
        </div>
      </div>
    </div>
  );
}

const kbdStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 18,
  height: 18,
  padding: "0 4px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 4,
  fontSize: 10,
  color: "#9ca3af",
  fontFamily: "inherit",
};
