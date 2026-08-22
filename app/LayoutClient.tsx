"use client";

import dynamic from "next/dynamic";
import LoadingScreen from "./components/ui/LoadingScreen";
import IntroOverlay from "./components/ui/IntroOverlay";
import HUD from "./components/ui/HUD";
import StoryOverlay from "./components/ui/StoryOverlay";
import ChapterIndicator from "./components/ui/ChapterIndicator";
import ChapterTransition from "./components/ui/ChapterTransition";
import LorePanel from "./components/ui/LorePanel";
import CinematicCredits from "./components/ui/CinematicCredits";
import { useNarrative } from "./lib/narrativeStore";

const Scene = dynamic(() => import("./components/three/Scene"), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

export default function LayoutClient() {
  const { started } = useNarrative();

  return (
    <>
      <div className="relative h-dvh w-dvw overflow-hidden bg-[#050816]">
        <Scene />
        {started && (
          <>
            <StoryOverlay />
            <ChapterIndicator />
            <ChapterTransition />
          </>
        )}
        <HUD />
        <LorePanel />
        <CinematicCredits />
      </div>
      <IntroOverlay />
    </>
  );
}
