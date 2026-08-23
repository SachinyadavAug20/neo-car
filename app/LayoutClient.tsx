"use client";

import dynamic from "next/dynamic";
import LoadingScreen from "./components/ui/LoadingScreen";
import IntroOverlay from "./components/ui/IntroOverlay";
import HUD from "./components/ui/HUD";
import StoryOverlay from "./components/ui/StoryOverlay";
import StoryChoice from "./components/ui/StoryChoice";
import StoryNavigation from "./components/ui/StoryNavigation";
import ScrollTimeline from "./components/ui/ScrollTimeline";
import ChapterIndicator from "./components/ui/ChapterIndicator";
import ChapterTransition from "./components/ui/ChapterTransition";
import LorePanel from "./components/ui/LorePanel";
import CinematicCredits from "./components/ui/CinematicCredits";
import PhotoMode from "./components/ui/PhotoMode";
import CustomCursor from "./components/ui/CustomCursor";
import QualitySettings from "./components/ui/QualitySettings";
import StoryJournal from "./components/ui/StoryJournal";
import { useNarrative } from "./lib/narrativeStore";

const Scene = dynamic(() => import("./components/three/Scene"), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

export default function LayoutClient() {
  const { started, playing } = useNarrative();

  return (
    <>
      <div className="relative h-dvh w-dvw overflow-hidden bg-[#050816]">
        <Scene />
        {started && (
          <>
            <ScrollTimeline />
            <StoryOverlay />
            <StoryChoice />
            <ChapterIndicator />
            <ChapterTransition />
            <StoryNavigation />
          </>
        )}
        <HUD />
        <PhotoMode />
        <StoryJournal />
        <QualitySettings />
        <LorePanel />
        <CinematicCredits />
      </div>
      <IntroOverlay />
      <CustomCursor />
    </>
  );
}
