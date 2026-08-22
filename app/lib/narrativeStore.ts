import { create } from "zustand";
import { CHAPTERS } from "./narrative";

interface NarrativeState {
  started: boolean;
  currentChapter: number;
  currentBeat: number;
  playing: boolean;
  storyTextVisible: boolean;
  collectedLore: number[];
  introComplete: boolean;
  setStarted: (v: boolean) => void;
  setCurrentChapter: (v: number) => void;
  setCurrentBeat: (v: number) => void;
  setPlaying: (v: boolean) => void;
  setStoryTextVisible: (v: boolean) => void;
  collectLore: (chapterId: number) => void;
  nextBeat: () => void;
  nextChapter: () => void;
  reset: () => void;
}

export const useNarrative = create<NarrativeState>((set, get) => ({
  started: false,
  currentChapter: 0,
  currentBeat: 0,
  playing: false,
  storyTextVisible: false,
  collectedLore: [],
  introComplete: false,

  setStarted: (v) => set({ started: v }),
  setCurrentChapter: (v) => set({ currentChapter: v, currentBeat: 0 }),
  setCurrentBeat: (v) => set({ currentBeat: v }),
  setPlaying: (v) => set({ playing: v }),
  setStoryTextVisible: (v) => set({ storyTextVisible: v }),

  collectLore: (chapterId) => {
    const { collectedLore } = get();
    if (!collectedLore.includes(chapterId)) {
      set({ collectedLore: [...collectedLore, chapterId] });
    }
  },

  nextBeat: () => {
    const { currentChapter, currentBeat } = get();
    const chapter = CHAPTERS[currentChapter];
    if (!chapter) return;
    if (currentBeat < chapter.beats.length - 1) {
      set({ currentBeat: currentBeat + 1 });
    } else {
      get().nextChapter();
    }
  },

  nextChapter: () => {
    const { currentChapter } = get();
    if (currentChapter < CHAPTERS.length - 1) {
      set({ currentChapter: currentChapter + 1, currentBeat: 0 });
    } else {
      set({ playing: false });
    }
  },

  reset: () =>
    set({
      started: false,
      currentChapter: 0,
      currentBeat: 0,
      playing: false,
      storyTextVisible: false,
      collectedLore: [],
      introComplete: false,
    }),
}));
