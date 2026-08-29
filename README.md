# DRIFT — A Paper World

> **"You are not your folds. You are the paper. You are everything."**

An interactive 3D paper craft storytelling experience built for the **Devpost 3D Websites Hackathon**. Follow the cinematic journey of Milo, an origami crane with mismatched wings who learns to fly, across an origami diorama that responds to your touch, clicks, and keystrokes.

---

## Highlights & Features

- **8 Cinematic Acts**: A story with character dialogue, dynamic camera paths, and environment transitions (warm dawn, stormy cliffs, bioluminescent forest, unfolded flatlands, calm paper sea, and aerial finale).
- **110 Procedural Sounds (Web Audio API)**: Zero audio asset files loaded over the network — every sound effect, chime, splash, wind gust, and ambient chord is synthesized in real-time via Web Audio oscillators, noise buffers, and resonant filters.
- **Handcrafted Paper Craft Aesthetic**: Low-poly 3D models with crisp dark ink outlines (`EdgesGeometry`), custom toon materials (`MeshToonMaterial`), and soft warm paper lighting.
- **Custom Shaders & Math Models**:
  - **FBM Water Shader**: Multi-octave Fractional Brownian Motion fluid simulation with dynamic depth coloration and peak foam.
  - **L-System Botany**: Formal string-rewrite procedural trees and bonsai foliage.
  - **Cellular Automata**: Interactive Conway's Game of Life 3D tile matrix in the Unfolded Lands.
  - **Mathematical Wonders**: Menger Sponge fractals, Möbius strips, Klein bottles, Golden Spiral towers, Voronoi terrain, Lissajous curves, and DNA double helices.
- **Built-in Developer Tools & Easter Eggs**:
  - **Drafting Terminal (`Ctrl + ~`)**: Full in-engine shell with `neofetch` ASCII art, `cowsay`, `fortune`, story teleportation (`jump_to`), camera controls, and wind manipulation.
  - **Command Palette (`Ctrl + K`)**: Instant search and chapter navigation.
  - **Secret Keyword Detection**: Type keywords directly on your keyboard (`wind`, `paper`, `fold`, `milo`, `drift`, `sage`, `lira`, `fly`, `matrix`, `rainbow`).
  - **Photo Mode & Journey Summary**: Journey analytics tracking clicks, distance, and time with `html2canvas` screenshot export and share badges.
- **Theme Support**: Seamless Light Mode (warm paper) and Dark Mode (nocturnal ink) with persistent user preference.

---

## Story Acts

1. **Act 1: The Crane Who Couldn't Fly** — The cliff edge where Milo struggles with his uneven wings.
2. **Act 2: The Storm** — A turbulent gale that sweeps Milo into the sky (`drag-wind` interaction).
3. **Act 3: The Fox Who Was Hiding** — A tranquil forest of L-system cone trees where Milo meets Lira (`collect-leaves`).
4. **Act 4: The Unfolded Lands** — The flat white paper domain of Sage the ancient owl (`toggle-cells`).
5. **Act 5: The Secret Fold** — Uncovering the hidden truth of the paper (`click-unfold`).
6. **Act 6: The Return** — Taking flight across the horizon.
7. **Act 7: The Boat Named Pip** — Finding Pip transformed upon the paper sea (`row-boat` & `follow-butterfly`).
8. **Act 8: The Moral Fold** — The grand aerial celebration releasing flocks of origami cranes.

---

## Controls

| Key / Input | Action |
| --- | --- |
| `W` `A` `S` `D` / Arrow Keys | Move camera through the diorama |
| `H` `J` `K` `L` | Vim-style camera navigation |
| `Shift` | Sprint / faster camera speed |
| `Left Click` | Interact with story beats, wildlife, and secrets |
| `Space` / `Enter` | Advance story beat / start story |
| `Ctrl + ~` | Open Drafting Terminal |
| `Ctrl + K` | Open Command Palette |
| `Esc` | Close modals / palettes / terminal |

---

## Tech Stack

- **Framework**: [Next.js 16 (Turbopack, App Router)](https://nextjs.org/)
- **UI & State**: [React 19](https://react.dev/), TypeScript, Tailwind CSS
- **3D Graphics**: [Three.js](https://threejs.org/), [React Three Fiber](https://r3f.docs.pmnd.rs/), [@react-three/drei](https://github.com/pmndrs/drei)
- **Animation**: [GSAP 3](https://gsap.com/) (GreenSock Animation Platform)
- **Audio Engine**: Custom procedural Web Audio API synthesizer (zero external sound files)
- **Screenshot & Sharing**: [html2canvas](https://html2canvas.hertzen.com/)

---

## Getting Started

### Prerequisites
- Node.js 18+ (or Node 20+ recommended)
- npm, pnpm, or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/SachinyadavAug20/neo-car.git
cd 3d_web_design

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to experience DRIFT.

### Production Build

```bash
npm run build
npm run start
```

---

## License

MIT License — Built by **Sachin Yadav** for the Devpost 3D Websites Hackathon.
