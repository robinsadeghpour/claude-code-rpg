import { useEffect, useState } from "react";
import { useGameStore } from "../store/game-store";
import { getActiveQuest } from "../game/systems/quest";

const AREA_NAMES: Record<string, string> = {
  "village-square": "Village Square",
  forge: "The Forge",
  library: "The Library",
};

export function HUD() {
  const {
    currentArea,
    isDialogueOpen,
    inWorld,
    questStates,
    lastForgedApprentice,
    summonCooldownUntil,
  } = useGameStore();
  const [, setTick] = useState(0);

  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  const cooldownLeft = Math.max(0, summonCooldownUntil - now);

  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const id = setInterval(() => setTick((t) => t + 1), 200);
    return () => clearInterval(id);
  }, [cooldownLeft]);

  if (!inWorld) return null;

  const areaName = AREA_NAMES[currentArea] ?? currentArea;
  const activeQuest = getActiveQuest();
  const activeState = activeQuest ? (questStates[activeQuest.id] ?? activeQuest.state) : null;
  const showHint = activeQuest && (activeState === "active" || activeState === "available");
  const canSummon = !!lastForgedApprentice && cooldownLeft === 0;

  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        left: 16,
        zIndex: 800,
        fontFamily: '"Press Start 2P", monospace',
        background: "rgba(0,0,0,0.5)",
        padding: "10px 12px",
        borderRadius: 5,
        maxWidth: 260,
      }}
    >
      <div style={{ color: "#FFF8E7", fontSize: 11, marginBottom: 6, textShadow: "1px 1px 0 #000" }}>
        {areaName}
      </div>
      {showHint && (
        <div style={{ color: "#FFE066", fontSize: 8, lineHeight: 1.5, marginBottom: 6, textShadow: "1px 1px 0 #000" }}>
          {activeQuest.hudHints?.objective ?? activeQuest.title}
        </div>
      )}
      {!isDialogueOpen && (
        <div style={{ color: "#7A7A7A", fontSize: 9, textShadow: "1px 1px 0 #000" }}>
          WASD to move · E to interact
        </div>
      )}
      {lastForgedApprentice && !isDialogueOpen && (
        <div
          style={{
            marginTop: 6,
            color: canSummon ? "#88D4B0" : "#7A7A7A",
            fontSize: 8,
            textShadow: "1px 1px 0 #000",
          }}
        >
          {canSummon
            ? `F · summon ${lastForgedApprentice}`
            : `F · cooling… ${(cooldownLeft / 1000).toFixed(1)}s`}
        </div>
      )}
    </div>
  );
}
