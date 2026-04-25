import { useLoomStore } from "../../store/loom-store";
import {
  archetypes,
  getArchetype,
  getNamesFor,
  getVoiceBundle,
  type VoiceRecipe,
} from "../../game/systems/skill-serializer";

const palette = {
  cream: "#FFF8E7",
  sage: "#C5D5A5",
  gold: "#FFE066",
  ink: "#1a1a2e",
  panel: "#0f0f1e",
  ok: "#88D4B0",
  warn: "#FFB088",
  danger: "#FF3355",
};

const mono = '"Press Start 2P", monospace';

export function canAdvance(station: number, state: ReturnType<typeof useLoomStore.getState>): boolean {
  switch (station) {
    case 1: return !!state.archetypeId;
    case 2: return state.name.length > 0;
    case 3: return !!state.recipeId;
    default: return false;
  }
}

// ────────────────────────────────────────────────────────────
// STATION 1 — ARCHETYPE
// ────────────────────────────────────────────────────────────

export function Station1Archetype() {
  const archetypeId = useLoomStore((s) => s.archetypeId);
  const setArchetype = useLoomStore((s) => s.setArchetype);
  const list = Object.values(archetypes);

  return (
    <div>
      <StationHeader number={1} title="WHAT DOES YOUR SKILL BUILD?" subtitle="pick what Claude will place when you press F" />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {list.map((a) => {
          const selected = archetypeId === a.id;
          return (
            <button
              key={a.id}
              onClick={() => setArchetype(a.id)}
              style={{
                textAlign: "left",
                padding: "14px 16px",
                background: selected ? a.clothColor : "rgba(255,248,231,0.06)",
                border: `2px solid ${selected ? a.accentColor : "#3a3a4e"}`,
                cursor: "pointer",
                fontFamily: mono,
                color: selected ? a.accentColor : palette.cream,
                display: "grid",
                gridTemplateColumns: "56px 1fr",
                gap: 14,
                alignItems: "center",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{
                width: 56,
                height: 56,
                background: selected ? a.accentColor : "rgba(255,224,102,0.12)",
                color: selected ? a.clothColor : palette.gold,
                fontSize: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "serif",
              }}>{a.glyph}</div>
              <div>
                <div style={{ fontSize: 12, marginBottom: 6 }}>{a.label.toUpperCase()}</div>
                <div style={{ fontSize: 8, lineHeight: 1.5, opacity: 0.85, marginBottom: 6 }}>{a.tagline}</div>
                <div style={{ fontSize: 7, lineHeight: 1.5, opacity: 0.75 }}>
                  <span style={{ color: selected ? a.accentColor : palette.gold, fontWeight: "bold" }}>How you use it:</span>
                  {" "}{a.abilityBlurb}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// STATION 2 — NAME
// ────────────────────────────────────────────────────────────

export function Station2Name() {
  const archetypeId = useLoomStore((s) => s.archetypeId);
  const name = useLoomStore((s) => s.name);
  const setName = useLoomStore((s) => s.setName);

  const archetype = archetypeId ? getArchetype(archetypeId) : undefined;
  const nameList = archetypeId ? getNamesFor(archetypeId) : [];

  if (!archetype) return null;

  return (
    <div>
      <StationHeader number={2} title="NAME YOUR SKILL" subtitle="this becomes the folder name in .claude/skills/" />
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: 10,
      }}>
        {nameList.map((n) => {
          const selected = name === n;
          return (
            <button
              key={n}
              onClick={() => setName(n)}
              style={{
                fontFamily: mono,
                fontSize: 10,
                padding: "14px 10px",
                background: selected ? archetype.clothColor : "rgba(255,248,231,0.06)",
                color: selected ? archetype.accentColor : palette.cream,
                border: `2px solid ${selected ? archetype.accentColor : "#3a3a4e"}`,
                cursor: "pointer",
                letterSpacing: 1,
                transition: "all 0.15s ease",
              }}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// STATION 3 — VOICE (pick-a-recipe with live feedback)
// ────────────────────────────────────────────────────────────

export function Station3Voice() {
  const archetypeId = useLoomStore((s) => s.archetypeId);
  const recipeId = useLoomStore((s) => s.recipeId);
  const setRecipe = useLoomStore((s) => s.setRecipe);

  const bundle = archetypeId ? getVoiceBundle(archetypeId) : undefined;
  const archetype = archetypeId ? getArchetype(archetypeId) : undefined;
  if (!bundle || !archetype) return null;

  const selected = recipeId ? bundle.recipes.find((r) => r.id === recipeId) : undefined;

  return (
    <div>
      <StationHeader number={3} title="WHEN SHOULD CLAUDE USE IT?" subtitle="this is the description field in your SKILL.md" />

      <div style={{ fontFamily: mono, fontSize: 8, color: palette.sage, lineHeight: 1.7, textAlign: "center", marginBottom: 12 }}>
        Pick a description. Watch which prompts Claude would run it on.
      </div>

      {/* Sample prompts panel */}
      <div style={{ marginBottom: 16 }}>
        {bundle.samplePrompts.map((p) => {
          const fires = !!selected && selected.fires.includes(p.id);
          const correct = fires === p.isTarget;
          const border =
            !selected ? "#3a3a4e" :
            correct ? palette.ok : palette.danger;
          const status =
            !selected ? "\u2014" :
            fires ? "CLAUDE RUNS IT" :
            "CLAUDE SKIPS IT";
          const statusColor =
            !selected ? "#7A7A7A" :
            correct ? palette.ok : palette.danger;
          return (
            <div
              key={p.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                borderLeft: `3px solid ${border}`,
                marginBottom: 4,
                background: "rgba(255,248,231,0.04)",
                transition: "border-color 0.2s ease",
              }}
            >
              <span style={{ fontFamily: mono, fontSize: 6, color: p.isTarget ? palette.gold : palette.sage, minWidth: 70 }}>
                {p.isTarget ? "FOR YOUR SKILL" : "NOT FOR YOUR SKILL"}
              </span>
              <span style={{ fontFamily: mono, fontSize: 9, color: palette.cream, flex: 1, lineHeight: 1.5 }}>
                {p.text}
              </span>
              <span style={{ fontFamily: mono, fontSize: 7, color: statusColor, minWidth: 90, textAlign: "right" }}>
                {status}
              </span>
            </div>
          );
        })}
      </div>

      {/* Recipe picker */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {bundle.recipes.map((r) => (
          <RecipeCard key={r.id} recipe={r} selected={recipeId === r.id} onPick={() => setRecipe(r.id)} />
        ))}
      </div>

      {selected && (
        <div style={{
          marginTop: 14,
          padding: "10px 12px",
          background: "#0f0f1e",
          borderLeft: `3px solid ${palette.gold}`,
          fontFamily: mono,
          fontSize: 8,
          color: palette.cream,
          lineHeight: 1.7,
        }}>
          <div style={{ color: palette.gold, marginBottom: 4 }}>YSIL</div>
          <div>{selected.lesson}</div>
        </div>
      )}
    </div>
  );
}

function RecipeCard({ recipe, selected, onPick }: { recipe: VoiceRecipe; selected: boolean; onPick: () => void }) {
  const shapeColor =
    recipe.shape === "sharp" ? palette.ok :
    recipe.shape === "wide" ? palette.warn :
    "#C4A8D8";
  return (
    <button
      onClick={onPick}
      style={{
        padding: "12px 10px",
        background: selected ? "rgba(255,224,102,0.15)" : "rgba(255,248,231,0.04)",
        border: `2px solid ${selected ? palette.gold : "#3a3a4e"}`,
        cursor: "pointer",
        fontFamily: mono,
        color: palette.cream,
        textAlign: "left",
        transition: "all 0.15s ease",
      }}
    >
      <div style={{ fontSize: 7, color: shapeColor, marginBottom: 6, letterSpacing: 1 }}>{recipe.shape.toUpperCase()}</div>
      <div style={{ fontSize: 9, marginBottom: 8 }}>{recipe.label}</div>
      <div style={{ fontSize: 7, opacity: 0.8, lineHeight: 1.6 }}>"{recipe.description}"</div>
    </button>
  );
}

// ────────────────────────────────────────────────────────────

function StationHeader({ number, title, subtitle }: { number: number; title: string; subtitle: string }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 20 }}>
      <div style={{ fontFamily: mono, fontSize: 7, color: palette.gold, opacity: 0.7 }}>STEP {number} OF 3</div>
      <div style={{ fontFamily: mono, fontSize: 12, color: palette.gold, marginTop: 6, letterSpacing: 1 }}>{title}</div>
      <div style={{ fontFamily: mono, fontSize: 8, color: palette.sage, marginTop: 4, fontStyle: "italic" }}>{subtitle}</div>
    </div>
  );
}
