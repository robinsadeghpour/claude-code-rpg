import { useGameStore } from "../store/game-store";
import { getActiveQuest } from "../game/systems/quest";

const AREA_NAMES: Record<string, string> = {
  "village-square": "Village Square",
  forge: "The Forge",
  library: "The Library",
};

const PIXEL = '"Press Start 2P", monospace';

export function HUD() {
  const {
    currentArea,
    isDialogueOpen,
    isHealing,
    isLoomOpen,
    isBookshelfOpen,
    isEditorOpen,
    inWorld,
    questStates,
    lastForgedApprentice,
    activeInvoke,
    hasUsedForgedSkill,
  } = useGameStore();

  if (!inWorld) return null;

  const areaName = AREA_NAMES[currentArea] ?? currentArea;
  const activeQuest = getActiveQuest();
  const activeState = activeQuest ? (questStates[activeQuest.id] ?? activeQuest.state) : null;
  const showHint = activeQuest && (activeState === "active" || activeState === "available");
  const overlayOpen = isDialogueOpen || isHealing || isLoomOpen || isBookshelfOpen || isEditorOpen;
  const showFBanner = !!lastForgedApprentice && !hasUsedForgedSkill && !overlayOpen && !activeInvoke;

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 16,
          left: 16,
          zIndex: 800,
          fontFamily: PIXEL,
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

      {showFBanner && (
        <div
          style={{
            position: "fixed",
            top: 18,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 850,
            fontFamily: PIXEL,
            background: "linear-gradient(180deg, #FFE066 0%, #FFC93C 100%)",
            color: "#1a1a2e",
            padding: "12px 22px",
            border: "3px solid #1a1a2e",
            borderRadius: 6,
            boxShadow: "0 6px 20px rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            gap: 14,
            animation: "fBannerPulse 1.4s ease-in-out infinite",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              border: "3px solid #1a1a2e",
              background: "#FFF8E7",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              boxShadow: "inset 0 -3px 0 rgba(0,0,0,0.25)",
            }}
          >
            F
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 11, lineHeight: 1.2 }}>Press F to place</div>
            <div style={{ fontSize: 8, lineHeight: 1.2, color: "#3a2a0a" }}>
              your skill: {lastForgedApprentice}
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes fBannerPulse { 0%, 100% { transform: translate(-50%, 0) scale(1); } 50% { transform: translate(-50%, 2px) scale(1.02); } }`}</style>
    </>
  );
}
