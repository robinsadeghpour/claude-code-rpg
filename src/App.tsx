import { useEffect, useRef } from "react";
import { initGame } from "./game/init";
import { DialogueBox } from "./ui/dialogue-box";
import { HealOverlay } from "./ui/heal-overlay";
import { QuestJournal } from "./ui/quest-journal";
import { HUD } from "./ui/hud";
import { Bookshelf } from "./ui/bookshelf";
import { SkillEditor } from "./ui/skill-editor";

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const game = initGame(canvasRef.current);
    return () => game.quit();
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <canvas ref={canvasRef} />
      <DialogueBox />
      <HealOverlay />
      <QuestJournal />
      <HUD />
      <Bookshelf />
      <SkillEditor />
    </div>
  );
}
