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
  showingChoice: boolean;
  choiceMade: string | null;
  skippedChapters: number[];
  storyLog: string[];
  mood: "hope" | "loss" | "wonder" | "courage" | null;
  setStarted: (v: boolean) => void;
  setCurrentChapter: (v: number) => void;
  setCurrentBeat: (v: number) => void;
  setPlaying: (v: boolean) => void;
  setStoryTextVisible: (v: boolean) => void;
  collectLore: (chapterId: number) => void;
  nextBeat: () => void;
  nextChapter: () => void;
  showChoice: () => void;
  makeChoice: (choiceId: string, mood: "hope" | "loss" | "wonder" | "courage") => void;
  skipChapter: () => void;
  jumpToChapter: (chapterIndex: number) => void;
  addToLog: (text: string) => void;
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
  showingChoice: false,
  choiceMade: null,
  skippedChapters: [],
  storyLog: [],
  mood: null,

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
    const { currentChapter, currentBeat, showingChoice } = get();
    if (showingChoice) return;
    const chapter = CHAPTERS[currentChapter];
    if (!chapter) return;
    if (currentBeat < chapter.beats.length - 1) {
      set({ currentBeat: currentBeat + 1 });
    } else {
      if (chapter.choice) {
        set({ showingChoice: true });
      } else {
        get().collectLore(currentChapter + 1);
        get().nextChapter();
      }
    }
  },

  nextChapter: () => {
    const { currentChapter } = get();
    if (currentChapter < CHAPTERS.length - 1) {
      set({ currentChapter: currentChapter + 1, currentBeat: 0, showingChoice: false, choiceMade: null });
    } else {
      set({ playing: false });
    }
  },

  showChoice: () => set({ showingChoice: true }),

  makeChoice: (choiceId, mood) => {
    const { currentChapter } = get();
    get().collectLore(currentChapter + 1);
    set({ showingChoice: false, choiceMade: choiceId, mood });
    get().addToLog(`Chapter ${currentChapter + 1}: chose "${choiceId}" (${mood})`);
    setTimeout(() => get().nextChapter(), 2000);
  },

  skipChapter: () => {
    const { currentChapter, skippedChapters } = get();
    get().collectLore(currentChapter + 1);
    set({
      skippedChapters: [...skippedChapters, currentChapter],
      showingChoice: false,
      choiceMade: null,
    });
    get().nextChapter();
  },

  jumpToChapter: (chapterIndex) => {
    if (chapterIndex >= 0 && chapterIndex < CHAPTERS.length) {
      set({
        currentChapter: chapterIndex,
        currentBeat: 0,
        playing: true,
        showingChoice: false,
        choiceMade: null,
      });
    }
  },

  addToLog: (text) => {
    const { storyLog } = get();
    set({ storyLog: [...storyLog, text] });
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
      showingChoice: false,
      choiceMade: null,
      skippedChapters: [],
      storyLog: [],
      mood: null,
    }),
}));
