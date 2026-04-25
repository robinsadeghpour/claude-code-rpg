import { useEffect, useRef } from "react";
import { initGame } from "./game/init";
import { DialogueBox } from "./ui/dialogue-box";
import { HealOverlay } from "./ui/heal-overlay";
import { QuestJournal } from "./ui/quest-journal";
import { HUD } from "./ui/hud";
import { Bookshelf } from "./ui/bookshelf";
import { SkillEditor } from "./ui/skill-editor";
import { LoomOverlay } from "./ui/loom/loom";
import { SummonOverlay } from "./ui/summon-overlay";
import { useGameStore } from "./store/game-store";

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const game = initGame(canvasRef.current);
    return () => game.quit();
  }, []);

  // Refocus canvas when dialogue/bookshelf/loom closes so keyboard input resumes immediately
  useEffect(() => {
    const unsub = useGameStore.subscribe((state, prev) => {
      const wasOpen = prev.isDialogueOpen || prev.isBookshelfOpen || prev.isLoomOpen;
      const isOpen = state.isDialogueOpen || state.isBookshelfOpen || state.isLoomOpen;
      if (wasOpen && !isOpen) canvasRef.current?.focus();
    });
    return unsub;
  }, []);

  // Redirect movement/interact keys back to canvas when another element has focus
  // (e.g. after clicking the Journal button or a dialogue button)
  useEffect(() => {
    const gameKeys = new Set(["w", "a", "s", "d", "e", "arrowup", "arrowdown", "arrowleft", "arrowright"]);
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase() ?? "";
      if (tag === "input" || tag === "textarea") return;
      if (gameKeys.has(e.key.toLowerCase()) && document.activeElement !== canvasRef.current) {
        canvasRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <canvas ref={canvasRef} tabIndex={-1} style={{ outline: "none" }} />
      <DialogueBox />
      <HealOverlay />
      <QuestJournal />
      <HUD />
      <Bookshelf />
      <SkillEditor />
      <LoomOverlay />
      <SummonOverlay />
    </div>
  );
}
