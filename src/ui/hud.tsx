import { useGameStore } from "../store/game-store";
import { getActiveQuest } from "../game/systems/quest";

const AREA_NAMES: Record<string, string> = {
  "village-square": "Village Square",
  forge: "The Forge",
  library: "The Library",
};

export function HUD() {
  const { currentArea, isDialogueOpen, inWorld, questStates } = useGameStore();
  const areaName = AREA_NAMES[currentArea] ?? currentArea;

  if (!inWorld) return null;

  // Re-derive active quest when questStates change (the subscription triggers re-render)
  const activeQuest = getActiveQuest();
  const activeState = activeQuest ? (questStates[activeQuest.id] ?? activeQuest.state) : null;
  const showHint = activeQuest && (activeState === "active" || activeState === "available");

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
    </div>
  );
}
