"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { JourneyStats, formatTime, getMostEngagedAct, getActEngagementLabel, getActColor } from "@/app/lib/useJourneyTracker";

interface EndScreenProps {
  stats: JourneyStats;
  onRestart: () => void;
}

const CRANE_SVG = `<svg viewBox="0 0 40 40" fill="none"><path d="M20 5 L35 20 L20 18 L5 20 Z" fill="currentColor" opacity="0.8"/><path d="M20 18 L20 35" stroke="currentColor" stroke-width="1.5"/><path d="M20 18 L35 20 L30 28" fill="currentColor" opacity="0.6"/><path d="M20 18 L5 20 L10 28" fill="currentColor" opacity="0.6"/></svg>`;
const BUTTERFLY_SVG = `<svg viewBox="0 0 30 30" fill="none"><path d="M15 8 C8 2, 2 8, 8 15 C2 22, 8 28, 15 22 C22 28, 28 22, 22 15 C28 8, 22 2, 15 8Z" fill="currentColor" opacity="0.7"/><line x1="15" y1="5" x2="15" y2="25" stroke="currentColor" stroke-width="1"/></svg>`;
const LEAF_SVG = `<svg viewBox="0 0 24 24" fill="none"><path d="M12 2 C6 8, 2 14, 12 22 C22 14, 18 8, 12 2Z" fill="currentColor" opacity="0.6"/><line x1="12" y1="6" x2="12" y2="20" stroke="currentColor" stroke-width="0.8" opacity="0.8"/></svg>`;

function FloatingElement({ svg, x, delay, duration, color, size }: {
  svg: string; x: number; delay: number; duration: number; color: string; size: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    gsap.set(el, { y: "110vh", x: `${x}vw`, rotation: Math.random() * 360, opacity: 0 });
    const tl = gsap.timeline({ repeat: -1, delay });
    tl.to(el, { y: "-10vh", opacity: 0.5, duration: duration * 0.3, ease: "power1.out" })
      .to(el, { opacity: 0.7, duration: duration * 0.4 })
      .to(el, { y: "-10vh", opacity: 0, duration: duration * 0.3, ease: "power1.in" });
    return () => { tl.kill(); };
  }, [x, delay, duration]);
  return (
    <div ref={ref} style={{ position: "fixed", width: size, height: size, color, pointerEvents: "none", zIndex: 60 }}
      dangerouslySetInnerHTML={{ __html: svg }} />
  );
}

function StatBlock({ icon, label, value, sub, delay, color = "#1a1a2e" }: {
  icon: string; label: string; value: string; sub?: string; delay: number; color?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current,
      { opacity: 0, y: 20, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.4)", delay }
    );
  }, [delay]);
  return (
    <div ref={ref} style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      padding: "14px 18px", background: "rgba(255,255,255,0.7)", borderRadius: 14,
      border: `2px solid ${color}`, minWidth: 100, opacity: 0,
      boxShadow: `2px 2px 0 ${color}20`,
    }}>
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: "bold", color, fontFamily: "monospace", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: "#1a1a2e", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700 }}>{label}</div>
      {sub && <div style={{ fontSize: 9, color: "#1a1a2e", opacity: 0.5, fontStyle: "italic" }}>{sub}</div>}
    </div>
  );
}

function ActBar({ act, clicks, beats, interactions, time, maxClicks, delay }: {
  act: number; clicks: number; beats: number; interactions: number; time: number; maxClicks: number; delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const width = maxClicks > 0 ? (clicks / maxClicks) * 100 : 0;
  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current,
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.4, ease: "power2.out", delay }
    );
  }, [delay]);
  return (
    <div ref={ref} style={{ display: "flex", alignItems: "center", gap: 10, opacity: 0, marginBottom: 6 }}>
      <div style={{ width: 18, height: 18, borderRadius: 4, background: getActColor(act), border: "1.5px solid #1a1a2e", flexShrink: 0 }} />
      <div style={{ width: 100, fontSize: 11, color: "#1a1a2e", fontWeight: 600, flexShrink: 0 }}>
        {getActEngagementLabel(act)}
      </div>
      <div style={{ flex: 1, height: 14, background: "#e5e7eb", borderRadius: 7, overflow: "hidden", border: "1px solid #1a1a2e", position: "relative" }}>
        <div style={{
          width: `${width}%`, height: "100%", background: `linear-gradient(90deg, ${getActColor(act)}, ${getActColor(act)}cc)`,
          borderRadius: 7, transition: "width 0.6s ease-out",
        }} />
      </div>
      <div style={{ width: 60, fontSize: 10, color: "#1a1a2e", textAlign: "right", fontFamily: "monospace" }}>
        {formatTime(time)}
      </div>
      <div style={{ width: 24, fontSize: 10, color: "#1a1a2e", textAlign: "right", fontFamily: "monospace" }}>
        {clicks}
      </div>
    </div>
  );
}

function Badge({ icon, label, delay, unlocked }: { icon: string; label: string; delay: number; unlocked: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current,
      { opacity: 0, scale: 0.5, rotation: -10 },
      { opacity: 1, scale: 1, rotation: 0, duration: 0.4, ease: "back.out(2)", delay }
    );
  }, [delay]);
  return (
    <div ref={ref} style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      padding: "10px 12px", borderRadius: 12,
      background: unlocked ? "rgba(251,191,36,0.15)" : "rgba(0,0,0,0.03)",
      border: `2px solid ${unlocked ? "#fbbf24" : "#e5e7eb"}`,
      opacity: 0, minWidth: 70,
    }}>
      <div style={{ fontSize: 20, filter: unlocked ? "none" : "grayscale(1) opacity(0.3)" }}>{icon}</div>
      <div style={{ fontSize: 9, color: unlocked ? "#1a1a2e" : "#9ca3af", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, textAlign: "center" }}>{label}</div>
    </div>
  );
}

export default function EndScreen({ stats, onRestart }: EndScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showBadges, setShowBadges] = useState(false);

  const totalTime = stats.endTime - stats.startTime;
  const mostEngaged = getMostEngagedAct(stats);
  const maxClicks = Math.max(...stats.actClicks, 1);
  const totalInteractions = stats.actInteractions.reduce((a, b) => a + b, 0);
  const totalBeats = stats.actBeatCount.reduce((a, b) => a + b, 0);

  useEffect(() => {
    const tl = gsap.timeline();
    tl.to(containerRef.current, { opacity: 1, duration: 2, ease: "power2.inOut" })
      .call(() => setVisible(true))
      .call(() => setShowDetails(true), [], "+=0.8")
      .call(() => setShowBadges(true), [], "+=0.6");
    return () => { tl.kill(); };
  }, []);

  return (
    <div ref={containerRef} style={{
      position: "fixed", inset: 0, zIndex: 55,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "#fdf6e3", opacity: 0, fontFamily: "Georgia, serif",
      overflowY: "auto", overflowX: "hidden",
    }}>
      {/* Floating elements */}
      {Array.from({ length: 6 }).map((_, i) => (
        <FloatingElement key={`c-${i}`} svg={CRANE_SVG} x={8 + i * 16} delay={i * 1} duration={9 + i}
          color={["#fbbf24", "#a78bfa", "#f472b6", "#67e8f9", "#22c55e", "#f97316"][i]} size={18 + i * 2} />
      ))}
      {Array.from({ length: 4 }).map((_, i) => (
        <FloatingElement key={`b-${i}`} svg={BUTTERFLY_SVG} x={12 + i * 22} delay={1.5 + i * 1.3} duration={10 + i}
          color={["#a78bfa", "#f472b6", "#67e8f9", "#fbbf24"][i]} size={14 + i * 2} />
      ))}
      {Array.from({ length: 5 }).map((_, i) => (
        <FloatingElement key={`l-${i}`} svg={LEAF_SVG} x={5 + i * 18} delay={0.8 + i * 1.1} duration={8 + i}
          color={["#22c55e", "#4ade80", "#86efac", "#fbbf24", "#a78bfa"][i]} size={12 + i * 2} />
      ))}

      {/* Main content */}
      {visible && (
        <div style={{
          textAlign: "center", maxWidth: 640, width: "92%", padding: "40px 20px",
          position: "relative", zIndex: 10, maxHeight: "95vh", overflowY: "auto",
        }}>
          {/* Header */}
          <div style={{ fontSize: 11, letterSpacing: 5, textTransform: "uppercase", fontWeight: 600, marginBottom: 12, color: "#1a1a2e", opacity: 0 }}
            ref={el => { if (el) gsap.to(el, { opacity: 0.6, duration: 1, delay: 0.3 }); }}>
            Journey Complete
          </div>
          <div style={{ fontSize: 56, fontWeight: "bold", color: "#1a1a2e", letterSpacing: -3, marginBottom: 4, opacity: 0 }}
            ref={el => { if (el) gsap.to(el, { opacity: 1, duration: 1, delay: 0.6 }); }}>
            DRIFT
          </div>
          <div style={{ fontSize: 15, color: "#1a1a2e", fontStyle: "italic", marginBottom: 6, opacity: 0 }}
            ref={el => { if (el) gsap.to(el, { opacity: 0.7, duration: 1, delay: 0.9 }); }}>
            A Paper World
          </div>
          <div style={{ width: 50, height: 2, background: "#1a1a2e", margin: "0 auto 20px", opacity: 0 }}
            ref={el => { if (el) gsap.to(el, { opacity: 0.4, duration: 1, delay: 1.1 }); }} />

          {/* Quick summary quote */}
          <div style={{ fontSize: 16, color: "#1a1a2e", lineHeight: 1.7, marginBottom: 24, fontStyle: "italic", maxWidth: 400, margin: "0 auto 24px", opacity: 0 }}
            ref={el => { if (el) gsap.to(el, { opacity: 1, duration: 1, delay: 1.3 }); }}>
            &ldquo;Every fold was a choice. Every choice was the wind.&rdquo;
          </div>

          {/* Main stats grid */}
          {showDetails && (
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
              <StatBlock icon="⏱" value={formatTime(totalTime)} label="Total Time" sub="story duration" delay={0} />
              <StatBlock icon="👆" value={String(stats.totalClicks)} label="Clicks" sub={`${Math.round(stats.totalClicks / Math.max(totalTime / 1000, 1))}/sec`} delay={0.1} />
              <StatBlock icon="🖱" value={`${Math.round(stats.totalMouseMoveDistance)}m`} label="Distance" sub="cursor traveled" delay={0.2} />
              <StatBlock icon="⌨" value={String(stats.totalKeys)} label="Keys Typed" sub="keyboard input" delay={0.3} />
            </div>
          )}

          {/* Secondary stats */}
          {showDetails && (
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 24 }}>
              <StatBlock icon="📖" value={String(totalBeats)} label="Beats Visited" sub={`of ${32} total`} delay={0.4} color="#6b7280" />
              <StatBlock icon="🎯" value={String(totalInteractions)} label="Interactions" sub="completed" delay={0.5} color="#6b7280" />
              <StatBlock icon="🌟" value={String(stats.secretsFound.length)} label="Secrets" sub="words typed" delay={0.6} color="#fbbf24" />
              <StatBlock icon="📚" value={String(stats.loreCollected)} label="Lore" sub="fragments" delay={0.7} color="#a78bfa" />
            </div>
          )}

          {/* Act-by-act breakdown */}
          {showDetails && (
            <div style={{
              background: "rgba(255,255,255,0.6)", border: "2px solid #1a1a2e", borderRadius: 16,
              padding: "18px 20px", marginBottom: 20, boxShadow: "3px 3px 0 #1a1a2e20",
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1a2e", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12, textAlign: "left" }}>
                Act-by-Act Breakdown
              </div>
              <div style={{ fontSize: 10, color: "#1a1a2e", opacity: 0.5, marginBottom: 10, textAlign: "left" }}>
                Most engaged: <strong style={{ color: getActColor(mostEngaged) }}>{getActEngagementLabel(mostEngaged)}</strong>
              </div>
              {Array.from({ length: 8 }).map((_, i) => (
                <ActBar
                  key={i} act={i}
                  clicks={stats.actClicks[i]}
                  beats={stats.actBeatCount[i]}
                  interactions={stats.actInteractions[i]}
                  time={stats.actTimes[i]}
                  maxClicks={maxClicks}
                  delay={0.8 + i * 0.1}
                />
              ))}
            </div>
          )}

          {/* Activity breakdown */}
          {showDetails && (
            <div style={{
              background: "rgba(255,255,255,0.6)", border: "2px solid #1a1a2e", borderRadius: 16,
              padding: "18px 20px", marginBottom: 20, boxShadow: "3px 3px 0 #1a1a2e20",
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1a2e", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12, textAlign: "left" }}>
                Your Activities
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8, textAlign: "left" }}>
                {[
                  { icon: "🦘", label: "Jumps", val: stats.jumpsMade },
                  { icon: "🌬", label: "Wind Power", val: stats.windGenerated },
                  { icon: "🍃", label: "Leaves", val: stats.leavesCollected },
                  { icon: "🔲", label: "Cells Toggled", val: stats.cellsToggled },
                  { icon: "🚣", label: "Boat Strokes", val: stats.boatStrokes },
                  { icon: "🦋", label: "Butterflies", val: stats.butterfliesFollowed },
                  { icon: " paper", label: "Cranes", val: stats.cranesReleased },
                  { icon: "💥", label: "Shatters", val: stats.shattersTriggered },
                  { icon: "🔔", label: "Pendulums", val: stats.pendulumsPushed },
                  { icon: "🦊", label: "Critters", val: stats.crittersFound },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0" }}>
                    <span style={{ fontSize: 14 }}>{item.icon}</span>
                    <span style={{ fontSize: 11, color: "#1a1a2e" }}>{item.label}:</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#1a1a2e", fontFamily: "monospace" }}>{item.val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Badges */}
          {showBadges && (
            <div style={{
              background: "rgba(255,255,255,0.6)", border: "2px solid #1a1a2e", borderRadius: 16,
              padding: "18px 20px", marginBottom: 24, boxShadow: "3px 3px 0 #1a1a2e20",
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1a2e", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12, textAlign: "left" }}>
                Badges Earned
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-start" }}>
                <Badge icon=" paper" label="First Fold" delay={0} unlocked={stats.jumpsMade > 0} />
                <Badge icon="🌊" label="Storm Rider" delay={0.1} unlocked={stats.windGenerated > 10} />
                <Badge icon="🍃" label="Leaf Collector" delay={0.2} unlocked={stats.leavesCollected >= 8} />
                <Badge icon="🔲" label="Cell Master" delay={0.3} unlocked={stats.cellsToggled >= 10} />
                <Badge icon="🚣" label="Rowing Pro" delay={0.4} unlocked={stats.boatStrokes >= 20} />
                <Badge icon="🦋" label="Butterfly Chaser" delay={0.5} unlocked={stats.butterfliesFollowed >= 25} />
                <Badge icon="🎉" label="Celebration" delay={0.6} unlocked={stats.cranesReleased >= 15} />
                <Badge icon=" secret" label="Secret Keeper" delay={0.7} unlocked={stats.secretsFound.length > 0} />
                <Badge icon="📚" label="Lore Master" delay={0.8} unlocked={stats.loreCollected >= 3} />
                <Badge icon="💥" label="Breakthrough" delay={0.9} unlocked={stats.shattersTriggered > 0} />
                <Badge icon="🦊" label="Critter Friend" delay={1.0} unlocked={stats.crittersFound >= 3} />
                <Badge icon=" complete" label="Full Journey" delay={1.1} unlocked={totalBeats >= 30} />
              </div>
            </div>
          )}

          {/* Secrets discovered */}
          {stats.secretsFound.length > 0 && showDetails && (
            <div style={{
              background: "rgba(251,191,36,0.1)", border: "2px solid #fbbf24", borderRadius: 14,
              padding: "14px 18px", marginBottom: 20, textAlign: "left",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#1a1a2e", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>
                Secret Words Discovered
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {Array.from(new Set(stats.secretsFound)).map((word, i) => (
                  <span key={i} style={{
                    background: "#1a1a2e", color: "#fbbf24", borderRadius: 8,
                    padding: "4px 12px", fontSize: 12, fontFamily: "monospace", fontWeight: 700,
                  }}>
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", opacity: 0 }}
            ref={el => { if (el) gsap.to(el, { opacity: 1, duration: 0.8, delay: 2.5 }); }}>
            <button onClick={onRestart} style={{
              background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 14,
              padding: "16px 40px", fontSize: 15, fontFamily: "Georgia, serif", cursor: "pointer",
              boxShadow: "4px 4px 0 #6b7280", fontWeight: 600, transition: "transform 0.15s, box-shadow 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translate(-1px,-1px)"; e.currentTarget.style.boxShadow = "5px 5px 0 #6b7280"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translate(0,0)"; e.currentTarget.style.boxShadow = "4px 4px 0 #6b7280"; }}
            >
              Play Again
            </button>
            <a href="/about" style={{
              background: "#fff", color: "#1a1a2e", border: "2px solid #1a1a2e", borderRadius: 14,
              padding: "14px 28px", fontSize: 15, fontFamily: "Georgia, serif", cursor: "pointer",
              boxShadow: "3px 3px 0 #1a1a2e", fontWeight: 600, textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: 8,
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translate(-1px,-1px)"; e.currentTarget.style.boxShadow = "4px 4px 0 #1a1a2e"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translate(0,0)"; e.currentTarget.style.boxShadow = "3px 3px 0 #1a1a2e"; }}
            >
              About the Project
            </a>
          </div>

          {/* Footer */}
          <div style={{ fontSize: 11, color: "#1a1a2e", marginTop: 24, opacity: 0 }}
            ref={el => { if (el) gsap.to(el, { opacity: 0.35, duration: 1, delay: 3 }); }}>
            Thank you for experiencing DRIFT. The paper remembers your journey.
          </div>
          <div style={{ fontSize: 10, color: "#1a1a2e", marginTop: 10, opacity: 0 }}
            ref={el => { if (el) gsap.to(el, { opacity: 0.25, duration: 1, delay: 3.5 }); }}>
            WASD/HJKL to move &middot; Ctrl+K commands &middot; Ctrl+~ terminal &middot; Type secret words like &ldquo;wind&rdquo; or &ldquo;fold&rdquo;
          </div>
          {stats.foldsUnlocked && (
            <div style={{ fontSize: 10, color: "#fbbf24", marginTop: 8, opacity: 0 }}
              ref={el => { if (el) gsap.to(el, { opacity: 0.5, duration: 1, delay: 4 }); }}>
              The secret fold has been unlocked. The paper remembers.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
