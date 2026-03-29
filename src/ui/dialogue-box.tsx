import { useEffect } from "react";
import { useGameStore } from "../store/game-store";

export function DialogueBox() {
  const { isDialogueOpen, currentDialogue, dialogueIndex, advanceDialogue } =
    useGameStore();

  useEffect(() => {
    if (!isDialogueOpen) return;
    const handler = () => advanceDialogue();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isDialogueOpen, advanceDialogue]);

  if (!isDialogueOpen || !currentDialogue) return null;

  const line = currentDialogue[dialogueIndex];
  const isLast = dialogueIndex === currentDialogue.length - 1;

  return (
    <div
      onClick={advanceDialogue}
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        maxWidth: 700,
        width: "calc(100% - 48px)",
        background: "#1a1a2e",
        border: "3px solid #FFE066",
        padding: 16,
        zIndex: 1000,
        cursor: "pointer",
        fontFamily: '"Press Start 2P", monospace',
      }}
    >
      <div
        style={{
          color: "#FFE066",
          fontSize: 10,
          marginBottom: 10,
        }}
      >
        {line.speaker}
      </div>
      <div
        style={{
          color: "#e0e0e0",
          fontSize: 11,
          lineHeight: 1.8,
          marginBottom: 12,
        }}
      >
        {line.text}
      </div>
      <div
        style={{
          color: "#7A7A7A",
          fontSize: 8,
          textAlign: "right",
        }}
      >
        {isLast ? "▼ Close" : "▼ Continue"}
      </div>
    </div>
  );
}
