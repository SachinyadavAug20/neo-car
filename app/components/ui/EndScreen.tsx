"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import gsap from "gsap";
import html2canvas from "html2canvas";
import { JourneyStats, formatTime, getActEngagementLabel, getActColor } from "@/app/lib/useJourneyTracker";

interface EndScreenProps {
  stats: JourneyStats;
  onRestart: () => void;
}

const card = {
  background: "var(--bg-card)",
  border: "2px solid var(--border)",
  color: "var(--text)",
  transition: "background 0.3s, color 0.3s, border-color 0.3s",
} as const;

function StatBlock({ label, value, delay }: {
  label: string; value: string; delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.3)", delay });
  }, [delay]);
  return (
    <div ref={ref} style={{
      ...card, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      padding: "16px 20px", borderRadius: 12, boxShadow: "3px 3px 0 var(--shadow)", minWidth: 100, opacity: 0,
    }}>
      <div style={{ fontSize: 28, fontWeight: "bold", fontFamily: "monospace", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2, fontWeight: 700, color: "var(--text-muted)", opacity: 0.6 }}>{label}</div>
    </div>
  );
}

function ActBar({ act, clicks, time, maxClicks, delay }: {
  act: number; clicks: number; time: number; maxClicks: number; delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const width = maxClicks > 0 ? (clicks / maxClicks) * 100 : 0;
  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current, { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.4, ease: "power2.out", delay });
  }, [delay]);
  return (
    <div ref={ref} style={{ display: "flex", alignItems: "center", gap: 10, opacity: 0, marginBottom: 6 }}>
      <div style={{ width: 14, height: 14, borderRadius: 4, background: getActColor(act), border: "1.5px solid var(--border)", flexShrink: 0, transition: "border-color 0.3s" }} />
      <div style={{ width: 90, fontSize: 11, fontWeight: 600, flexShrink: 0, color: "var(--text-muted)" }}>
        {getActEngagementLabel(act)}
      </div>
      <div style={{ flex: 1, height: 10, background: "var(--border-light)", borderRadius: 5, overflow: "hidden", transition: "background 0.3s" }}>
        <div style={{ width: `${width}%`, height: "100%", background: `linear-gradient(90deg, ${getActColor(act)}, ${getActColor(act)}cc)`, borderRadius: 5, transition: "width 0.6s ease-out" }} />
      </div>
      <div style={{ width: 55, fontSize: 10, textAlign: "right", fontFamily: "monospace", color: "var(--text-muted)" }}>{formatTime(time)}</div>
    </div>
  );
}

function Badge({ label, delay, unlocked }: { label: string; delay: number; unlocked: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)", delay });
  }, [delay]);
  return (
    <div ref={ref} style={{
      padding: "6px 12px", borderRadius: 8,
      background: unlocked ? "rgba(251,191,36,0.15)" : "var(--bg-elevated)",
      border: `2px solid ${unlocked ? "var(--accent)" : "var(--border-light)"}`,
      opacity: 0, fontSize: 11, fontWeight: 700,
      color: unlocked ? "var(--text)" : "var(--text-faint)",
      textTransform: "uppercase", letterSpacing: 1,
      transition: "background 0.3s, color 0.3s, border-color 0.3s",
    }}>
      {label}
    </div>
  );
}

export default function EndScreen({ stats, onRestart }: EndScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showBadges, setShowBadges] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const totalTime = stats.endTime - stats.startTime;
  const maxClicks = Math.max(...stats.actClicks, 1);
  const totalInteractions = stats.actInteractions.reduce((a, b) => a + b, 0);
  const totalBeats = stats.actBeatCount.reduce((a, b) => a + b, 0);

  const captureScreenshot = useCallback(async () => {
    if (!shareCardRef.current || isCapturing) return;
    setIsCapturing(true);
    try {
      const canvas = await html2canvas(shareCardRef.current, { background: "#fdf6e3", scale: 2, useCORS: true, logging: false } as any);
      setScreenshotUrl(canvas.toDataURL("image/png"));
      setShowShareModal(true);
    } catch (err) { console.error("Screenshot failed:", err); }
    finally { setIsCapturing(false); }
  }, [isCapturing]);

  const shareText = `I completed DRIFT -- A Paper World\n\n${formatTime(totalTime)} | ${totalBeats} story beats | ${stats.secretsFound.length} secrets\n\nCan you find all the secrets? drift-paper.vercel.app`;

  const shareToWhatsApp = useCallback(() => { window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank", "noopener,noreferrer"); }, [shareText]);
  const shareToTwitter = useCallback(() => { window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent("https://drift-paper.vercel.app")}`, "_blank", "noopener,noreferrer"); }, [shareText]);
  const shareToFacebook = useCallback(() => { window.open(`https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(shareText)}&u=${encodeURIComponent("https://drift-paper.vercel.app")}`, "_blank", "noopener,noreferrer"); }, [shareText]);
  const downloadImage = useCallback(() => { if (!screenshotUrl) return; const l = document.createElement("a"); l.download = "drift-journey.png"; l.href = screenshotUrl; l.click(); }, [screenshotUrl]);
  const copyToClipboard = useCallback(async () => { try { await navigator.clipboard.writeText(shareText); } catch {} }, [shareText]);

  useEffect(() => {
    const tl = gsap.timeline();
    tl.to(containerRef.current, { opacity: 1, duration: 1.5, ease: "power2.inOut" })
      .call(() => setVisible(true))
      .call(() => setShowDetails(true), [], "+=0.8")
      .call(() => setShowBadges(true), [], "+=0.5");
    return () => { tl.kill(); };
  }, []);

  return (
    <div ref={containerRef} role="dialog" aria-modal="true" aria-label="Journey Complete" style={{
      position: "fixed", inset: 0, zIndex: 55,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg)", opacity: 0, fontFamily: "Georgia, serif",
      overflowY: "auto", overflowX: "hidden", transition: "background 0.3s",
    }}>
      {visible && (
        <div style={{ textAlign: "center", maxWidth: 600, width: "92%", padding: "40px 20px", position: "relative", zIndex: 10, maxHeight: "95vh", overflowY: "auto" }}>
          <div style={{ fontSize: 11, letterSpacing: 5, textTransform: "uppercase", fontWeight: 700, marginBottom: 10, color: "var(--text-muted)", opacity: 0 }}
            ref={el => { if (el) gsap.to(el, { opacity: 0.5, duration: 1, delay: 0.3 }); }}>Journey Complete</div>
          <div style={{ fontSize: 52, fontWeight: "bold", color: "var(--text)", letterSpacing: -3, marginBottom: 4, opacity: 0, transition: "color 0.3s" }}
            ref={el => { if (el) gsap.to(el, { opacity: 1, duration: 1, delay: 0.5 }); }}>DRIFT</div>
          <div style={{ fontSize: 16, color: "var(--text-muted)", fontStyle: "italic", marginBottom: 6, opacity: 0, transition: "color 0.3s" }}
            ref={el => { if (el) gsap.to(el, { opacity: 0.6, duration: 1, delay: 0.7 }); }}>A Paper World</div>
          <div style={{ width: 48, height: 2, background: "var(--text)", margin: "0 auto 20px", opacity: 0, transition: "background 0.3s" }}
            ref={el => { if (el) gsap.to(el, { opacity: 0.25, duration: 1, delay: 0.9 }); }} />
          <div style={{ fontSize: 15, lineHeight: 1.7, fontStyle: "italic", maxWidth: 380, margin: "0 auto 28px", opacity: 0, color: "var(--text-muted)" }}
            ref={el => { if (el) gsap.to(el, { opacity: 0.7, duration: 1, delay: 1.1 }); }}>&ldquo;Every fold was a choice. Every choice was the wind.&rdquo;</div>

          {showDetails && (
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 24 }}>
              <StatBlock value={formatTime(totalTime)} label="Time" delay={0} />
              <StatBlock value={String(totalBeats)} label="Beats" delay={0.1} />
              <StatBlock value={String(stats.secretsFound.length)} label="Secrets" delay={0.2} />
              <StatBlock value={String(totalInteractions)} label="Interactions" delay={0.3} />
            </div>
          )}

          {showDetails && (
            <div style={{ ...card, borderRadius: 14, padding: "16px 20px", marginBottom: 20, boxShadow: "3px 3px 0 var(--shadow)", textAlign: "left" }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>Act Breakdown</div>
              {Array.from({ length: 8 }).map((_, i) => (
                <ActBar key={i} act={i} clicks={stats.actClicks[i]} time={stats.actTimes[i]} maxClicks={maxClicks} delay={0.4 + i * 0.08} />
              ))}
            </div>
          )}

          {showDetails && (
            <div style={{ ...card, borderRadius: 14, padding: "16px 20px", marginBottom: 20, boxShadow: "3px 3px 0 var(--shadow)", textAlign: "left" }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>Activities</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
                {[
                  { label: "Clicks", val: stats.totalClicks },
                  { label: "Keys Typed", val: stats.totalKeys },
                  { label: "Cursor Distance", val: `${Math.round(stats.totalMouseMoveDistance)}m` },
                  { label: "Jumps", val: stats.jumpsMade },
                  { label: "Leaves Collected", val: stats.leavesCollected },
                  { label: "Wind Generated", val: stats.windGenerated },
                  { label: "Butterflies", val: stats.butterfliesFollowed },
                  { label: "Cranes Released", val: stats.cranesReleased },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "monospace" }}>{item.val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showBadges && (
            <div style={{ ...card, borderRadius: 14, padding: "16px 20px", marginBottom: 20, boxShadow: "3px 3px 0 var(--shadow)", textAlign: "left" }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>Badges</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Badge label="First Fold" delay={0} unlocked={stats.jumpsMade > 0} />
                <Badge label="Storm Rider" delay={0.05} unlocked={stats.windGenerated > 10} />
                <Badge label="Leaf Collector" delay={0.1} unlocked={stats.leavesCollected >= 8} />
                <Badge label="Cell Master" delay={0.15} unlocked={stats.cellsToggled >= 10} />
                <Badge label="Rowing Pro" delay={0.2} unlocked={stats.boatStrokes >= 20} />
                <Badge label="Butterfly Chaser" delay={0.25} unlocked={stats.butterfliesFollowed >= 25} />
                <Badge label="Celebration" delay={0.3} unlocked={stats.cranesReleased >= 15} />
                <Badge label="Secret Keeper" delay={0.35} unlocked={stats.secretsFound.length > 0} />
                <Badge label="Full Journey" delay={0.4} unlocked={totalBeats >= 30} />
              </div>
            </div>
          )}

          {stats.secretsFound.length > 0 && showDetails && (
            <div style={{ background: "rgba(251,191,36,0.1)", border: "2px solid var(--accent)", borderRadius: 12, padding: "14px 18px", marginBottom: 24, textAlign: "left", transition: "border-color 0.3s" }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>Secret Words Discovered</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {Array.from(new Set(stats.secretsFound)).map((word, i) => (
                  <span key={i} style={{ background: "var(--text)", color: "var(--accent)", borderRadius: 6, padding: "4px 12px", fontSize: 12, fontFamily: "monospace", fontWeight: 700, transition: "background 0.3s, color 0.3s" }}>{word}</span>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", opacity: 0 }}
            ref={el => { if (el) gsap.to(el, { opacity: 1, duration: 0.8, delay: 2.2 }); }}>
            <button onClick={onRestart} style={{
              background: "var(--text)", color: "var(--bg)", border: "none", borderRadius: 10,
              padding: "14px 36px", fontSize: 14, fontFamily: "Georgia, serif", cursor: "pointer",
              boxShadow: "3px 3px 0 var(--shadow)", fontWeight: 700, transition: "transform 0.15s, box-shadow 0.15s, background 0.3s, color 0.3s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translate(-1px,-1px)"; e.currentTarget.style.boxShadow = "4px 4px 0 var(--shadow)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translate(0,0)"; e.currentTarget.style.boxShadow = "3px 3px 0 var(--shadow)"; }}
            >Play Again</button>
            <button onClick={captureScreenshot} disabled={isCapturing} style={{
              ...card, borderRadius: 10, padding: "12px 28px", fontSize: 14, fontFamily: "Georgia, serif",
              cursor: isCapturing ? "wait" : "pointer", boxShadow: "3px 3px 0 var(--shadow)", fontWeight: 700,
              opacity: isCapturing ? 0.6 : 1, background: "var(--accent)", color: "#1a1a2e",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
              onMouseEnter={e => { if (!isCapturing) { e.currentTarget.style.transform = "translate(-1px,-1px)"; e.currentTarget.style.boxShadow = "4px 4px 0 var(--shadow)"; }}}
              onMouseLeave={e => { e.currentTarget.style.transform = "translate(0,0)"; e.currentTarget.style.boxShadow = "3px 3px 0 var(--shadow)"; }}
            >{isCapturing ? "Capturing..." : "Share Journey"}</button>
            <a href="/about" style={{
              ...card, borderRadius: 10, padding: "12px 28px", fontSize: 14, fontFamily: "Georgia, serif",
              cursor: "pointer", boxShadow: "3px 3px 0 var(--shadow)", fontWeight: 700, textDecoration: "none",
              transition: "transform 0.15s, box-shadow 0.15s, background 0.3s, color 0.3s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translate(-1px,-1px)"; e.currentTarget.style.boxShadow = "4px 4px 0 var(--shadow)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translate(0,0)"; e.currentTarget.style.boxShadow = "3px 3px 0 var(--shadow)"; }}
            >About</a>
          </div>

          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 24, opacity: 0 }}
            ref={el => { if (el) gsap.to(el, { opacity: 0.3, duration: 1, delay: 2.8 }); }}>Thank you for experiencing DRIFT.</div>

          <div ref={shareCardRef} aria-hidden="true" style={{ position: "fixed", left: "-9999px", top: 0, width: 500, padding: "32px 28px", background: "#fdf6e3", fontFamily: "Georgia, serif", color: "#1a1a2e", border: "2px solid #1a1a2e", borderRadius: 16 }}>
            <div style={{ fontSize: 28, fontWeight: "bold", letterSpacing: -2, marginBottom: 4 }}>DRIFT</div>
            <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 20 }}>A Paper World -- Journey Complete</div>
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 90, padding: "12px 14px", background: "#fff", borderRadius: 10, border: "2px solid #1a1a2e", textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: "bold", fontFamily: "monospace" }}>{formatTime(totalTime)}</div>
                <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700, opacity: 0.6 }}>Time</div>
              </div>
              <div style={{ flex: 1, minWidth: 90, padding: "12px 14px", background: "#fff", borderRadius: 10, border: "2px solid #1a1a2e", textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: "bold", fontFamily: "monospace" }}>{totalBeats}</div>
                <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700, opacity: 0.6 }}>Beats</div>
              </div>
              <div style={{ flex: 1, minWidth: 90, padding: "12px 14px", background: "#fff", borderRadius: 10, border: "2px solid #1a1a2e", textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: "bold", fontFamily: "monospace" }}>{stats.secretsFound.length}</div>
                <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700, opacity: 0.6 }}>Secrets</div>
              </div>
            </div>
            <div style={{ fontSize: 11, opacity: 0.5, textAlign: "center" }}>drift-paper.vercel.app</div>
          </div>

          {showShareModal && (
            <div onClick={() => setShowShareModal(false)} style={{
              position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)",
            }}>
              <div onClick={e => e.stopPropagation()} style={{
                ...card, borderRadius: 16, padding: "28px 32px", boxShadow: "6px 6px 0 var(--shadow)",
                maxWidth: 420, width: "92%", position: "relative",
              }}>
                <button onClick={() => setShowShareModal(false)} style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", fontSize: 16, cursor: "pointer", color: "var(--text-muted)", padding: 4 }}>x</button>
                <div style={{ fontSize: 20, fontWeight: "bold", letterSpacing: -1, marginBottom: 4 }}>Share Your Journey</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", opacity: 0.4, marginBottom: 16 }}>Show the world your paper adventure</div>
                {screenshotUrl && (
                  <div style={{ marginBottom: 16, borderRadius: 10, overflow: "hidden", border: "2px solid var(--border)" }}>
                    <img src={screenshotUrl} alt="Journey" style={{ width: "100%", display: "block" }} />
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                  <button onClick={shareToWhatsApp} style={{ background: "#25D366", color: "#fff", border: "2px solid var(--border)", borderRadius: 10, padding: "10px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: "2px 2px 0 var(--shadow)" }}>WhatsApp</button>
                  <button onClick={shareToTwitter} style={{ background: "#1DA1F2", color: "#fff", border: "2px solid var(--border)", borderRadius: 10, padding: "10px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: "2px 2px 0 var(--shadow)" }}>Twitter / X</button>
                  <button onClick={shareToFacebook} style={{ background: "#4267B2", color: "#fff", border: "2px solid var(--border)", borderRadius: 10, padding: "10px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: "2px 2px 0 var(--shadow)" }}>Facebook</button>
                  <button onClick={copyToClipboard} style={{ background: "var(--text)", color: "var(--bg)", border: "2px solid var(--border)", borderRadius: 10, padding: "10px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: "2px 2px 0 var(--shadow)", transition: "background 0.3s, color 0.3s" }}>Copy Text</button>
                </div>
                <button onClick={downloadImage} style={{ width: "100%", background: "var(--bg-card)", color: "var(--text)", border: "2px solid var(--border)", borderRadius: 10, padding: "10px 0", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: "2px 2px 0 var(--shadow)", transition: "background 0.3s, color 0.3s" }}>Download Screenshot</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
