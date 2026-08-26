"use client";

// ─── Narrative State Machine ──────────────────────────────────────────

export interface Beat {
  id: string;
  text: string;
  character?: string;
  mood: "warm" | "storm" | "calm" | "secret" | "sorrow" | "hope" | "final";
  camera?: {
    position: [number, number, number];
    lookAt: [number, number, number];
  };
  interaction?: "none" | "click-jump" | "drag-wind" | "click-unfold" | "click-reveal";
  interactionTarget?: number; // how many clicks/drags needed
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
  characterPos?: [number, number, number]; // where the main character is
}

export const STORY_ACTS: Act[] = [
  // ─── Act I: The Crane Who Couldn't Fly ───
  {
    id: 1,
    title: "The Crane Who Couldn't Fly",
    subtitle: "Milo was a paper crane. One wing was bigger than the other.",
    characterPos: [0, 0, 0],
    beats: [
      {
        id: "1-intro",
        text: "There was a paper crane named Milo who could not fly.",
        character: "narrator",
        mood: "warm",
        camera: { position: [3, 2, 5], lookAt: [0, 0.5, 0] },
      },
      {
        id: "1-wing",
        text: "One wing was bigger than the other. When he tried to fly, he always tilted to the left.",
        character: "narrator",
        mood: "warm",
        camera: { position: [2, 1.5, 3], lookAt: [0, 0.5, 0] },
      },
      {
        id: "1-jump",
        text: "Click to help Milo jump!",
        character: "prompt",
        mood: "warm",
        interaction: "click-jump",
        interactionTarget: 5,
        camera: { position: [2, 1, 3], lookAt: [0, 0.5, 0] },
      },
      {
        id: "1-fail",
        text: "Every jump ended the same way — a tumble, a fold, a crumple.",
        character: "narrator",
        mood: "warm",
        camera: { position: [2.5, 1.5, 4], lookAt: [0, 0.3, 0] },
      },
      {
        id: "1-decide",
        text: "\"I will find the wind,\" Milo said. \"The wind will know how to carry me.\"",
        character: "milo",
        mood: "warm",
        camera: { position: [1.5, 1.2, 2], lookAt: [0, 0.5, 0] },
      },
    ],
  },
  // ─── Act II: The Storm ───
  {
    id: 2,
    title: "The Storm",
    subtitle: "The wind came. Not gentle. Not kind.",
    characterPos: [5, 0, -3],
    beats: [
      {
        id: "2-arrive",
        text: "Milo found the edge of the world where the wind lived.",
        character: "narrator",
        mood: "storm",
        camera: { position: [8, 3, 0], lookAt: [5, 0, -3] },
      },
      {
        id: "2-storm",
        text: "Drag across the canvas to create the wind!",
        character: "prompt",
        mood: "storm",
        interaction: "drag-wind",
        interactionTarget: 30,
        camera: { position: [6, 2, 2], lookAt: [5, 0.5, -3] },
      },
      {
        id: "2-lifted",
        text: "The wind grabbed Milo. Tumbled him. Folded him. Unfolded him.",
        character: "narrator",
        mood: "storm",
        camera: { position: [6, 3, -1], lookAt: [5, 1.5, -3] },
      },
      {
        id: "2-carried",
        text: "And then — it carried him. High above the paper world.",
        character: "narrator",
        mood: "storm",
        camera: { position: [5, 8, -3], lookAt: [5, 0, -3] },
      },
    ],
  },
  // ─── Act III: The Fox Who Was Hiding ───
  {
    id: 3,
    title: "The Fox Who Was Hiding",
    subtitle: "In the forest of cone trees, something rustled.",
    characterPos: [-8, 0, 6],
    beats: [
      {
        id: "3-forest",
        text: "The wind dropped Milo in a forest of paper trees.",
        character: "narrator",
        mood: "calm",
        camera: { position: [-6, 2, 8], lookAt: [-8, 0, 6] },
      },
      {
        id: "3-rustle",
        text: "Something moved between the cone-shaped trees.",
        character: "narrator",
        mood: "calm",
        camera: { position: [-7, 1.5, 7], lookAt: [-8, 0.5, 6] },
      },
      {
        id: "3-lira",
        text: "\"Who's there?\" whispered a fox made of folded orange paper.",
        character: "lira",
        mood: "calm",
        camera: { position: [-7, 1, 7], lookAt: [-8, 0.3, 6] },
      },
      {
        id: "3-name",
        text: "\"I'm Milo. I'm looking for the wind.\"",
        character: "milo",
        mood: "calm",
        camera: { position: [-7.5, 1.2, 6.5], lookAt: [-8, 0.5, 6] },
      },
      {
        id: "3-pip",
        text: "\"My brother Pip went looking for the wind too. He never came back.\"",
        character: "lira",
        mood: "sorrow",
        camera: { position: [-8, 1, 6], lookAt: [15, 0, -5] }, // pan to horizon
      },
      {
        id: "3-together",
        text: "\"I'll help you find him,\" said Milo. \"And the wind.\"",
        character: "milo",
        mood: "calm",
        camera: { position: [-6, 1.5, 8], lookAt: [-8, 0.5, 6] },
      },
    ],
  },
  // ─── Act IV: The Unfolded Lands ───
  {
    id: 4,
    title: "The Unfolded Lands",
    subtitle: "Where everything was flat. And white. And still.",
    characterPos: [15, 0, -5],
    beats: [
      {
        id: "4-arrive",
        text: "They traveled to where the paper had been unfolded completely.",
        character: "narrator",
        mood: "secret",
        camera: { position: [18, 2, -3], lookAt: [15, 0, -5] },
      },
      {
        id: "4-white",
        text: "Everything was flat. White. The color of blank paper.",
        character: "narrator",
        mood: "secret",
        envChange: { fogNear: 10, fogFar: 40, bgColor: "#ffffff" },
      },
      {
        id: "4-sage",
        text: "\"You've come far,\" said a voice above them.",
        character: "narrator",
        mood: "secret",
      },
      {
        id: "4-owl",
        text: "An origami owl sat on a pillar of stacked cubes. Sage. The keeper of folds.",
        character: "sage",
        mood: "secret",
        camera: { position: [14, 3, -4], lookAt: [15, 2, -5] },
      },
    ],
  },
  // ─── Act V: The Secret Fold ───
  {
    id: 5,
    title: "The Secret Fold",
    subtitle: "Sage said: \"There is one fold you have not tried.\"",
    characterPos: [15, 0, -5],
    beats: [
      {
        id: "5-secret",
        text: "\"The secret fold is not in your wings. It is in your heart.\"",
        character: "sage",
        mood: "secret",
        camera: { position: [14, 2.5, -4], lookAt: [15, 1.5, -5] },
      },
      {
        id: "5-paper",
        text: "Sage gave them a blank piece of paper. Click it to unfold the secret.",
        character: "prompt",
        mood: "secret",
        interaction: "click-unfold",
        interactionTarget: 1,
        camera: { position: [14, 2, -3], lookAt: [15, 1.5, -4] },
      },
      {
        id: "5-realize",
        text: "The paper glowed. And Milo understood.",
        character: "narrator",
        mood: "hope",
        envChange: { fogNear: 20, fogFar: 60, bgColor: "#fdf6e3" },
        camera: { position: [15, 2, -2], lookAt: [15, 1.5, -4] },
      },
      {
        id: "5-moral",
        text: "\"You are not your folds. You are the paper. You are everything.\"",
        character: "sage",
        mood: "hope",
        camera: { position: [14, 2.5, -5], lookAt: [15, 1.2, -5] },
      },
    ],
  },
  // ─── Act VI: The Return ───
  {
    id: 6,
    title: "The Return",
    subtitle: "Milo flew back. Not with wings. With wind.",
    characterPos: [0, 3, 0],
    beats: [
      {
        id: "6-fly",
        text: "Milo flew. Not perfectly. Not straight. But he flew.",
        character: "narrator",
        mood: "hope",
        camera: { position: [3, 5, 3], lookAt: [0, 3, 0] },
      },
      {
        id: "6-lira",
        text: "\"You did it!\" Lira cried. \"You actually did it!\"",
        character: "lira",
        mood: "hope",
        camera: { position: [-6, 1.5, 7], lookAt: [-8, 0.3, 6] },
      },
      {
        id: "6-pip",
        text: "And there, on the water — was Pip. A paper boat. A golden boat.",
        character: "narrator",
        mood: "hope",
        camera: { position: [0, 2, 5], lookAt: [0, 0, 8] },
      },
    ],
  },
  // ─── Act VII: The Boat Named Pip ───
  {
    id: 7,
    title: "The Boat Named Pip",
    subtitle: "He was not lost. He was transformed.",
    characterPos: [0, 0, 8],
    beats: [
      {
        id: "7-pip",
        text: "\"I didn't disappear,\" said Pip. \"The wind showed me what I was meant to be.\"",
        character: "pip",
        mood: "hope",
        camera: { position: [1, 1, 9], lookAt: [0, 0, 8] },
      },
      {
        id: "7-tears",
        text: "Lira cried paper tears onto the water.",
        character: "narrator",
        mood: "sorrow",
        camera: { position: [-1, 1.5, 9], lookAt: [0, 0, 8] },
      },
      {
        id: "7-understand",
        text: "The wind does not destroy. It transforms.",
        character: "narrator",
        mood: "hope",
        camera: { position: [2, 2, 7], lookAt: [0, 0.5, 8] },
      },
    ],
  },
  // ─── Act VIII: The Moral Fold ───
  {
    id: 8,
    title: "The Moral Fold",
    subtitle: "You are not your folds. You are everything.",
    characterPos: [0, 4, 0],
    beats: [
      {
        id: "8-moral",
        text: "You are not your folds. You are not your creases. You are not your shape.",
        character: "narrator",
        mood: "final",
        camera: { position: [5, 6, 5], lookAt: [0, 2, 0] },
      },
      {
        id: "8-paper",
        text: "You are the paper. You are the possibility.",
        character: "narrator",
        mood: "final",
        camera: { position: [3, 5, 3], lookAt: [0, 2, 0] },
      },
      {
        id: "8-wind",
        text: "Let the wind carry you. Be everything.",
        character: "narrator",
        mood: "final",
        camera: { position: [0, 10, 0], lookAt: [0, 0, 0] },
      },
    ],
  },
];

// ─── State Machine ────────────────────────────────────────────────────

export type InteractionState = "idle" | "interacting" | "complete";

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
    return { ...state, currentBeat: state.currentBeat + 1, interactionState: "idle", interactionProgress: 0 };
  }

  // Move to next act
  if (state.currentAct < STORY_ACTS.length - 1) {
    return { ...state, currentAct: state.currentAct + 1, currentBeat: 0, interactionState: "idle", interactionProgress: 0 };
  }

  // Story ended
  return { ...state, ended: true };
}
