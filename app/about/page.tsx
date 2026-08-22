"use client";

import TilingWindow from "../components/TilingWindow";

const TERMINAL_FONT =
  "var(--font-geist-mono), 'Fira Code', 'JetBrains Mono', monospace";

const SKILLS = [
  { category: "Languages", items: ["TypeScript", "Python", "C++", "Rust", "Go"] },
  { category: "Frontend", items: ["React", "Next.js", "Three.js", "R3F", "Tailwind"] },
  { category: "Backend", items: ["Node.js", "PostgreSQL", "Redis", "Docker", "AWS"] },
  { category: "3D / WebGL", items: ["GLSL Shaders", "Rapier Physics", "GSAP", "Blender"] },
  { category: "Tools", items: ["Neovim", "Git", "Linux", "tmux", "Arch btw"] },
];

const STATS = [
  { label: "LeetCode", value: "1,847 problems solved", badge: "Guardian" },
  { label: "Codeforces", value: "Specialist (1489)", badge: "" },
  { label: "GitHub", value: "2.1k contributions (2024)", badge: "" },
  { label: "Projects", value: "14 shipped to prod", badge: "" },
];

export default function AboutPage() {
  return (
    <div className="pointer-events-auto flex w-full max-w-5xl flex-col gap-6 lg:flex-row">
      <TilingWindow title="nvim whoami.md" className="flex-1">
        <div
          className="space-y-4 text-[11px] leading-relaxed text-[#a5adcb]"
          style={{ fontFamily: TERMINAL_FONT }}
        >
          <div>
            <h2 className="mb-1 text-xs font-bold tracking-[0.2em] text-[#b4befe]">
              # whoami
            </h2>
            <p className="text-[#6c7086]">
              Full-stack engineer obsessed with performant, creative web
              experiences. I build things that blur the line between software and
              art.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-xs font-bold tracking-[0.2em] text-[#b4befe]">
              # skills
            </h2>
            <div className="space-y-2">
              {SKILLS.map((group) => (
                <div key={group.category}>
                  <span className="mr-2 text-[#cba6f7]">{group.category}:</span>
                  <span className="text-[#a6e3a1]">
                    {group.items.join(" | ")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-xs font-bold tracking-[0.2em] text-[#b4befe]">
              # competitive_programming
            </h2>
            <div className="space-y-1">
              {STATS.map((stat) => (
                <div key={stat.label} className="flex items-center gap-2">
                  <span className="w-24 text-[#cba6f7]">{stat.label}</span>
                  <span className="text-[#a5adcb]">{stat.value}</span>
                  {stat.badge && (
                    <span className="rounded border border-[#f9e2af]/40 bg-[#f9e2af]/10 px-1 text-[9px] text-[#f9e2af]">
                      {stat.badge}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </TilingWindow>

      <TilingWindow title="system_info.log" className="w-full lg:w-72">
        <div
          className="space-y-3 text-[10px] tracking-[0.15em]"
          style={{ fontFamily: TERMINAL_FONT }}
        >
          <div>
            <p className="mb-1 text-[9px] font-bold tracking-[0.25em] text-[#6c7086]">
              EDITOR
            </p>
            <p className="text-[#a5adcb]">Neovim + LSP + Treesitter</p>
          </div>
          <div>
            <p className="mb-1 text-[9px] font-bold tracking-[0.25em] text-[#6c7086]">
              DOTFILES
            </p>
            <p className="text-[#a5adcb]">Hyprland + Waybar + Kitty</p>
          </div>
          <div>
            <p className="mb-1 text-[9px] font-bold tracking-[0.25em] text-[#6c7086]">
              SHELL
            </p>
            <p className="text-[#a5adcb]">zsh + starship</p>
          </div>
          <div>
            <p className="mb-1 text-[9px] font-bold tracking-[0.25em] text-[#6c7086]">
              MUSIC
            </p>
            <p className="text-[#a5adcb]">MPD + ncmpcpp</p>
          </div>
          <div className="border-t border-[#8aadf4]/20 pt-3">
            <p className="text-[#6c7086]">
              <span className="text-[#a6e3a1]">$</span> neofetch --ascii
              neon_drive
            </p>
          </div>
        </div>
      </TilingWindow>
    </div>
  );
}
