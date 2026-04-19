import { useState } from "react";
import { useGameStore } from "../store/game-store";
import { quests } from "../game/loader";
import type { QuestData, QuestState } from "../store/types";

const STATUS_ICON: Record<QuestState, string> = {
  completed: "\u2713",
  active: "\u25CF",
  available: "\u25CB",
  locked: "\u25CB",
};

const STATUS_COLOR: Record<QuestState, string> = {
  completed: "#88D4B0",
  active: "#FFE066",
  available: "#C4A8D8",
  locked: "#7A7A7A",
};

const STATUS_LABEL: Record<QuestState, string> = {
  completed: "Complete",
  active: "In Progress",
  available: "Available",
  locked: "Locked",
};

// Pixel font for headings/labels only
const PIXEL = '"Press Start 2P", monospace';
// Readable monospace for body text
const BODY = '"IBM Plex Mono", "SF Mono", "Fira Code", "Cascadia Code", monospace';

function QuestDetailModal({
  quest,
  state,
  onClose,
}: {
  quest: QuestData;
  state: QuestState;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const isActive = state === "active" || state === "available";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.7)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 440,
          maxHeight: "80vh",
          overflowY: "auto",
          background: "#12122a",
          border: "2px solid #C4A8D8",
          borderRadius: 6,
          padding: "28px 32px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#FFF8E7", fontSize: 15, lineHeight: 1.4, fontFamily: PIXEL, textShadow: "1px 1px 0 #000" }}>
              {quest.title}
            </div>
            <div style={{ color: STATUS_COLOR[state], fontSize: 11, marginTop: 8, fontFamily: BODY }}>
              {STATUS_ICON[state]} {STATUS_LABEL[state]}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#7A7A7A",
              fontSize: 18,
              cursor: "pointer",
              padding: "0 4px",
              lineHeight: 1,
              fontFamily: BODY,
            }}
          >
            x
          </button>
        </div>

        {/* Description */}
        <div style={{
          color: "#c0c0c0",
          fontSize: 13,
          lineHeight: 1.7,
          marginBottom: 24,
          fontFamily: BODY,
        }}>
          {quest.description}
        </div>

        {/* HUD hints for active quests */}
        {isActive && quest.hudHints && (
          <div style={{
            background: "rgba(255, 224, 102, 0.06)",
            border: "1px solid rgba(255, 224, 102, 0.2)",
            borderRadius: 5,
            padding: "18px 20px",
          }}>
            <div style={{ color: "#FFE066", fontSize: 10, marginBottom: 14, fontFamily: PIXEL, textShadow: "1px 1px 0 #000" }}>
              What to do
            </div>
            <div style={{ color: "#e0e0e0", fontSize: 13, lineHeight: 1.7, marginBottom: 14, fontFamily: BODY, whiteSpace: "pre-line" }}>
              {quest.hudHints.instruction}
            </div>
            <div style={{ color: "#9090a0", fontSize: 12, lineHeight: 1.7, marginBottom: 18, fontFamily: BODY }}>
              {quest.hudHints.detail}
            </div>

            {/* Copyable command */}
            <button
              onClick={() => handleCopy(quest.hudHints!.copyable)}
              style={{
                display: "block",
                width: "100%",
                background: "rgba(255, 224, 102, 0.1)",
                border: "1px solid rgba(255, 224, 102, 0.3)",
                color: "#FFE066",
                fontFamily: BODY,
                fontSize: 13,
                padding: "10px 14px",
                cursor: "pointer",
                borderRadius: 4,
                textAlign: "left",
              }}
            >
              {copied ? "Copied!" : quest.hudHints.copyable}
            </button>
          </div>
        )}

        {state === "completed" && (
          <div style={{
            color: "#88D4B0",
            fontSize: 12,
            padding: "14px 0",
            fontFamily: BODY,
          }}>
            {"\u2713"} Quest complete
          </div>
        )}
      </div>
    </div>
  );
}

export function QuestJournal() {
  const [open, setOpen] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<QuestData | null>(null);
  const { questStates, inWorld } = useGameStore();

  if (!inWorld) return null;

  const visibleQuests = Object.values(quests).filter(
    (q) => (questStates[q.id] ?? q.state) !== "locked",
  );

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 900,
          background: "#1a1a2e",
          border: "2px solid #FFE066",
          color: "#FFE066",
          fontFamily: PIXEL,
          fontSize: 9,
          padding: "8px 12px",
          cursor: "pointer",
          textShadow: "1px 1px 0 #000",
          borderRadius: 4,
        }}
      >
        Journal
      </button>

      {/* Quest list panel */}
      {open && (
        <div
          style={{
            position: "fixed",
            top: 52,
            right: 16,
            width: 240,
            background: "rgba(18, 18, 36, 0.95)",
            border: "2px solid #C4A8D8",
            boxShadow: "inset 0 0 0 1px rgba(255,248,231,0.2)",
            zIndex: 900,
            padding: "14px 16px",
            borderRadius: 5,
          }}
        >
          <div style={{ color: "#C4A8D8", fontSize: 12, marginBottom: 12, fontFamily: PIXEL, textShadow: "1px 1px 0 #000" }}>
            Quests
          </div>
          {visibleQuests.length === 0 ? (
            <div style={{ color: "#7A7A7A", fontSize: 12, fontFamily: BODY }}>
              Talk to the villagers.
            </div>
          ) : (
            visibleQuests.map((quest) => {
              const state = questStates[quest.id] ?? quest.state;
              return (
                <button
                  key={quest.id}
                  onClick={() => setSelectedQuest(quest)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    background: "none",
                    border: "none",
                    padding: "8px 4px",
                    cursor: "pointer",
                    borderBottom: "1px solid rgba(255,248,231,0.1)",
                    textAlign: "left",
                  }}
                >
                  <span style={{ color: STATUS_COLOR[state], fontSize: 12, flexShrink: 0, fontFamily: BODY }}>
                    {STATUS_ICON[state]}
                  </span>
                  <span style={{
                    color: state === "completed" ? "#7A7A7A" : "#e0e0e0",
                    fontSize: 12,
                    fontFamily: BODY,
                    lineHeight: 1.5,
                  }}>
                    {quest.title}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}

      {/* Detail modal */}
      {selectedQuest && (
        <QuestDetailModal
          quest={selectedQuest}
          state={questStates[selectedQuest.id] ?? selectedQuest.state}
          onClose={() => setSelectedQuest(null)}
        />
      )}
    </>
  );
}
