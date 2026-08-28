"use client";

// ─── Narrative State Machine ──────────────────────────────────────────

export type Mood = "warm" | "storm" | "calm" | "secret" | "sorrow" | "hope" | "final";

export interface Beat {
  id: string;
  text: string;
  character?: string;
  mood: Mood;
  camera: {
    position: [number, number, number];
    lookAt: [number, number, number];
  };
  interaction?: "none" | "click-jump" | "drag-wind" | "click-unfold" | "click-reveal" | "collect-leaves" | "toggle-cells" | "row-boat" | "celebrate" | "follow-butterfly";
  interactionTarget?: number;
  envChange?: {
    fogNear?: number;
    fogFar?: number;
    bgColor?: string;
  };
}

export interface Act {
  id: number;
  title: string;
  subtitle: string;
  beats: Beat[];
}

// ─── World Layout ─────────────────────────────────────────────────────
// Act 1: [0, 0, 0]       — Cliff edge (center)
// Act 2: [40, 0, 0]      — Storm area (right)
// Act 3: [-40, 0, 0]     — Forest (left)
// Act 4/5: [0, 0, -40]   — Unfolded Lands (back)
// Act 6/7: [0, 0, 40]    — Water / Pip (front)
// Act 8: [0, 15, 0]      — Above everything (aerial)

export const STORY_ACTS: Act[] = [
  // ─── Act 1: The Crane Who Couldn't Fly ───
  {
    id: 1,
    title: "The Crane Who Couldn't Fly",
    subtitle: "Milo was a paper crane. One wing was bigger than the other.",
    beats: [
      {
        id: "1-intro",
        text: "There was a paper crane named Milo who could not fly.",
        character: "narrator",
        mood: "warm",
        camera: { position: [14, 7, 14], lookAt: [0, 0.5, 0] },
      },
      {
        id: "1-wing",
        text: "One wing was bigger than the other. When he tried to fly, he always tilted to the left.",
        character: "narrator",
        mood: "warm",
        camera: { position: [10, 4, 10], lookAt: [0, 0.5, 0] },
      },
      {
        id: "1-jump",
        text: "Click to help Milo jump!",
        character: "prompt",
        mood: "warm",
        interaction: "click-jump",
        interactionTarget: 5,
        camera: { position: [8, 3, 8], lookAt: [0, 0.5, 0] },
      },
      {
        id: "1-fail",
        text: "Every jump ended the same way — a tumble, a fold, a crumple.",
        character: "narrator",
        mood: "warm",
        camera: { position: [10, 5, -8], lookAt: [0, 0.3, 0] },
      },
      {
        id: "1-decide",
        text: "\"I will find the wind,\" Milo said. \"The wind will know how to carry me.\"",
        character: "milo",
        mood: "warm",
        camera: { position: [8, 3, -8], lookAt: [0, 0.5, 0] },
      },
    ],
  },

  // ─── Act 2: The Storm ───
  {
    id: 2,
    title: "The Storm",
    subtitle: "The wind came. Not gentle. Not kind.",
    beats: [
      {
        id: "2-arrive",
        text: "Milo found the edge of the world where the wind lived.",
        character: "narrator",
        mood: "storm",
        camera: { position: [54, 7, 12], lookAt: [40, 0.5, 0] },
      },
      {
        id: "2-storm",
        text: "Drag across the canvas to create the wind!",
        character: "prompt",
        mood: "storm",
        interaction: "drag-wind",
        interactionTarget: 30,
        camera: { position: [50, 5, 10], lookAt: [40, 0.5, 0] },
      },
      {
        id: "2-lifted",
        text: "The wind grabbed Milo. Tumbled him. Folded him. Unfolded him.",
        character: "narrator",
        mood: "storm",
        camera: { position: [46, 7, -8], lookAt: [40, 2, 0] },
      },
      {
        id: "2-carried",
        text: "And then — it carried him. High above the paper world.",
        character: "narrator",
        mood: "storm",
        camera: { position: [40, 16, 8], lookAt: [40, 0, 0] },
      },
    ],
  },

  // ─── Act 3: The Fox Who Was Hiding ───
  {
    id: 3,
    title: "The Fox Who Was Hiding",
    subtitle: "In the forest of cone trees, something rustled.",
    beats: [
      {
        id: "3-forest",
        text: "The wind dropped Milo in a forest of paper trees.",
        character: "narrator",
        mood: "calm",
        camera: { position: [-28, 7, 12], lookAt: [-40, 0.5, 0] },
      },
      {
        id: "3-rustle",
        text: "Something moved between the cone-shaped trees.",
        character: "narrator",
        mood: "calm",
        camera: { position: [-32, 5, 10], lookAt: [-40, 0.5, 0] },
      },
      {
        id: "3-lira",
        text: "\"Who's there?\" whispered a fox made of folded orange paper.",
        character: "lira",
        mood: "calm",
        camera: { position: [-34, 4, 8], lookAt: [-40, 0.5, 0] },
      },
      {
        id: "3-name",
        text: "\"I'm Milo. I'm looking for the wind.\"",
        character: "milo",
        mood: "calm",
        camera: { position: [-36, 3.5, 8], lookAt: [-40, 0.5, 0] },
      },
      {
        id: "3-pip",
        text: "\"My brother Pip went looking for the wind too. He never came back.\"",
        character: "lira",
        mood: "sorrow",
        camera: { position: [-48, 3, -6], lookAt: [-40, 0.5, 0] },
      },
      {
        id: "3-together",
        text: "\"I'll help you find him,\" said Milo. \"And the wind.\"",
        character: "milo",
        mood: "calm",
        camera: { position: [-30, 6, 12], lookAt: [-40, 0.5, 0] },
      },
      {
        id: "3-collect",
        text: "Glowing paper leaves drifted down. Collect them to light the path!",
        character: "prompt",
        mood: "calm",
        interaction: "collect-leaves",
        interactionTarget: 8,
        camera: { position: [-38, 4, 6], lookAt: [-40, 1, 0] },
      },
    ],
  },

  // ─── Act 4: The Unfolded Lands ───
  {
    id: 4,
    title: "The Unfolded Lands",
    subtitle: "Where everything was flat. And white. And still.",
    beats: [
      {
        id: "4-arrive",
        text: "They traveled to where the paper had been unfolded completely.",
        character: "narrator",
        mood: "secret",
        camera: { position: [12, 7, -28], lookAt: [0, 0.5, -40] },
      },
      {
        id: "4-white",
        text: "Everything was flat. White. The color of blank paper.",
        character: "narrator",
        mood: "secret",
        camera: { position: [10, 5, -32], lookAt: [0, 0.5, -40] },
        envChange: { fogNear: 15, fogFar: 50, bgColor: "#ffffff" },
      },
      {
        id: "4-sage",
        text: "\"You've come far,\" said a voice above them.",
        character: "narrator",
        mood: "secret",
        camera: { position: [8, 6, -34], lookAt: [0, 2, -40] },
      },
      {
        id: "4-owl",
        text: "An origami owl sat on a pillar of stacked cubes. Sage. The keeper of folds.",
        character: "sage",
        mood: "secret",
        camera: { position: [8, 4.5, -36], lookAt: [0, 2, -40] },
      },
      {
        id: "4-grid",
        text: "The grid below hummed with life. Click the cells to awaken them!",
        character: "prompt",
        mood: "secret",
        interaction: "toggle-cells",
        interactionTarget: 10,
        camera: { position: [6, 5, -36], lookAt: [0, 0.5, -40] },
      },
    ],
  },

  // ─── Act 5: The Secret Fold ───
  {
    id: 5,
    title: "The Secret Fold",
    subtitle: "Sage said: \"There is one fold you have not tried.\"",
    beats: [
      {
        id: "5-secret",
        text: "\"The secret fold is not in your wings. It is in your heart.\"",
        character: "sage",
        mood: "secret",
        camera: { position: [8, 5, -34], lookAt: [0, 2, -40] },
      },
      {
        id: "5-paper",
        text: "Sage gave them a blank piece of paper. Click it to unfold the secret.",
        character: "prompt",
        mood: "secret",
        interaction: "click-unfold",
        interactionTarget: 1,
        camera: { position: [10, 5, -34], lookAt: [0, 2.5, -40] },
      },
      {
        id: "5-realize",
        text: "The paper glowed. And Milo understood.",
        character: "narrator",
        mood: "hope",
        camera: { position: [8, 8, -32], lookAt: [0, 2, -40] },
        envChange: { fogNear: 20, fogFar: 60, bgColor: "#fdf6e3" },
      },
      {
        id: "5-moral",
        text: "\"You are not your folds. You are the paper. You are everything.\"",
        character: "sage",
        mood: "hope",
        camera: { position: [-8, 5, -36], lookAt: [0, 2, -40] },
      },
    ],
  },

  // ─── Act 6: The Return ───
  {
    id: 6,
    title: "The Return",
    subtitle: "Milo flew back. Not with wings. With wind.",
    beats: [
      {
        id: "6-fly",
        text: "Milo flew. Not perfectly. Not straight. But he flew.",
        character: "narrator",
        mood: "hope",
        camera: { position: [12, 10, 54], lookAt: [0, 3, 40] },
      },
      {
        id: "6-lira",
        text: "\"You did it!\" Lira cried. \"You actually did it!\"",
        character: "lira",
        mood: "hope",
        camera: { position: [8, 5, 48], lookAt: [0, 1, 40] },
      },
      {
        id: "6-pip",
        text: "And there, on the water — was Pip. A paper boat. A golden boat.",
        character: "narrator",
        mood: "hope",
        camera: { position: [6, 4, 50], lookAt: [0, 0.5, 40] },
      },
      {
        id: "6-row",
        text: "Click rapidly to row across the water to Pip!",
        character: "prompt",
        mood: "hope",
        interaction: "row-boat",
        interactionTarget: 20,
        camera: { position: [4, 3, 48], lookAt: [0, 0.5, 40] },
      },
    ],
  },

  // ─── Act 7: The Boat Named Pip ───
  {
    id: 7,
    title: "The Boat Named Pip",
    subtitle: "He was not lost. He was transformed.",
    beats: [
      {
        id: "7-pip",
        text: "\"I didn't disappear,\" said Pip. \"The wind showed me what I was meant to be.\"",
        character: "pip",
        mood: "hope",
        camera: { position: [8, 4, 48], lookAt: [0, 0.5, 40] },
      },
      {
        id: "7-tears",
        text: "Lira cried paper tears onto the water.",
        character: "narrator",
        mood: "sorrow",
        camera: { position: [-8, 4, 48], lookAt: [0, 0.5, 40] },
      },
      {
        id: "7-understand",
        text: "The wind does not destroy. It transforms.",
        character: "narrator",
        mood: "hope",
        camera: { position: [6, 8, 52], lookAt: [0, 1, 40] },
      },
      {
        id: "7-butterfly",
        text: "A paper butterfly danced across the water. Follow its path!",
        character: "prompt",
        mood: "hope",
        interaction: "follow-butterfly",
        interactionTarget: 25,
        camera: { position: [4, 3, 46], lookAt: [0, 2, 40] },
      },
    ],
  },

  // ─── Act 8: The Moral Fold ───
  {
    id: 8,
    title: "The Moral Fold",
    subtitle: "You are not your folds. You are everything.",
    beats: [
      {
        id: "8-moral",
        text: "You are not your folds. You are not your creases. You are not your shape.",
        character: "narrator",
        mood: "final",
        camera: { position: [14, 22, 14], lookAt: [0, 0, 0] },
      },
      {
        id: "8-paper",
        text: "You are the paper. You are the possibility.",
        character: "narrator",
        mood: "final",
        camera: { position: [12, 20, -12], lookAt: [0, 0, 0] },
      },
      {
        id: "8-wind",
        text: "Let the wind carry you. Be everything.",
        character: "narrator",
        mood: "final",
        camera: { position: [0, 28, 0], lookAt: [0, 0, 0] },
      },
      {
        id: "8-celebrate",
        text: "Click anywhere to release the paper cranes of celebration!",
        character: "prompt",
        mood: "final",
        interaction: "celebrate",
        interactionTarget: 15,
        camera: { position: [5, 20, 5], lookAt: [0, 10, 0] },
      },
      {
        id: "8-closing",
        text: "Every fold was a choice. Every choice was the wind.",
        character: "narrator",
        mood: "final",
        camera: { position: [0, 22, 0], lookAt: [0, 8, 0] },
      },
    ],
  },
];

// ─── State Machine ────────────────────────────────────────────────────

type InteractionState = "idle" | "interacting" | "complete";

export interface NarrativeState {
  currentAct: number;
  currentBeat: number;
  isAnimating: boolean;
  interactionState: InteractionState;
  interactionProgress: number;
  started: boolean;
  ended: boolean;
}

export const INITIAL_STATE: NarrativeState = {
  currentAct: 0,
  currentBeat: 0,
  isAnimating: false,
  interactionState: "idle",
  interactionProgress: 0,
  started: false,
  ended: false,
};

export function getCurrentAct(state: NarrativeState): Act | null {
  if (state.currentAct < 0 || state.currentAct >= STORY_ACTS.length) return null;
  return STORY_ACTS[state.currentAct];
}

export function getCurrentBeat(state: NarrativeState): Beat | null {
  const act = getCurrentAct(state);
  if (!act) return null;
  if (state.currentBeat < 0 || state.currentBeat >= act.beats.length) return null;
  return act.beats[state.currentBeat];
}

export function nextBeat(state: NarrativeState): NarrativeState {
  const act = getCurrentAct(state);
  if (!act) return state;

  if (state.currentBeat < act.beats.length - 1) {
    return { ...state, currentBeat: state.currentBeat + 1, interactionState: "idle", interactionProgress: 0, isAnimating: false };
  }

  if (state.currentAct < STORY_ACTS.length - 1) {
    return { ...state, currentAct: state.currentAct + 1, currentBeat: 0, interactionState: "idle", interactionProgress: 0, isAnimating: false };
  }

  return { ...state, ended: true };
}
