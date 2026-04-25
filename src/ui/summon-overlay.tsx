import { useEffect, useState } from "react";
import { useGameStore } from "../store/game-store";
import { getArchetype } from "../game/systems/skill-serializer";
import { postPlacementIntent } from "../game/systems/summon";

const palette = {
  cream: "#FFF8E7",
  sage: "#C5D5A5",
  gold: "#FFE066",
  ink: "#1a1a2e",
  shell: "#0a0a18",
  ok: "#88D4B0",
  danger: "#FF3355",
};

const mono = '"Press Start 2P", monospace';

export function SummonOverlay() {
  const invoke = useGameStore((s) => s.activeInvoke);
  const setPhase = useGameStore((s) => s.setInvokePhase);
  const clear = useGameStore((s) => s.clearInvoke);
  const lastEvent = useGameStore((s) => s.worldState.lastEvent);
  const [copied, setCopied] = useState(false);

  // Auto-dismiss when the build event fires (lastEvent ends with "-built" and matches our buildingId)
  useEffect(() => {
    if (!invoke || invoke.phase !== "waiting" || !lastEvent) return;
    if (lastEvent === `${invoke.buildingId}-built`) {
      clear();
    }
  }, [lastEvent, invoke, clear]);

  // Hard timeout for the "waiting" phase (90s)
  useEffect(() => {
    if (!invoke || invoke.phase !== "waiting") return;
    const t = setTimeout(() => clear(), 90_000);
    return () => clearTimeout(t);
  }, [invoke, clear]);

  if (!invoke) return null;
  const archetype = getArchetype(invoke.archetypeId);
  if (!archetype) return null;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(invoke.command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  const onPlace = async () => {
    setPhase("waiting");
    const ok = await postPlacementIntent({
      skillName: invoke.skillName,
      kind: invoke.kind,
      position: invoke.position,
      buildingId: invoke.buildingId,
    });
    if (!ok) {
      setPhase("error", "Couldn't write placement-intent.json. Is the dev server running?");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10,10,24,0.86)",
        zIndex: 1700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        fontFamily: mono,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 580,
          background: palette.shell,
          border: `3px solid ${archetype.accentColor}`,
          boxShadow: `0 0 36px ${archetype.accentColor}55`,
          padding: "20px 24px 22px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ color: palette.gold, fontSize: 11, letterSpacing: 1 }}>RUN YOUR SKILL</div>
          <button
            onClick={clear}
            style={{
              fontFamily: mono,
              fontSize: 8,
              background: "transparent",
              color: palette.sage,
              border: `1px solid ${palette.sage}`,
              padding: "6px 10px",
              cursor: "pointer",
            }}
          >
            × ESC
          </button>
        </div>

        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
          <div
            style={{
              width: 56,
              height: 56,
              background: archetype.clothColor,
              border: `2px solid ${archetype.accentColor}`,
              color: archetype.accentColor,
              fontSize: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "serif",
              flexShrink: 0,
            }}
          >
            {archetype.glyph}
          </div>
          <div>
            <div style={{ color: palette.cream, fontSize: 11, marginBottom: 6 }}>{invoke.skillName}</div>
            <div style={{ color: palette.sage, fontSize: 8, lineHeight: 1.6 }}>
              Will place a <span style={{ color: palette.gold }}>{invoke.kind}</span>{" "}
              at <span style={{ color: palette.gold }}>({Math.round(invoke.position[0])}, {Math.round(invoke.position[1])})</span>.
            </div>
          </div>
        </div>

        <div style={{ color: palette.sage, fontSize: 8, lineHeight: 1.7, marginBottom: 8 }}>
          1. Copy this line.
          <br />
          2. Paste it into your Claude Code terminal in this repo.
          <br />
          3. Click PLACE — Claude will run your skill and the building will appear.
        </div>

        <div
          onClick={onCopy}
          style={{
            background: "rgba(255,224,102,0.08)",
            border: `2px dashed ${palette.gold}`,
            padding: "12px 14px",
            color: palette.cream,
            fontSize: 10,
            lineHeight: 1.5,
            marginBottom: 12,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
          title="Click to copy"
        >
          <span style={{ flex: 1, wordBreak: "break-word" }}>{invoke.command}</span>
          <span style={{ fontSize: 7, color: copied ? palette.ok : palette.gold, minWidth: 60, textAlign: "right" }}>
            {copied ? "COPIED" : "▣ COPY"}
          </span>
        </div>

        {invoke.phase === "ready" && (
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              onClick={clear}
              style={{
                fontFamily: mono,
                fontSize: 9,
                padding: "8px 14px",
                background: "transparent",
                color: palette.cream,
                border: `2px solid ${palette.cream}`,
                cursor: "pointer",
              }}
            >
              CANCEL
            </button>
            <button
              onClick={onPlace}
              style={{
                fontFamily: mono,
                fontSize: 10,
                padding: "10px 18px",
                background: palette.gold,
                color: palette.ink,
                border: "none",
                cursor: "pointer",
              }}
            >
              ▸ PLACE HERE
            </button>
          </div>
        )}

        {invoke.phase === "waiting" && (
          <div
            style={{
              padding: "10px 12px",
              borderLeft: `3px solid ${palette.ok}`,
              background: "rgba(136,212,176,0.06)",
              color: palette.cream,
              fontSize: 8,
              lineHeight: 1.7,
            }}
          >
            <div style={{ color: palette.ok, marginBottom: 4 }}>WAITING FOR CLAUDE…</div>
            Paste the command into your Claude Code terminal now. The building will appear when your skill finishes.
          </div>
        )}

        {invoke.phase === "error" && (
          <div
            style={{
              padding: "10px 12px",
              borderLeft: `3px solid ${palette.danger}`,
              background: "rgba(255,51,85,0.08)",
              color: palette.cream,
              fontSize: 8,
              lineHeight: 1.7,
            }}
          >
            <div style={{ color: palette.danger, marginBottom: 4 }}>SOMETHING BROKE</div>
            {invoke.errorMessage ?? "Unknown error."}
          </div>
        )}
      </div>
    </div>
  );
}
