"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

export interface TerminalLine {
  type: "input" | "output" | "error" | "system" | "ascii" | "success" | "warn";
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

const NEOFETCH_ART = [
  "        .--.        ",
  "       |o_o |       ",
  "       |:_/ |       ",
  "      //   \\ \\      ",
  "     (|     | )     ",
  "    /'\\_   _/`\\     ",
  "    \\___)=(___/     ",
];

const NEOFETCH_INFO = (sceneState: DraftingTerminalProps["sceneState"]) => [
  `\x1b[1m\x1b[35msachin@drift\x1b[0m`,
  `──────────────────`,
  `\x1b[1mOS:\x1b[0m DRIFT AOSP 1.0 (Paper World)`,
  `\x1b[1mHost:\x1b[0m ${typeof navigator !== "undefined" ? navigator.userAgent.split("(")[1]?.split(")")[0] || "Unknown" : "Unknown"}`,
  `\x1b[1mKernel:\x1b[0m Three.js ${"\x1b[32m"}R3F\x1b[0m`,
  `\x1b[1mShell:\x1b[0m drift-sh 1.0`,
  `\x1b[1mDE:\x1b[0m Paper Craft UI`,
  `\x1b[1mWM:\x1b[0m GSAP Compositor`,
  `\x1b[1mMood:\x1b[0m ${sceneState.mood}`,
  `\x1b[1mAct:\x1b[0m ${sceneState.currentAct + 1} / 8`,
  `\x1b[1mWind:\x1b[0m ${sceneState.windForce.toFixed(1)}`,
  `\x1b[1mCamera:\x1b[0m [${sceneState.cameraPos.map(v => v.toFixed(1)).join(", ")}]`,
  `\x1b[1mUptime:\x1b[0m ${Math.floor((Date.now() - (typeof window !== "undefined" ? performance.timing?.navigationStart || Date.now() : Date.now())) / 1000)}s`,
  "",
  `\x1b[40m   \x1b[41m   \x1b[42m   \x1b[43m   \x1b[44m   \x1b[45m   \x1b[46m   \x1b[47m   \x1b[0m`,
];

const COW_TEMPLATE = (text: string) => {
  const maxLen = Math.min(text.length, 40);
  const lines: string[] = [];
  for (let i = 0; i < text.length; i += maxLen) {
    lines.push(text.slice(i, i + maxLen));
  }
  const border = " " + "_".repeat(maxLen + 2);
  const top = " " + " ".repeat(maxLen + 2);
  const body = lines.map((l, i) => {
    const padded = l.padEnd(maxLen);
    if (lines.length === 1) return `< ${padded} >`;
    if (i === 0) return `/ ${padded} \\`;
    if (i === lines.length - 1) return `\\ ${padded} /`;
    return `| ${padded} |`;
  });
  const bottom = " " + "-".repeat(maxLen + 2);
  const cow = [
    border,
    ...body,
    bottom,
    "        \\   ^__^",
    "         \\  (oo)\\_______",
    "            (__)\\       )\\/\\",
    "                ||----w |",
    "                ||     ||",
  ];
  return cow;
};

const FORTUNES = [
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "Code is like humor. When you have to explain it, it's bad.",
  "First, solve the problem. Then, write the code.",
  "The only way to do great work is to love what you do. — Steve Jobs",
  "Simplicity is the soul of efficiency.",
  "Talk is cheap. Show me the code. — Linus Torvalds",
  "Any fool can write code that a computer can understand.",
  "Programs must be written for people to read.",
  "The best error message is the one that never shows up.",
  "A ship in port is safe, but that's not what ships are built for.",
  "The paper remembers what the wind forgets.",
  "Every fold is a new beginning.",
  "In the storm, the crane finds its wings.",
  "The smallest flap can change the world.",
];

const ASCII_ARROWS = [
  "    /\\    ",
  "   /  \\   ",
  "  /    \\  ",
  " /  /\\  \\ ",
  "/  /  \\  \\",
  "  /    \\  ",
  " /      \\ ",
  "/________\\",
];

const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m",
};

export default function DraftingTerminal({ visible, onClose, sceneState, onCommand }: DraftingTerminalProps) {
  const [history, setHistory] = useState<TerminalLine[]>([]);
  const [input, setInput] = useState("");
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [tabPressed, setTabPressed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const AVAILABLE_COMMANDS = useMemo(() => [
    "help", "clear", "get_state", "set_wind_force", "set_mood", "set_camera",
    "jump_to", "spawn_entity", "list_acts", "get_folds", "reset_folds",
    "neofetch", "cowsay", "fortune", "whoami", "date", "echo", "history",
    "uptime", "uname", "matrix", "colors", "palette", "ascii", "tree",
    "about", "secret", "sudo", "man", "ls", "pwd", "cat", "grep",
    "drift", "milo", "wind", "paper", "craft", "fly",
  ], []);

  // Focus input when opened
  useEffect(() => {
    if (visible) {
      setTimeout(() => inputRef.current?.focus(), 50);
      if (history.length === 0) {
        const bootLines: TerminalLine[] = [
          { type: "system", text: "" },
          { type: "ascii", text: "  ██████╗ ███████╗████████╗██████╗ ██╗███████╗" },
          { type: "ascii", text: "  ██╔══██╗██╔════╝╚══██╔══╝██╔══██╗██║██╔════╝" },
          { type: "ascii", text: "  ██████╔╝█████╗     ██║   ██████╔╝██║███████╗" },
          { type: "ascii", text: "  ██╔══██╗██╔══╝     ██║   ██╔══██╗██║╚════██║" },
          { type: "ascii", text: "  ██████╔╝███████╗   ██║   ██║  ██║██║███████║" },
          { type: "ascii", text: "  ╚═════╝ ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝╚══════╝" },
          { type: "system", text: "" },
          { type: "output", text: "  A Paper World — Interactive 3D Storytelling" },
          { type: "system", text: "  ─────────────────────────────────────────────" },
          { type: "output", text: "  Type 'help' for available commands." },
          { type: "output", text: "  Try 'neofetch', 'cowsay', or 'fortune'." },
          { type: "output", text: "  Press Ctrl+~ or Esc to close." },
          { type: "system", text: "" },
        ];
        setHistory(bootLines);
      }
    }
  }, [visible]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  // Click outside to close
  useEffect(() => {
    if (!visible) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [visible, onClose]);

  const executeCommand = useCallback((raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);
    const argStr = args.join(" ");

    const newLines: TerminalLine[] = [{ type: "input", text: `${COLORS.green}>${COLORS.reset} ${trimmed}` }];

    // Built-in commands
    switch (cmd) {
      case "clear":
        setHistory([]);
        setCmdHistory(prev => [trimmed, ...prev.slice(0, 49)]);
        setHistoryIdx(-1);
        setInput("");
        return;

      case "help": {
        const helpLines: TerminalLine[] = [
          { type: "output", text: `${COLORS.bold}DRIFT Drafting Terminal v2.0${COLORS.reset}` },
          { type: "output", text: "─────────────────────────────────────────" },
          { type: "output", text: "" },
          { type: "output", text: `${COLORS.cyan}Story Commands:${COLORS.reset}` },
          { type: "output", text: "  get_state                Dump current scene state" },
          { type: "output", text: "  set_wind_force <0-10>    Adjust global wind intensity" },
          { type: "output", text: "  set_mood <mood>          Change mood (warm/storm/calm/secret/sorrow/hope/final)" },
          { type: "output", text: "  set_camera <x> <y> <z>   Teleport camera position" },
          { type: "output", text: "  jump_to <act> <beat>     Jump to a specific act and beat" },
          { type: "output", text: "  spawn_entity <name>      Spawn character (pip/sage/lira/milo)" },
          { type: "output", text: "  list_acts                List all acts in the story" },
          { type: "output", text: "  get_folds                Show persistent fold state" },
          { type: "output", text: "  reset_folds              Reset all saved progress" },
          { type: "output", text: "" },
          { type: "output", text: `${COLORS.magenta}Fun Commands:${COLORS.reset}` },
          { type: "output", text: "  neofetch                 System information display" },
          { type: "output", text: "  cowsay <text>            A cow says your text" },
          { type: "output", text: "  fortune                  Random fortune cookie" },
          { type: "output", text: "  whoami                   Who are you?" },
          { type: "output", text: "  date                     Current date and time" },
          { type: "output", text: "  echo <text>              Echo text back" },
          { type: "output", text: "  uptime                   System uptime" },
          { type: "output", text: "  uname                    System information" },
          { type: "output", text: "  history                  Show command history" },
          { type: "output", text: "  matrix                   Enter the matrix" },
          { type: "output", text: "  colors                   Show color palette" },
          { type: "output", text: "  palette                  Show DRIFT color palette" },
          { type: "output", text: "  ascii                    Show ASCII art arrow" },
          { type: "output", text: "  tree                     Show file tree" },
          { type: "output", text: "  about                    About DRIFT" },
          { type: "output", text: "  secret                   Try a secret command..." },
          { type: "output", text: "" },
          { type: "output", text: `${COLORS.yellow}Navigation:${COLORS.reset}` },
          { type: "output", text: "  ls                       List current act elements" },
          { type: "output", text: "  pwd                      Print working directory" },
          { type: "output", text: "  cat <file>               Read a file" },
          { type: "output", text: "  grep <pattern>           Search for pattern" },
          { type: "output", text: "" },
          { type: "output", text: `${COLORS.red}Special:${COLORS.reset}` },
          { type: "output", text: "  sudo <cmd>               Try to sudo..." },
          { type: "output", text: "  man <cmd>                Manual page for command" },
          { type: "output", text: "" },
          { type: "output", text: "  Keyboard: ↑/↓ history, Tab autocomplete, Esc close" },
        ];
        newLines.push(...helpLines);
        break;
      }

      case "neofetch": {
        const art = NEOFETCH_ART;
        const info = NEOFETCH_INFO(sceneState);
        const maxLines = Math.max(art.length, info.length);
        for (let i = 0; i < maxLines; i++) {
          const artLine = art[i] || " ".repeat(20);
          const infoLine = info[i] || "";
          newLines.push({ type: "output", text: `${COLORS.magenta}${artLine}${COLORS.reset}  ${infoLine}` });
        }
        break;
      }

      case "cowsay": {
        const text = argStr || "Moo! I'm a paper cow!";
        const cow = COW_TEMPLATE(text);
        cow.forEach(line => newLines.push({ type: "output", text: line }));
        break;
      }

      case "fortune": {
        const fortune = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
        newLines.push({ type: "output", text: "" });
        newLines.push({ type: "output", text: `  ${COLORS.yellow}"${fortune}"${COLORS.reset}` });
        newLines.push({ type: "output", text: "" });
        break;
      }

      case "whoami": {
        newLines.push({ type: "output", text: `${COLORS.cyan}sachin${COLORS.reset}@${COLORS.magenta}drift${COLORS.reset}` });
        newLines.push({ type: "output", text: "A paper craft explorer" });
        newLines.push({ type: "output", text: "Act: " + (sceneState.currentAct + 1) + " / 8" });
        break;
      }

      case "date": {
        const now = new Date();
        newLines.push({ type: "output", text: now.toString() });
        break;
      }

      case "echo": {
        newLines.push({ type: "output", text: argStr || "" });
        break;
      }

      case "uptime": {
        const seconds = Math.floor((Date.now() - performance.timing.navigationStart) / 1000);
        const mins = Math.floor(seconds / 60);
        const hrs = Math.floor(mins / 60);
        newLines.push({ type: "output", text: `up ${hrs}h ${mins % 60}m ${seconds % 60}s, 1 user` });
        break;
      }

      case "uname": {
        if (args.includes("-a")) {
          newLines.push({ type: "output", text: "DRIFT AOSP 1.0.0-paper Three.js R3F GSAP x86_64 JavaScript" });
        } else {
          newLines.push({ type: "output", text: "DRIFT AOSP" });
        }
        break;
      }

      case "history": {
        cmdHistory.slice().reverse().forEach((cmd, i) => {
          newLines.push({ type: "output", text: `  ${String(i + 1).padStart(4)}  ${cmd}` });
        });
        if (cmdHistory.length === 0) {
          newLines.push({ type: "output", text: "  No commands in history." });
        }
        break;
      }

      case "matrix": {
        newLines.push({ type: "output", text: "" });
        newLines.push({ type: "ascii", text: "  Wake up, Neo..." });
        newLines.push({ type: "ascii", text: "  The Matrix has you..." });
        newLines.push({ type: "ascii", text: "  Follow the white paper crane." });
        newLines.push({ type: "output", text: "" });
        const chars = "01アイウエオカキクケコ";
        for (let i = 0; i < 5; i++) {
          let line = "  ";
          for (let j = 0; j < 50; j++) {
            line += chars[Math.floor(Math.random() * chars.length)];
          }
          newLines.push({ type: "ascii", text: line });
        }
        break;
      }

      case "colors":
      case "palette": {
        newLines.push({ type: "output", text: "" });
        newLines.push({ type: "output", text: "  DRIFT Color Palette:" });
        newLines.push({ type: "output", text: "  ─────────────────────" });
        newLines.push({ type: "output", text: "  \x1b[47m  \x1b[0m #fdf6e3 — Paper (background)" });
        newLines.push({ type: "output", text: "  \x1b[40m  \x1b[0m #1a1a2e — Ink (edges)" });
        newLines.push({ type: "output", text: "  \x1b[41m  \x1b[0m #ef4444 — Storm" });
        newLines.push({ type: "output", text: "  \x1b[42m  \x1b[0m #22c55e — Forest" });
        newLines.push({ type: "output", text: "  \x1b[43m  \x1b[0m #fbbf24 — Secrets" });
        newLines.push({ type: "output", text: "  \x1b[44m  \x1b[0m #3b82f6 — Water" });
        newLines.push({ type: "output", text: "  \x1b[45m  \x1b[0m #a855f7 — Magic" });
        newLines.push({ type: "output", text: "  \x1b[46m  \x1b[0m #06b6d4 — Sky" });
        newLines.push({ type: "output", text: "" });
        break;
      }

      case "ascii": {
        newLines.push({ type: "output", text: "" });
        ASCII_ARROWS.forEach(line => newLines.push({ type: "ascii", text: `  ${line}` }));
        newLines.push({ type: "output", text: "" });
        break;
      }

      case "tree": {
        newLines.push({ type: "output", text: "." });
        newLines.push({ type: "output", text: "├── acts/" });
        newLines.push({ type: "output", text: "│   ├── 01-cliff-edge/" });
        newLines.push({ type: "output", text: "│   │   ├── crane.ts" });
        newLines.push({ type: "output", text: "│   │   └── parallax.ts" });
        newLines.push({ type: "output", text: "│   ├── 02-storm/" });
        newLines.push({ type: "output", text: "│   │   ├── lightning.ts" });
        newLines.push({ type: "output", text: "│   │   └── rain.ts" });
        newLines.push({ type: "output", text: "│   ├── 03-forest/" });
        newLines.push({ type: "output", text: "│   │   ├── trees.ts" });
        newLines.push({ type: "output", text: "│   │   └── critters.ts" });
        newLines.push({ type: "output", text: "│   ├── 04-unfolded/" });
        newLines.push({ type: "output", text: "│   │   └── origami.ts" });
        newLines.push({ type: "output", text: "│   ├── 05-secret/" });
        newLines.push({ type: "output", text: "│   │   └── fold.ts" });
        newLines.push({ type: "output", text: "│   ├── 06-return/" });
        newLines.push({ type: "output", text: "│   │   └── journey.ts" });
        newLines.push({ type: "output", text: "│   ├── 07-water/" });
        newLines.push({ type: "output", text: "│   │   ├── boat.ts" });
        newLines.push({ type: "output", text: "│   │   └── waves.ts" });
        newLines.push({ type: "output", text: "│   └── 08-finale/" });
        newLines.push({ type: "output", text: "│       └── celebration.ts" });
        newLines.push({ type: "output", text: "├── components/" });
        newLines.push({ type: "output", text: "│   ├── three/" });
        newLines.push({ type: "output", text: "│   │   ├── Scene.tsx" });
        newLines.push({ type: "output", text: "│   │   ├── PaperWorld.tsx" });
        newLines.push({ type: "output", text: "│   │   ├── StoryCamera.tsx" });
        newLines.push({ type: "output", text: "│   │   └── ProceduralShapes.tsx" });
        newLines.push({ type: "output", text: "│   └── ui/" });
        newLines.push({ type: "output", text: "│       ├── NarrativeOverlay.tsx" });
        newLines.push({ type: "output", text: "│       ├── EndScreen.tsx" });
        newLines.push({ type: "output", text: "│       └── DraftingTerminal.tsx" });
        newLines.push({ type: "output", text: "├── lib/" });
        newLines.push({ type: "output", text: "│   ├── narrative.ts" });
        newLines.push({ type: "output", text: "│   ├── audio.ts (110 sounds)" });
        newLines.push({ type: "output", text: "│   └── useJourneyTracker.ts" });
        newLines.push({ type: "output", text: "└── public/" });
        newLines.push({ type: "output", text: "    └── models/ (8 GLB files)" });
        break;
      }

      case "about": {
        newLines.push({ type: "output", text: "" });
        newLines.push({ type: "output", text: `  ${COLORS.bold}DRIFT — A Paper World${COLORS.reset}` });
        newLines.push({ type: "output", text: "  An interactive 3D paper craft storytelling" });
        newLines.push({ type: "output", text: "  experience about a crane named Milo." });
        newLines.push({ type: "output", text: "" });
        newLines.push({ type: "output", text: "  Tech: Next.js + React Three Fiber + GSAP" });
        newLines.push({ type: "output", text: "  Sounds: 110 procedural effects" });
        newLines.push({ type: "output", text: "  Story: 8 acts, 30+ beats" });
        newLines.push({ type: "output", text: "  Secrets: Hidden words & discoveries" });
        newLines.push({ type: "output", text: "" });
        newLines.push({ type: "output", text: "  Built for the 3D Websites Hackathon." });
        newLines.push({ type: "output", text: "" });
        break;
      }

      case "secret": {
        const secrets = [
          "You found a secret! The paper cranes remember.",
          "The wind whispers: 'fold me gently'.",
          "Milo says hi! He's practicing his flying.",
          "The fox is hiding behind the origami tree.",
          "Type 'wind' for a surprise... or 'fold'.",
          "The boat Pip is dreaming of the ocean.",
          "Every click leaves a mark on the paper.",
          "The storm passes, but the paper remembers.",
        ];
        const secret = secrets[Math.floor(Math.random() * secrets.length)];
        newLines.push({ type: "success", text: `  * ${secret}` });
        window.dispatchEvent(new CustomEvent("star-collect"));
        break;
      }

      case "sudo": {
        if (argStr === "make me a sandwich") {
          newLines.push({ type: "output", text: "  Okay." });
          newLines.push({ type: "output", text: "  [sandwich]" });
        } else if (argStr === "rm -rf /") {
          newLines.push({ type: "error", text: "  Nice try. The paper world is protected." });
          newLines.push({ type: "output", text: "  🛡️  Drift defense activated." });
        } else {
          newLines.push({ type: "error", text: "  sudo: nice try, but you're not root in the paper world." });
          newLines.push({ type: "output", text: "  (The cranes protect this realm.)" });
        }
        break;
      }

      case "man": {
        if (!argStr) {
          newLines.push({ type: "output", text: "What manual page do you want?" });
          newLines.push({ type: "output", text: "For example, try 'man neofetch' or 'man cowsay'." });
        } else {
          const manPages: Record<string, string[]> = {
            neofetch: [
              "NEOFETCH(1)                    DRIFT Manual                    NEOFETCH(1)",
              "",
              "NAME",
              "    neofetch - display system information with ASCII art",
              "",
              "SYNOPSIS",
              "    neofetch",
              "",
              "DESCRIPTION",
              "    Displays a colorful ASCII art crane alongside system",
              "    information including OS, shell, mood, act, wind force,",
              "    and camera position.",
              "",
              "AUTHORS",
              "    Written for the DRIFT paper world.",
            ],
            cowsay: [
              "COWSAY(1)                     DRIFT Manual                     COWSAY(1)",
              "",
              "NAME",
              "    cowsay - generate an ASCII picture of a cow saying text",
              "",
              "SYNOPSIS",
              "    cowsay [text]",
              "",
              "DESCRIPTION",
              "    Generates an ASCII art cow with a speech bubble containing",
              "    the specified text. If no text is provided, the cow moos.",
              "",
              "EXAMPLES",
              "    cowsay Hello World",
              "    cowsay The paper remembers",
            ],
            fortune: [
              "FORTUNE(1)                    DRIFT Manual                    FORTUNE(1)",
              "",
              "NAME",
              "    fortune - print a random fortune",
              "",
              "SYNOPSIS",
              "    fortune",
              "",
              "DESCRIPTION",
              "    Displays a random fortune from the paper world's collection",
              "    of wisdom and humor.",
            ],
          };
          const page = manPages[argStr];
          if (page) {
            page.forEach(line => newLines.push({ type: "output", text: `  ${line}` }));
          } else {
            newLines.push({ type: "error", text: `  No manual entry for ${argStr}.` });
            newLines.push({ type: "output", text: "  Try 'help' for available commands." });
          }
        }
        break;
      }

      case "ls": {
        const actNames = [
          "cliff-edge/", "storm/", "forest/", "unfolded-lands/",
          "secret-fold/", "return/", "water-pip/", "finale/"
        ];
        actNames.forEach((name, i) => {
          const isCurrent = i === sceneState.currentAct;
          const prefix = isCurrent ? `${COLORS.green}*${COLORS.reset} ` : "  ";
          newLines.push({ type: "output", text: `${prefix}${name}` });
        });
        break;
      }

      case "pwd": {
        newLines.push({ type: "output", text: `/drift/act-${sceneState.currentAct + 1}` });
        break;
      }

      case "cat": {
        if (argStr === "README.md") {
          newLines.push({ type: "output", text: "# DRIFT — A Paper World" });
          newLines.push({ type: "output", text: "" });
          newLines.push({ type: "output", text: "An interactive 3D paper craft story." });
          newLines.push({ type: "output", text: "Help Milo the crane find the wind." });
        } else if (argStr === "package.json") {
          newLines.push({ type: "output", text: '{ "name": "drift", "version": "1.0.0" }' });
        } else {
          newLines.push({ type: "error", text: `cat: ${argStr}: No such file or directory` });
        }
        break;
      }

      case "grep": {
        if (!argStr) {
          newLines.push({ type: "error", text: "Usage: grep <pattern>" });
        } else {
          newLines.push({ type: "output", text: `  Searching for "${argStr}" in the paper world...` });
          newLines.push({ type: "output", text: `  Found in: narrative.ts, audio.ts, PaperWorld.tsx` });
        }
        break;
      }

      // Easter eggs
      case "drift":
      case "milo":
      case "wind":
      case "paper":
      case "craft":
      case "fly": {
        const responses: Record<string, string[]> = {
          drift: ["DRIFT — A Paper World", "The wind carries the paper forward.", "Every fold tells a story."],
          milo: ["Milo waves hello!", "The crane is practicing his takeoff.", "Milo says: 'I believe I can fly!'"],
          wind: ["The wind picks up...", "*rustle rustle*", "Paper dances in the breeze."],
          paper: ["The paper is warm to the touch.", "Origami magic happens here.", "Fold, unfold, refold."],
          craft: ["Paper craft: the art of folding stories.", "Every crease is a decision.", "The crane was born from a single fold."],
          fly: ["Spread your wings!", "The crane takes flight!", "Up, up, and away into the paper sky!"],
        };
        const msgs = responses[cmd] || ["..."];
        const msg = msgs[Math.floor(Math.random() * msgs.length)];
        newLines.push({ type: "success", text: `  🦢 ${msg}` });
        break;
      }

      default: {
        // Delegate to scene handler
        const result = onCommand(cmd, args);
        if (result.length === 0) {
          newLines.push({ type: "error", text: `drift-sh: command not found: ${cmd}` });
          newLines.push({ type: "output", text: `  Type 'help' for available commands.` });
        } else {
          result.forEach(l => newLines.push(l));
        }
        break;
      }
    }

    setHistory(prev => [...prev, ...newLines]);
    setCmdHistory(prev => [trimmed, ...prev.slice(0, 49)]);
    setHistoryIdx(-1);
    setInput("");
  }, [sceneState, onCommand, cmdHistory]);

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

    // Tab completion
    if (e.key === "Tab") {
      e.preventDefault();
      const matches = AVAILABLE_COMMANDS.filter(c => c.startsWith(input.toLowerCase()));
      if (matches.length === 1) {
        setInput(matches[0]);
      } else if (matches.length > 1) {
        const newLines: TerminalLine[] = [
          { type: "output", text: matches.join("  ") },
        ];
        setHistory(prev => [...prev, ...newLines]);
      }
      return;
    }

    // Ctrl+L to clear
    if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setHistory([]);
      return;
    }

    // Ctrl+C to cancel
    if (e.key === "c" && e.ctrlKey) {
      e.preventDefault();
      setHistory(prev => [...prev, { type: "input", text: `${COLORS.green}>${COLORS.reset} ${input}^C` }]);
      setInput("");
      return;
    }
  }, [input, cmdHistory, historyIdx, executeCommand, onClose, AVAILABLE_COMMANDS]);

  // Render ANSI-like color codes
  const renderText = useCallback((text: string) => {
    if (!text.includes("\x1b[")) return text;

    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      const match = remaining.match(/\x1b\[(\d+(?:;\d+)*)m/);
      if (!match) {
        parts.push(<span key={key++}>{remaining}</span>);
        break;
      }

      const before = remaining.slice(0, match.index);
      if (before) parts.push(<span key={key++}>{before}</span>);

      const codes = match[1].split(";").map(Number);
      const style: React.CSSProperties = {};
      codes.forEach(code => {
        if (code === 1) style.fontWeight = "bold";
        if (code === 2) style.opacity = 0.5;
        if (code === 31) style.color = "#f87171";
        if (code === 32) style.color = "#4ade80";
        if (code === 33) style.color = "#fbbf24";
        if (code === 34) style.color = "#60a5fa";
        if (code === 35) style.color = "#c084fc";
        if (code === 36) style.color = "#22d3ee";
        if (code === 37) style.color = "#e5e7eb";
        if (code === 40) style.backgroundColor = "#1a1a2e";
        if (code === 41) style.backgroundColor = "#ef4444";
        if (code === 42) style.backgroundColor = "#22c55e";
        if (code === 43) style.backgroundColor = "#fbbf24";
        if (code === 44) style.backgroundColor = "#3b82f6";
        if (code === 45) style.backgroundColor = "#a855f7";
        if (code === 46) style.backgroundColor = "#06b6d4";
        if (code === 47) style.backgroundColor = "#e5e7eb";
        if (code === 0) { /* reset */ }
      });

      const fullMatch = match[0];
      const afterEscape = remaining.slice((match.index || 0) + fullMatch.length);
      const textContent = afterEscape.split("\x1b[")[0] || "";
      parts.push(<span key={key++} style={style}>{textContent}</span>);
      remaining = remaining.slice((match.index || 0) + fullMatch.length);
    }

    return parts.length > 0 ? parts : text;
  }, []);

  if (!visible) return null;

  const getLineColor = (type: TerminalLine["type"]) => {
    switch (type) {
      case "input": return "#60a5fa";
      case "error": return "#f87171";
      case "system": return "#a78bfa";
      case "ascii": return "#c084fc";
      case "success": return "#4ade80";
      case "warn": return "#fbbf24";
      default: return "#d4d4d4";
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: "92%",
          maxWidth: 780,
          maxHeight: "82vh",
          background: "#0d1117",
          border: "1px solid #30363d",
          borderRadius: 12,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'SF Mono', 'Consolas', monospace",
        }}
      >
        {/* Title bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 16px",
            background: "#161b22",
            borderBottom: "1px solid #30363d",
            cursor: "default",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57", cursor: "pointer" }}
              onClick={onClose} title="Close" />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e", cursor: "pointer" }}
              onClick={() => setHistory([])} title="Clear" />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
          </div>
          <span style={{ color: "#8b949e", fontSize: 12, fontWeight: 500 }}>
            drift — drafting terminal
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", color: "#8b949e",
              cursor: "pointer", fontSize: 18, fontFamily: "inherit",
              padding: "0 4px", lineHeight: 1, borderRadius: 4,
              transition: "color 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
            onMouseLeave={e => e.currentTarget.style.color = "#8b949e"}
            title="Close (Esc)"
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
            padding: "14px 18px",
            minHeight: 340,
            maxHeight: "calc(82vh - 80px)",
          }}
        >
          {history.map((line, i) => (
            <div
              key={i}
              style={{
                color: getLineColor(line.type),
                fontSize: 13,
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                fontFamily: "inherit",
              }}
            >
              {renderText(line.text)}
            </div>
          ))}

          {/* Input line */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            <span style={{ color: "#4ade80", fontSize: 13, fontWeight: 700 }}>{">"}</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#e6edf3",
                fontSize: 13,
                fontFamily: "inherit",
                caretColor: "#4ade80",
                letterSpacing: 0.3,
              }}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
            />
          </div>
        </div>

        {/* Status bar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "5px 16px",
          background: "#161b22",
          borderTop: "1px solid #30363d",
          fontSize: 11,
          color: "#8b949e",
        }}>
          <span>drift-sh v2.0</span>
          <span>
            {cmdHistory.length > 0 && `${cmdHistory.length} cmds | `}
            ↑↓ history · Tab complete · Ctrl+L clear · Esc close
          </span>
        </div>
      </div>
    </div>
  );
}
