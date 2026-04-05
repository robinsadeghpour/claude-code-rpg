import { useGameStore } from "../store/game-store";

const AREA_NAMES: Record<string, string> = {
  "village-square": "Village Square",
  forge: "The Forge",
  library: "The Library",
};

export function HUD() {
  const { currentArea, isDialogueOpen, inWorld } = useGameStore();
  const areaName = AREA_NAMES[currentArea] ?? currentArea;

  if (!inWorld) return null;

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
      }}
    >
      <div style={{ color: "#FFF8E7", fontSize: 11, marginBottom: 6, textShadow: "1px 1px 0 #000" }}>
        {areaName}
      </div>
      {!isDialogueOpen && (
        <div style={{ color: "#7A7A7A", fontSize: 9, textShadow: "1px 1px 0 #000" }}>
          WASD to move · E to interact
        </div>
      )}
    </div>
  );
}
