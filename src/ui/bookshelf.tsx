import { useEffect, useState, useCallback } from "react";
import { useGameStore } from "../store/game-store";
import type { SkillEntry } from "../store/game-store";

const CATEGORY_COLORS: Record<string, { spine: string; text: string }> = {
  "Game Design": { spine: "#5a3090", text: "#d4b0ff" },
  "Assets & Art": { spine: "#2a6040", text: "#88ffaa" },
  Workflow: { spine: "#6a4a2a", text: "#ddc090" },
  Custom: { spine: "#205a6a", text: "#88eeff" },
};

const SPINE_HEIGHTS = [80, 68, 74, 62, 70];

function BookSpine({
  skill,
  index,
  isSelected,
  onClick,
}: {
  skill: SkillEntry;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const colors = CATEGORY_COLORS[skill.category] || CATEGORY_COLORS.Custom;
  const height = SPINE_HEIGHTS[index % SPINE_HEIGHTS.length];

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        cursor: "pointer",
        transform: isSelected ? "translateY(-10px)" : undefined,
        transition: "transform 0.1s",
      }}
      onMouseEnter={(e) => {
        if (!isSelected)
          (e.currentTarget as HTMLElement).style.transform = "translateY(-6px)";
      }}
      onMouseLeave={(e) => {
        if (!isSelected)
          (e.currentTarget as HTMLElement).style.transform = "none";
      }}
    >
      <div
        style={{
          width: 36,
          height,
          background: `linear-gradient(90deg, ${colors.spine}, ${colors.spine}dd)`,
          border: isSelected
            ? "2px solid #ffe066"
            : "2px solid rgba(0,0,0,0.3)",
          boxShadow: isSelected
            ? "0 0 8px rgba(255,224,102,0.3)"
            : undefined,
          borderRadius: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "4px 2px",
          imageRendering: "pixelated" as const,
        }}
      >
        <span
          style={{
            writingMode: "vertical-rl",
            textOrientation: "mixed",
            fontSize: 6,
            letterSpacing: 1,
            fontFamily: '"Press Start 2P", monospace',
            color: colors.text,
            whiteSpace: "nowrap",
          }}
        >
          {skill.name.slice(0, 8).toUpperCase()}
        </span>
      </div>
      <span
        style={{
          fontSize: 6,
          color: "#888",
          textAlign: "center",
          maxWidth: 50,
          lineHeight: "1.3",
          marginTop: 3,
          fontFamily: '"Press Start 2P", monospace',
        }}
      >
        {skill.name.length > 10
          ? `${skill.name.slice(0, 10)}...`
          : skill.name}
      </span>
    </div>
  );
}

function EmptySlot({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        const spine = (e.currentTarget as HTMLElement).querySelector(
          "[data-spine]",
        ) as HTMLElement;
        if (spine) {
          spine.style.borderColor = "#ffe066";
          spine.style.color = "#ffe066";
        }
      }}
      onMouseLeave={(e) => {
        const spine = (e.currentTarget as HTMLElement).querySelector(
          "[data-spine]",
        ) as HTMLElement;
        if (spine) {
          spine.style.borderColor = "#3a2a1a";
          spine.style.color = "#3a2a1a";
        }
      }}
    >
      <div
        data-spine
        style={{
          width: 36,
          height: 68,
          background: "transparent",
          border: "2px dashed #3a2a1a",
          borderRadius: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          color: "#3a2a1a",
          fontFamily: '"Press Start 2P", monospace',
          transition: "border-color 0.1s, color 0.1s",
        }}
      >
        +
      </div>
      <span
        style={{
          fontSize: 6,
          color: "#4a3a2a",
          marginTop: 3,
          fontFamily: '"Press Start 2P", monospace',
        }}
      >
        New
      </span>
    </div>
  );
}

function ShelfPlank() {
  return (
    <div
      style={{
        height: 8,
        background:
          "linear-gradient(180deg, #8B7355 0%, #6B5335 40%, #5a4325 100%)",
        borderTop: "2px solid #a08860",
        margin: "0 -16px",
      }}
    />
  );
}

function Shelf({
  label,
  skills,
  selectedSkill,
  onSelect,
  onNewSkill,
}: {
  label: string;
  skills: SkillEntry[];
  selectedSkill: string | null;
  onSelect: (skill: SkillEntry) => void;
  onNewSkill: () => void;
}) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div
        style={{
          fontSize: 7,
          color: "#6a5a40",
          letterSpacing: 2,
          marginBottom: 6,
          paddingLeft: 8,
          fontFamily: '"Press Start 2P", monospace',
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 6,
          padding: "6px 8px 0",
          minHeight: 100,
        }}
      >
        {skills.map((skill, i) => (
          <BookSpine
            key={skill.name}
            skill={skill}
            index={i}
            isSelected={selectedSkill === skill.name}
            onClick={() => onSelect(skill)}
          />
        ))}
        <EmptySlot onClick={onNewSkill} />
      </div>
      <ShelfPlank />
    </div>
  );
}

function DetailPanel({
  skill,
  onRead,
  onEdit,
}: {
  skill: SkillEntry;
  onRead: () => void;
  onEdit: () => void;
}) {
  return (
    <div
      style={{
        background: "#2a1e0e",
        borderTop: "4px solid #8B7355",
        padding: "16px 20px",
      }}
    >
      <div
        style={{
          background: "#f0e6d0",
          border: "2px solid #c4a870",
          padding: 16,
          backgroundImage:
            "radial-gradient(ellipse at 20% 50%, rgba(200,180,140,0.3) 0%, transparent 70%), radial-gradient(ellipse at 80% 50%, rgba(180,160,120,0.2) 0%, transparent 70%)",
        }}
      >
        <h3
          style={{
            fontSize: 10,
            color: "#3a2a10",
            marginBottom: 8,
            borderBottom: "2px solid #c4a870",
            paddingBottom: 6,
            fontFamily: '"Press Start 2P", monospace',
          }}
        >
          {skill.name.toUpperCase()}
        </h3>
        <div
          style={{
            fontSize: 7,
            color: "#5a4a30",
            lineHeight: 2,
            marginBottom: 12,
            fontFamily: '"Press Start 2P", monospace',
          }}
        >
          {skill.description || "No description available."}
        </div>
        <div
          style={{
            fontSize: 7,
            color: "#8a7a5a",
            background: "rgba(0,0,0,0.05)",
            padding: "4px 8px",
            display: "inline-block",
            marginBottom: 12,
            fontFamily: '"Press Start 2P", monospace',
          }}
        >
          {skill.path.replace(/.*\.claude\//, ".claude/")}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onRead}
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 7,
              padding: "6px 12px",
              border: "2px solid #2a6040",
              background: "transparent",
              color: "#2a6040",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.background = "#2a6040";
              (e.target as HTMLElement).style.color = "#f0e6d0";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.background = "transparent";
              (e.target as HTMLElement).style.color = "#2a6040";
            }}
          >
            READ
          </button>
          <button
            onClick={onEdit}
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 7,
              padding: "6px 12px",
              border: "2px solid #4a3090",
              background: "transparent",
              color: "#4a3090",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.background = "#4a3090";
              (e.target as HTMLElement).style.color = "#f0e6d0";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.background = "transparent";
              (e.target as HTMLElement).style.color = "#4a3090";
            }}
          >
            EDIT
          </button>
        </div>
      </div>
    </div>
  );
}

function ReadView({
  skill,
  onBack,
}: {
  skill: SkillEntry;
  onBack: () => void;
}) {
  return (
    <div
      style={{
        background: "#2a1e0e",
        borderTop: "4px solid #8B7355",
        padding: "16px 20px",
        maxHeight: 300,
        overflowY: "auto",
      }}
    >
      <div
        style={{
          background: "#f0e6d0",
          border: "2px solid #c4a870",
          padding: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
            borderBottom: "2px solid #c4a870",
            paddingBottom: 8,
          }}
        >
          <h3
            style={{
              fontSize: 10,
              color: "#3a2a10",
              fontFamily: '"Press Start 2P", monospace',
            }}
          >
            {skill.name.toUpperCase()}
          </h3>
          <button
            onClick={onBack}
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 7,
              padding: "4px 10px",
              border: "2px solid #8a7a5a",
              background: "transparent",
              color: "#8a7a5a",
              cursor: "pointer",
            }}
          >
            BACK
          </button>
        </div>
        <pre
          style={{
            fontSize: 7,
            color: "#3a2a10",
            lineHeight: 2,
            fontFamily: '"Press Start 2P", monospace',
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {skill.content || "Loading..."}
        </pre>
      </div>
    </div>
  );
}

export function Bookshelf() {
  const {
    isBookshelfOpen,
    skills,
    closeBookshelf,
    openEditor,
    fetchSkills,
    fetchSkillContent,
    inWorld,
  } = useGameStore();

  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [readingSkill, setReadingSkill] = useState<string | null>(null);

  useEffect(() => {
    if (isBookshelfOpen && skills.length === 0) {
      fetchSkills();
    }
  }, [isBookshelfOpen, skills.length, fetchSkills]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isBookshelfOpen) return;
      if (e.key === "k" || e.key === "Escape") {
        e.preventDefault();
        closeBookshelf();
      }
      if (e.key === "n") {
        e.preventDefault();
        openEditor(null);
      }
    },
    [isBookshelfOpen, closeBookshelf, openEditor],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!inWorld || !isBookshelfOpen) return null;

  // Group skills by category
  const grouped: Record<string, SkillEntry[]> = {};
  for (const skill of skills) {
    const cat = skill.category || "Custom";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(skill);
  }

  const selected = skills.find((s) => s.name === selectedSkill);
  const reading = skills.find((s) => s.name === readingSkill);

  const handleRead = async () => {
    if (!selected) return;
    // Derive directory name from path
    const dirMatch = selected.path.match(/skills\/([^/]+)\//);
    const dirName = dirMatch ? dirMatch[1] : selected.name;
    await fetchSkillContent(dirName);
    setReadingSkill(selected.name);
  };

  const handleEdit = () => {
    if (!selected) return;
    const dirMatch = selected.path.match(/skills\/([^/]+)\//);
    const dirName = dirMatch ? dirMatch[1] : selected.name;
    openEditor(dirName);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100,
        pointerEvents: "auto",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeBookshelf();
      }}
    >
      {/* Dim overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          pointerEvents: "none",
        }}
      />

      {/* Panel */}
      <div
        style={{
          width: 720,
          background: "#1a1208",
          border: "4px solid #8B7355",
          outline: "4px solid #5a4a30",
          outlineOffset: 0,
          boxShadow: "0 0 0 8px #1a1208, 0 0 60px rgba(0,0,0,0.8)",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Corner decorations */}
        <div
          style={{
            position: "absolute",
            top: -2,
            left: -2,
            width: 12,
            height: 12,
            borderTop: "4px solid #ffe066",
            borderLeft: "4px solid #ffe066",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -2,
            right: -2,
            width: 12,
            height: 12,
            borderTop: "4px solid #ffe066",
            borderRight: "4px solid #ffe066",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -2,
            left: -2,
            width: 12,
            height: 12,
            borderBottom: "4px solid #ffe066",
            borderLeft: "4px solid #ffe066",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -2,
            right: -2,
            width: 12,
            height: 12,
            borderBottom: "4px solid #ffe066",
            borderRight: "4px solid #ffe066",
          }}
        />

        {/* Title bar */}
        <div
          style={{
            background: "#3a2a10",
            borderBottom: "4px solid #8B7355",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h1
            style={{
              fontSize: 12,
              color: "#ffe066",
              textShadow: "2px 2px 0 #3a2a10",
              letterSpacing: 2,
              fontFamily: '"Press Start 2P", monospace',
            }}
          >
            SKILL BOOKSHELF
          </h1>
          <span
            style={{
              fontSize: 8,
              color: "#8B7355",
              fontFamily: '"Press Start 2P", monospace',
            }}
          >
            <span style={{ color: "#ffe066" }}>K</span> CLOSE
          </span>
        </div>

        {/* Shelves */}
        <div style={{ padding: "12px 16px 8px" }}>
          {Object.entries(grouped).map(([category, catSkills]) => (
            <Shelf
              key={category}
              label={category.toUpperCase()}
              skills={catSkills}
              selectedSkill={selectedSkill}
              onSelect={(skill) =>
                setSelectedSkill(
                  skill.name === selectedSkill ? null : skill.name,
                )
              }
              onNewSkill={() => openEditor(null)}
            />
          ))}
          {Object.keys(grouped).length === 0 && (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: "#5a4a30",
                fontSize: 8,
                fontFamily: '"Press Start 2P", monospace',
              }}
            >
              No skills found. Create one!
            </div>
          )}
        </div>

        {/* Detail / Read panel */}
        {readingSkill && reading ? (
          <ReadView
            skill={reading}
            onBack={() => setReadingSkill(null)}
          />
        ) : selected ? (
          <DetailPanel
            skill={selected}
            onRead={handleRead}
            onEdit={handleEdit}
          />
        ) : null}

        {/* Keybinds footer */}
        <div
          style={{
            background: "#1a1208",
            borderTop: "4px solid #8B7355",
            padding: "8px 16px",
            display: "flex",
            justifyContent: "center",
            gap: 24,
            fontSize: 7,
            color: "#5a4a30",
            fontFamily: '"Press Start 2P", monospace',
          }}
        >
          <span>
            <span style={{ color: "#ffe066" }}>CLICK</span> SELECT
          </span>
          <span>
            <span style={{ color: "#ffe066" }}>N</span> NEW SKILL
          </span>
          <span>
            <span style={{ color: "#ffe066" }}>K</span> CLOSE
          </span>
        </div>
      </div>
    </div>
  );
}
