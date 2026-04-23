import { useEffect, useState } from "react";
import { useGameStore } from "../store/game-store";
import { getArchetype } from "../game/systems/skill-serializer";
import { SUMMON_DURATION_MS } from "../game/systems/summon";

type Phase = "arrive" | "act" | "fade" | "done";

export function SummonOverlay() {
  const summon = useGameStore((s) => s.activeSummon);
  const clear = useGameStore((s) => s.clearSummon);
  const [phase, setPhase] = useState<Phase>("arrive");

  useEffect(() => {
    if (!summon) return;
    setPhase("arrive");
    const t1 = setTimeout(() => setPhase("act"), 400);
    const t2 = setTimeout(() => setPhase("fade"), SUMMON_DURATION_MS - 500);
    const t3 = setTimeout(() => {
      setPhase("done");
      clear();
    }, SUMMON_DURATION_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [summon, clear]);

  if (!summon) return null;
  const archetype = getArchetype(summon.archetypeId);
  if (!archetype) return null;

  const opacity =
    phase === "arrive" ? 0 :
    phase === "fade" ? 0 :
    phase === "done" ? 0 :
    1;
  const scale =
    phase === "arrive" ? 0.6 :
    phase === "fade" ? 1.2 :
    phase === "done" ? 1.4 :
    1;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1800,
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: '"Press Start 2P", monospace',
      }}
    >
      {/* Visual flourish per archetype */}
      {summon.visual === "sparkle" && <SparkleBurst color={archetype.accentColor} phase={phase} />}
      {summon.visual === "spark" && <AnvilSpark color={archetype.accentColor} phase={phase} />}
      {summon.visual === "scroll" && <ScrollWhisper color={archetype.accentColor} />}

      <div
        style={{
          textAlign: "center",
          transition: "opacity 0.4s ease, transform 0.4s ease",
          opacity,
          transform: `scale(${scale})`,
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            margin: "0 auto 16px",
            background: archetype.clothColor,
            border: `3px solid ${archetype.accentColor}`,
            color: archetype.accentColor,
            fontSize: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "serif",
            boxShadow: `0 0 36px ${archetype.accentColor}88`,
          }}
        >
          {archetype.glyph}
        </div>
        <div style={{ color: "#FFE066", fontSize: 10, marginBottom: 10, letterSpacing: 1 }}>
          {summon.label.toUpperCase()}
        </div>
        <div
          style={{
            color: "#FFF8E7",
            fontSize: 10,
            lineHeight: 1.8,
            maxWidth: 520,
            margin: "0 auto",
            padding: "12px 18px",
            background: "rgba(10,10,24,0.85)",
            border: `2px solid ${archetype.accentColor}`,
          }}
        >
          {summon.flavor}
        </div>
      </div>
    </div>
  );
}

function SparkleBurst({ color, phase }: { color: string; phase: Phase }) {
  const active = phase === "arrive" || phase === "act";
  const count = 16;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const dist = active ? 220 : 40;
        const x = Math.cos(angle) * dist;
        const y = Math.sin(angle) * dist;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 8,
              height: 8,
              background: color,
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
              transition: "all 0.9s cubic-bezier(0.22, 1, 0.36, 1)",
              opacity: active ? 1 : 0,
              borderRadius: 2,
              boxShadow: `0 0 8px ${color}`,
            }}
          />
        );
      })}
    </div>
  );
}

function AnvilSpark({ color, phase }: { color: string; phase: Phase }) {
  const active = phase === "act";
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width: 260,
        height: 260,
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
      }}
    >
      {Array.from({ length: 10 }).map((_, i) => {
        const angle = (-90 + (i - 5) * 12) * (Math.PI / 180);
        const dist = active ? 130 : 20;
        const x = Math.cos(angle) * dist;
        const y = Math.sin(angle) * dist;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 4,
              height: 12,
              background: color,
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${(angle * 180) / Math.PI + 90}deg)`,
              transition: "all 0.6s ease-out",
              opacity: active ? 0.9 : 0,
            }}
          />
        );
      })}
    </div>
  );
}

function ScrollWhisper({ color }: { color: string }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: 520,
          height: 240,
          background: `radial-gradient(ellipse at center, ${color}44 0%, transparent 70%)`,
          filter: "blur(20px)",
        }}
      />
    </div>
  );
}
