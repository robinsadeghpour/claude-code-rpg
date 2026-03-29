import { useGameStore } from "../store/game-store";

const AREA_NAMES: Record<string, string> = {
  "village-square": "Village Square",
  forge: "The Forge",
  library: "The Library",
};

export function HUD() {
  const { currentArea, isDialogueOpen } = useGameStore();
  const areaName = AREA_NAMES[currentArea] ?? currentArea;

  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        left: 16,
        zIndex: 800,
        fontFamily: '"Press Start 2P", monospace',
      }}
    >
      <div style={{ color: "#FFF8E7", fontSize: 9, opacity: 0.8, marginBottom: 6 }}>
        {areaName}
      </div>
      {!isDialogueOpen && (
        <div style={{ color: "#7A7A7A", fontSize: 7 }}>
          WASD to move · E to interact
        </div>
      )}
    </div>
  );
}
