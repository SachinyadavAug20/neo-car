# Meow Code TUI — NEON_DRIVE

A relaxing, Zen-minimalist **infinite flying-car runner** built with Next.js, React Three Fiber, and Rapier physics. The UI is a windowed, compositor-style terminal (Catppuccin Macchiato palette) overlaying a calm, audio-reactive, bioluminescent 3D world.

## Overview

Fly a low-poly 80s sports car through an endless ocean of data — a GPU-shader terrain that scrolls infinitely, a looping ring track that recycles ahead of you, and music-reactive lighting — all wrapped in a Hyprland/Neovim-inspired floating-window TUI.

## Tech Stack

| Layer | Tech |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) |
| 3D | React Three Fiber v9, three.js r185 |
| Physics | @react-three/rapier v2 |
| Post-processing | @react-three/postprocessing (soft Bloom only) |
| State | Zustand v5 (vanilla stores + React selectors) |
| Animation | GSAP |
| Styling | Tailwind CSS v4 |
| Audio | Web Audio API (`useAudioAnalyzer`) |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

```bash
npm run dev      # start the dev server
npm run build    # production build
npm run start    # serve the production build
npm run lint     # ESLint (react-hooks/purity enforced)
```

## Controls

| Key | Action |
| --- | --- |
| `W` / `ArrowUp` | Accelerate |
| `S` / `ArrowDown` | Brake / reverse |
| `A` / `ArrowLeft` | Turn left |
| `D` / `ArrowRight` | Turn right |
| `Space` | Ascend |
| `Shift` | Descend |
| Mouse | Camera drift |
| `> ./execute_warp.sh` (HUD) | Warp to The Vault (`/explore`) |

## Gameplay

- **Infinite track** — 30 rings are recycled via Rapier `kinematicPosition` (`setNextKinematicTranslation`) as they pass behind the camera, keeping the course endless with a fixed object budget.
- **GPU terrain** — a `shaderMaterial` runs 3-octave fBM noise on the GPU; the mesh is a camera-following window over an infinitely scrolling noise field. No CPU vertex updates.
- **Score** — driving through a ring (`+1`) logs to the STDOUT pane and spawns a gentle voxel particle burst.
- **Rogue daemons** — wireframe octahedra drain memory (`-20`) and score (`-5`) on collision. Reach `0%` MEM and the OS crashes.
- **Kernel Panic** — a full-screen crash overlay; `> ./reboot.sh` restarts the session (fresh score, memory, and remounted world via `sessionId` key).
- **Audio reactivity** — the terrain amplitude, glow, and Bloom breathe with the bass. Toggle the radio via the `PLAY` button (requires user gesture).

## Project Structure

```
app/
├── page.tsx                     # Main game route (Canvas + HUD)
├── layout.tsx                   # Root layout (Geist Mono font)
├── globals.css                  # Tailwind v4 entry
├── explore/page.tsx             # "The Vault" experience (/explore)
├── store/
│   └── gameStore.ts             # Zustand: score, memory, panic, log, sessionId
├── hooks/
│   └── useAudioAnalyzer.ts      # Web Audio analyzer (frequencies + spectrum)
├── lib/
│   ├── cameraStore.ts           # Camera handoff registry
│   ├── fadeStore.ts             # Fade-out pub/sub
│   └── glitchStore.ts           # Glitch trigger pub/sub
└── components/
    ├── Scene.tsx                # Lighting, fog, Physics world, EffectComposer
    ├── DrivableCar.tsx          # Hover car: Rapier body, trails, 3D score, chase cam
    ├── ProceduralTerrain.tsx    # Infinite GPU-shader terrain (fBM)
    ├── RingTrack.tsx            # Looping rings + instanced voxel particles
    ├── RogueDaemons.tsx         # Memory-draining enemies
    ├── Portal.tsx               # Warp gate (drivethrough → /explore)
    ├── PortalFade.tsx           # Fade-out transition overlay
    ├── HUD.tsx                  # Compositor-style terminal UI (TUI)
    ├── KernelPanic.tsx          # Crash overlay + reboot
    ├── RetroSun.tsx             # Glowing horizon sun
    └── Car.tsx                  # GLTF sports-car model
```

## Performance Constraints

This project enforces a **strict 60fps** rule:

- **No object instantiation inside `useFrame`** — reuse preallocated vectors (e.g. `useMemo`d temps) and avoid per-frame allocations.
- **No `Math.random()` in `useFrame`** (enforced by `react-hooks/purity`) — deterministic hash functions (e.g. `pseudoRandom`) are used instead.
- **GPU-first terrain** — fBM noise runs in the vertex shader, not on the CPU.
- **Object pooling** — 300 voxel particles and 30 rings are recycled rather than created/destroyed.
- **Frame-rate independent damping** — camera follow and throttle smoothing use `1 - exp(-k * delta)`.

## Notes

- The car model (GLTF, CC-BY-4.0, [ville.eriksen](https://sketchfab.com/ville.eriksen)) faces `+Z`; the chase camera trails at `-Z`.
- The GLTF uses `KHR_materials_pbrSpecularGlossiness`, which logs a benign loader warning.
- `THREE.Clock` deprecation and the GLTF extension warnings in the console are harmless.