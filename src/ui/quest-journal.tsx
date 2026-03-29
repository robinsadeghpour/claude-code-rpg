import { useState } from "react";
import { useGameStore } from "../store/game-store";
import { quests } from "../game/loader";
import type { QuestState } from "../store/types";

const STATUS_ICON: Record<QuestState, string> = {
  completed: "✓",
  active: "●",
  available: "○",
  locked: "○",
};

const STATUS_COLOR: Record<QuestState, string> = {
  completed: "#88D4B0",
  active: "#FFE066",
  available: "#7A7A7A",
  locked: "#7A7A7A",
};

export function QuestJournal() {
  const [open, setOpen] = useState(false);
  const { questStates } = useGameStore();

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
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 9,
          padding: "8px 12px",
          cursor: "pointer",
        }}
      >
        Journal
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            top: 52,
            right: 16,
            width: 280,
            background: "#1a1a2e",
            border: "2px solid #C4A8D8",
            zIndex: 900,
            padding: 12,
            fontFamily: '"Press Start 2P", monospace',
            maxHeight: "calc(100vh - 80px)",
            overflowY: "auto",
          }}
        >
          <div
            style={{ color: "#C4A8D8", fontSize: 9, marginBottom: 12 }}
          >
            Quest Journal
          </div>
          {visibleQuests.length === 0 ? (
            <div style={{ color: "#7A7A7A", fontSize: 7 }}>
              No quests yet.
            </div>
          ) : (
            visibleQuests.map((quest) => {
              const state = questStates[quest.id] ?? quest.state;
              return (
                <div
                  key={quest.id}
                  style={{ marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid #2a2a4e" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ color: STATUS_COLOR[state], fontSize: 10 }}>
                      {STATUS_ICON[state]}
                    </span>
                    <span style={{ color: "#e0e0e0", fontSize: 9 }}>
                      {quest.title}
                    </span>
                  </div>
                  <div style={{ color: "#7A7A7A", fontSize: 7, lineHeight: 1.6, paddingLeft: 18 }}>
                    {quest.description}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </>
  );
}
