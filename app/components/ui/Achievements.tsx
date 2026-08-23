"use client";

import { useState, useEffect } from "react";
import { Trophy, Star, Eye, Compass, BookOpen, Camera, Sparkles } from "lucide-react";
import { useNarrative } from "@/app/lib/narrativeStore";
import { CHAPTERS } from "@/app/lib/narrative";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: typeof Trophy;
  unlocked: boolean;
}

export default function Achievements() {
  const { started, collectedLore, storyLog, currentChapter, mood } = useNarrative();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    if (!started) return;

    const newAchievements: Achievement[] = [
      {
        id: "first-step",
        title: "First Step",
        description: "Begin your journey",
        icon: Compass,
        unlocked: currentChapter >= 0,
      },
      {
        id: "storyteller",
        title: "Storyteller",
        description: "Make your first choice",
        icon: Star,
        unlocked: storyLog.length > 0,
      },
      {
        id: "lore-seeker",
        title: "Lore Seeker",
        description: "Discover 3 lore entries",
        icon: BookOpen,
        unlocked: collectedLore.length >= 3,
      },
      {
        id: "witness",
        title: "Witness",
        description: "Complete the story",
        icon: Eye,
        unlocked: currentChapter >= CHAPTERS.length - 1,
      },
      {
        id: "photo-hunter",
        title: "Photo Hunter",
        description: "Enter photo mode",
        icon: Camera,
        unlocked: false,
      },
      {
        id: "mood-rider",
        title: "Mood Rider",
        description: "Experience all 4 moods",
        icon: Sparkles,
        unlocked: false,
      },
      {
        id: "completionist",
        title: "Completionist",
        description: "Collect all lore entries",
        icon: Trophy,
        unlocked: collectedLore.length >= CHAPTERS.length,
      },
    ];

    const prevIds = achievements.map((a) => a.id);
    const newlyUnlocked = newAchievements.filter(
      (a) => a.unlocked && !prevIds.includes(a.id),
    );

    if (newlyUnlocked.length > 0) {
      setShowToast(newlyUnlocked[0].title);
      setTimeout(() => setShowToast(null), 3000);
    }

    setAchievements(newAchievements);
  }, [started, collectedLore, storyLog, currentChapter, mood]);

  if (!started) return null;

  return (
    <>
      {/* Achievement toast */}
      {showToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[80] glass rounded-xl px-4 py-3 flex items-center gap-3 animate-fadeIn pointer-events-none">
          <Trophy size={16} className="text-amber-400" />
          <div>
            <div className="text-[10px] tracking-[0.3em] text-amber-400">ACHIEVEMENT UNLOCKED</div>
            <div className="text-xs text-white/60">{showToast}</div>
          </div>
        </div>
      )}

      {/* Trophy button */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="fixed top-6 left-28 z-40 glass p-3 rounded-full text-white/30 hover:text-white/60 transition-colors pointer-events-auto"
      >
        <Trophy size={16} />
      </button>

      {/* Achievement panel */}
      {showPanel && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#050816]/90 backdrop-blur-sm pointer-events-auto">
          <div className="glass rounded-2xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto relative">
            <button
              onClick={() => setShowPanel(false)}
              className="absolute top-4 right-4 text-white/30 hover:text-white/60 text-xs"
            >
              CLOSE
            </button>
            <h2 className="text-lg font-display tracking-[0.3em] text-amber-400 mb-6">ACHIEVEMENTS</h2>
            <div className="space-y-3">
              {achievements.map((ach) => {
                const Icon = ach.icon;
                return (
                  <div
                    key={ach.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      ach.unlocked ? "bg-white/5" : "opacity-40"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${ach.unlocked ? "bg-amber-400/10" : "bg-white/5"}`}>
                      <Icon size={14} className={ach.unlocked ? "text-amber-400" : "text-white/20"} />
                    </div>
                    <div>
                      <div className="text-xs tracking-[0.15em] text-white/50">{ach.title}</div>
                      <div className="text-[10px] text-white/25">{ach.description}</div>
                    </div>
                    {ach.unlocked && (
                      <div className="ml-auto text-amber-400 text-[10px]">✓</div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 text-center text-[10px] text-white/20">
              {achievements.filter((a) => a.unlocked).length} / {achievements.length} unlocked
            </div>
          </div>
        </div>
      )}
    </>
  );
}
