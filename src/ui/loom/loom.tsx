import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../../store/game-store";
import { useLoomStore } from "../../store/loom-store";
import {
  Station1Archetype,
  Station2Name,
  Station3Voice,
  canAdvance,
} from "./stations";
import { ApprenticeCard } from "./apprentice-card";
import {
  serializeApprentice,
  synthesizeCatchphrase,
  getArchetype,
  getRecipe,
} from "../../game/systems/skill-serializer";
import { tryCompleteQuest } from "../../game/systems/quest";
import loomKeeperData from "../../data/npcs/npc-loom-keeper.json";

const palette = {
  cream: "#FFF8E7",
  sage: "#C5D5A5",
  gold: "#FFE066",
  ink: "#1a1a2e",
  shell: "#0a0a18",
  danger: "#FF3355",
};

const mono = '"Press Start 2P", monospace';
const TOTAL_STATIONS = 3;
const introLines = loomKeeperData.dialogue.intro;

export function LoomOverlay() {
  const isOpen = useGameStore((s) => s.isLoomOpen);
  const closeLoom = useGameStore((s) => s.closeLoom);
  const stage = useLoomStore((s) => s.stage);
  const station = useLoomStore((s) => s.station);
  const setStation = useLoomStore((s) => s.setStation);
  const setStage = useLoomStore((s) => s.setStage);
  const reset = useLoomStore((s) => s.reset);
  const loom = useLoomStore();
  const saveSkill = useGameStore((s) => s.saveSkill);
  const fetchSkills = useGameStore((s) => s.fetchSkills);
  const recordApprentice = useGameStore((s) => s.recordApprentice);
  const setSaveError = useLoomStore((s) => s.setSaveError);
  const [weaving, setWeaving] = useState(false);

  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const state = useLoomStore.getState();
  const canGoNext = canAdvance(station, state);

  const handleNext = async () => {
    if (!canGoNext) return;
    if (station < TOTAL_STATIONS) {
      setStation(station + 1);
      return;
    }
    // Final station → weave
    if (weaving) return;
    setWeaving(true);
    setSaveError(null);
    try {
      if (!loom.archetypeId || !loom.recipeId || !loom.name) return;
      const md = serializeApprentice({
        archetypeId: loom.archetypeId,
        name: loom.name,
        recipeId: loom.recipeId,
      });
      const ok = await saveSkill(loom.name, md);
      if (!ok) {
        setSaveError("Couldn't save the skill file. Check the server log.");
        setWeaving(false);
        return;
      }
      await fetchSkills();
      setStage("reveal");
    } catch (err) {
      setSaveError(String(err));
    } finally {
      setWeaving(false);
    }
  };

  const handleBack = () => {
    if (station > 1) setStation(station - 1);
  };

  const handleFinalize = () => {
    if (!loom.archetypeId || !loom.recipeId) return;
    const recipe = getRecipe(loom.archetypeId, loom.recipeId);
    if (!recipe) return;
    recordApprentice(loom.name, loom.archetypeId, recipe.shape);
    tryCompleteQuest("weave-an-apprentice");
    closeLoom();
    reset();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10, 10, 24, 0.92)",
        zIndex: 1500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        fontFamily: mono,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 720,
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          background: palette.shell,
          border: `3px solid ${palette.gold}`,
          boxShadow: "0 0 40px rgba(255, 224, 102, 0.15)",
        }}
      >
        <LoomHeader stage={stage} onClose={() => { closeLoom(); reset(); }} />

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 26px" }}>
          {stage === "intro" && <IntroStage onBegin={() => setStage("station")} />}
          {stage === "station" && (
            <>
              {station === 1 && <Station1Archetype />}
              {station === 2 && <Station2Name />}
              {station === 3 && <Station3Voice />}
            </>
          )}
          {stage === "reveal" && <RevealStage onFinalize={handleFinalize} />}
        </div>

        {stage === "station" && (
          <LoomFooter
            station={station}
            canNext={canGoNext}
            weaving={weaving}
            saveError={loom.saveError}
            onBack={handleBack}
            onNext={handleNext}
          />
        )}
      </div>
    </div>
  );
}

function LoomHeader({ stage, onClose }: { stage: string; onClose: () => void }) {
  const title =
    stage === "intro" ? "YSIL'S RECIPE TABLE" :
    stage === "station" ? "WRITE A SKILL" :
    "YOUR SKILL IS READY";
  return (
    <div
      style={{
        padding: "12px 20px",
        background: "#1a1a2e",
        borderBottom: `2px solid ${palette.gold}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ color: palette.gold, fontSize: 11, letterSpacing: 1 }}>{title}</div>
      <button
        onClick={onClose}
        style={{
          fontFamily: mono,
          fontSize: 8,
          background: "transparent",
          color: palette.sage,
          border: `1px solid ${palette.sage}`,
          padding: "6px 10px",
          cursor: "pointer",
        }}
      >
        × ESC
      </button>
    </div>
  );
}

function LoomFooter({
  station,
  canNext,
  weaving,
  saveError,
  onBack,
  onNext,
}: {
  station: number;
  canNext: boolean;
  weaving: boolean;
  saveError: string | null;
  onBack: () => void;
  onNext: () => void;
}) {
  const nextLabel = station < TOTAL_STATIONS ? "NEXT ▸" : weaving ? "SAVING…" : "▸ SAVE SKILL";
  return (
    <div
      style={{
        padding: "12px 20px",
        background: "#1a1a2e",
        borderTop: `2px solid ${palette.gold}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 14,
      }}
    >
      <button
        onClick={onBack}
        disabled={station <= 1}
        style={{
          fontFamily: mono,
          fontSize: 9,
          padding: "8px 14px",
          background: "transparent",
          color: station <= 1 ? "#4a4a5e" : palette.cream,
          border: `2px solid ${station <= 1 ? "#4a4a5e" : palette.cream}`,
          cursor: station <= 1 ? "not-allowed" : "pointer",
        }}
      >
        ◂ BACK
      </button>
      {saveError && (
        <div style={{ color: palette.danger, fontSize: 7, flex: 1, textAlign: "center" }}>
          {saveError}
        </div>
      )}
      <button
        onClick={onNext}
        disabled={!canNext || weaving}
        style={{
          fontFamily: mono,
          fontSize: 10,
          padding: "10px 18px",
          background: canNext && !weaving ? palette.gold : "#3a3a4e",
          color: canNext && !weaving ? palette.ink : "#7a7a8e",
          border: "none",
          cursor: canNext && !weaving ? "pointer" : "not-allowed",
        }}
      >
        {nextLabel}
      </button>
    </div>
  );
}

function IntroStage({ onBegin }: { onBegin: () => void }) {
  const [idx, setIdx] = useState(0);
  const isLast = idx >= introLines.length - 1;
  const line = introLines[idx];

  const isLastRef = useRef(isLast);
  const onBeginRef = useRef(onBegin);
  isLastRef.current = isLast;
  onBeginRef.current = onBegin;

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key !== "Enter" && e.key !== " ") return;
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase() ?? "";
      if (tag === "input" || tag === "textarea" || tag === "button") return;
      e.preventDefault();
      if (!isLastRef.current) setIdx((i) => i + 1);
      else onBeginRef.current();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div style={{ padding: "20px 4px", minHeight: 260 }}>
      <div style={{ color: palette.gold, fontSize: 10, marginBottom: 16 }}>
        {line.speaker}
      </div>
      <div style={{ color: palette.cream, fontSize: 11, lineHeight: 1.9, minHeight: 140 }}>
        {line.text}
      </div>
      <div style={{ marginTop: 28, display: "flex", justifyContent: "flex-end", gap: 12 }}>
        {!isLast ? (
          <button
            onClick={() => setIdx(idx + 1)}
            style={{
              fontFamily: mono,
              fontSize: 9,
              padding: "8px 14px",
              background: "transparent",
              color: palette.cream,
              border: `2px solid ${palette.cream}`,
              cursor: "pointer",
            }}
          >
            ▸ CONTINUE
          </button>
        ) : (
          <button
            onClick={onBegin}
            style={{
              fontFamily: mono,
              fontSize: 10,
              padding: "10px 18px",
              background: palette.gold,
              color: palette.ink,
              border: "none",
              cursor: "pointer",
            }}
          >
            ▸ START WRITING
          </button>
        )}
      </div>
    </div>
  );
}

function RevealStage({ onFinalize }: { onFinalize: () => void }) {
  const loom = useLoomStore();
  const archetype = loom.archetypeId ? getArchetype(loom.archetypeId) : undefined;
  const recipe = loom.archetypeId && loom.recipeId ? getRecipe(loom.archetypeId, loom.recipeId) : undefined;
  if (!archetype || !recipe) return null;
  const catchphrase = synthesizeCatchphrase(archetype, loom.name);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "10px 0" }}>
      <div style={{ color: palette.gold, fontSize: 10, textAlign: "center" }}>
        {loom.name} — {archetype.label}
      </div>
      <div style={{ color: palette.cream, fontSize: 9, textAlign: "center", lineHeight: 1.7, maxWidth: 500 }}>
        {catchphrase}
      </div>
      <ApprenticeCard
        name={loom.name}
        archetypeId={loom.archetypeId!}
        shape={recipe.shape}
        description={recipe.description}
        catchphrase={catchphrase}
      />
      <div style={{ color: palette.sage, fontSize: 8, textAlign: "center", lineHeight: 1.7, maxWidth: 520, marginTop: 4 }}>
        Saved to <span style={{ color: palette.gold }}>.claude/skills/{loom.name}/SKILL.md</span>.
        <br />
        Walk into the village and press <span style={{ color: palette.gold }}>F</span> to use it.
      </div>
      <button
        onClick={onFinalize}
        style={{
          fontFamily: mono,
          fontSize: 10,
          padding: "10px 18px",
          background: palette.gold,
          color: palette.ink,
          border: "none",
          cursor: "pointer",
          marginTop: 4,
        }}
      >
        ▸ DONE
      </button>
    </div>
  );
}
