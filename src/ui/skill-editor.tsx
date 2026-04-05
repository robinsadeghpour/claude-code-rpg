import { useEffect, useState, useCallback } from "react";
import { useGameStore } from "../store/game-store";

const TEMPLATES: Record<string, { label: string; content: string }> = {
  blank: {
    label: "Blank",
    content: `---
name: my-skill
description: A skill that helps with...
---

# My Skill

Use this skill when...

## Instructions

Step-by-step instructions for Claude to follow.
`,
  },
  "code-style": {
    label: "Code Style",
    content: `---
name: my-code-style
description: Code conventions and style rules for this project
---

# Code Style Guide

## When to Apply

- When writing new code in this project
- When reviewing or refactoring existing code

## Rules

### Naming Conventions

- Use camelCase for variables and functions
- Use PascalCase for components and classes

### Formatting

- Use consistent indentation
- Keep functions focused and small

## Examples

Good:
\`\`\`typescript
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}
\`\`\`
`,
  },
  generator: {
    label: "Generator",
    content: `---
name: my-generator
description: Generates a specific type of output
---

# Generator Skill

## Output Format

Describe what this generator produces.

## Steps

1. Analyze the input requirements
2. Generate the output following the format
3. Validate against the quality checklist

## Quality Checklist

- [ ] Output matches the expected format
- [ ] No placeholder content left
- [ ] Consistent with project conventions
`,
  },
  workflow: {
    label: "Workflow",
    content: `---
name: my-workflow
description: A workflow for accomplishing a specific task
---

# Workflow Skill

## When to Use

Use this workflow when...

## Process

1. **Step 1**: Description
2. **Step 2**: Description
3. **Step 3**: Description

## Checklist

- [ ] Step 1 completed
- [ ] Step 2 completed
- [ ] Step 3 completed
`,
  },
  testing: {
    label: "Testing",
    content: `---
name: my-test-skill
description: Testing strategy and conventions
---

# Test Skill

## Test Strategy

- Focus on critical paths
- Test behavior, not implementation

## Conventions

- Name tests descriptively
- One assertion per test when possible

## Verification

Run tests with:
\`\`\`bash
pnpm test
\`\`\`
`,
  },
};

const HELP_SECTIONS = [
  {
    title: "What's a Skill?",
    content:
      "A skill is a markdown file that teaches Claude how to do something specific. When you invoke a skill, Claude reads it and follows its instructions. Skills live in .claude/skills/<name>/SKILL.md.",
  },
  {
    title: "SKILL.md Format",
    content:
      'Every skill starts with YAML frontmatter (between --- markers) containing a "name" and "description". The description tells Claude WHEN to use the skill. The body contains instructions in markdown.',
  },
  {
    title: "Tips",
    content:
      'Make the description specific — it\'s how Claude decides to use your skill. Use clear headings. Include examples. Keep it under 2 minutes of reading time. The "name" field should be kebab-case.',
  },
];

function getSkillDirName(content: string): string {
  const match = content.match(/^---\n[\s\S]*?name:\s*(.+?)\n[\s\S]*?---/);
  if (match?.[1]) {
    return match[1]
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
  return "new-skill";
}

export function SkillEditor() {
  const {
    isEditorOpen,
    editingSkill,
    closeEditor,
    saveSkill,
    fetchSkillContent,
    skills,
    inWorld,
  } = useGameStore();

  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedHelp, setExpandedHelp] = useState<number | null>(null);

  useEffect(() => {
    if (!isEditorOpen) return;

    if (editingSkill) {
      // Load existing skill content
      const existing = skills.find(
        (s) => s.path.includes(`/${editingSkill}/`) || s.name === editingSkill,
      );
      if (existing?.content) {
        setContent(existing.content);
        setOriginalContent(existing.content);
      } else {
        fetchSkillContent(editingSkill).then((c) => {
          if (c) {
            setContent(c);
            setOriginalContent(c);
          }
        });
      }
    } else {
      setContent(TEMPLATES.blank.content);
      setOriginalContent(TEMPLATES.blank.content);
    }
  }, [isEditorOpen, editingSkill, fetchSkillContent, skills]);

  const hasChanges = content !== originalContent;

  const handleClose = useCallback(() => {
    if (hasChanges) {
      if (!window.confirm("You have unsaved changes. Discard them?")) return;
    }
    closeEditor();
  }, [hasChanges, closeEditor]);

  const handleSave = async () => {
    const dirName = editingSkill || getSkillDirName(content);
    setSaving(true);
    const ok = await saveSkill(dirName, content);
    setSaving(false);
    if (ok) {
      setSaved(true);
      setOriginalContent(content);
      setTimeout(() => {
        setSaved(false);
        closeEditor();
      }, 800);
    }
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isEditorOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
      if (e.key === "s" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSave();
      }
    },
    [isEditorOpen, handleClose],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!inWorld || !isEditorOpen) return null;

  const dirName = editingSkill || getSkillDirName(content);
  const lines = content.split("\n");

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1200,
        pointerEvents: "auto",
      }}
    >
      {/* Dim overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          pointerEvents: "none",
        }}
      />

      {/* Editor panel */}
      <div
        style={{
          width: 760,
          height: 520,
          background: "#1a1208",
          border: "4px solid #8B7355",
          outline: "4px solid #5a4a30",
          outlineOffset: 0,
          boxShadow: "0 0 0 8px #1a1208, 0 0 60px rgba(0,0,0,0.8)",
          position: "relative",
          zIndex: 1,
          display: "flex",
          overflow: "hidden",
        }}
      >
        {/* Left sidebar: Templates + Help */}
        <div
          style={{
            width: 180,
            background: "#1a1a2e",
            borderRight: "4px solid #8B7355",
            padding: 12,
            overflowY: "auto",
            fontFamily: '"Press Start 2P", monospace',
          }}
        >
          <div
            style={{
              fontSize: 7,
              color: "#ffe066",
              letterSpacing: 1,
              marginBottom: 10,
            }}
          >
            TEMPLATES
          </div>
          {Object.entries(TEMPLATES).map(([key, tmpl]) => (
            <div
              key={key}
              onClick={() => {
                if (
                  hasChanges &&
                  !window.confirm("Replace content with template?")
                )
                  return;
                setContent(tmpl.content);
              }}
              style={{
                padding: "6px 8px",
                marginBottom: 3,
                fontSize: 7,
                color:
                  content === tmpl.content ? "#ffe066" : "#aaa",
                border:
                  content === tmpl.content
                    ? "1px solid #ffe066"
                    : "1px solid transparent",
                background:
                  content === tmpl.content
                    ? "rgba(255,224,102,0.05)"
                    : "transparent",
                borderRadius: 3,
                cursor: "pointer",
              }}
            >
              {tmpl.label}
            </div>
          ))}

          <div
            style={{
              marginTop: 16,
              paddingTop: 12,
              borderTop: "1px solid #333",
            }}
          >
            <div
              style={{
                fontSize: 7,
                color: "#ffe066",
                letterSpacing: 1,
                marginBottom: 10,
              }}
            >
              HELP
            </div>
            {HELP_SECTIONS.map((section, i) => (
              <div key={i}>
                <div
                  onClick={() =>
                    setExpandedHelp(expandedHelp === i ? null : i)
                  }
                  style={{
                    padding: "6px 8px",
                    marginBottom: 2,
                    fontSize: 7,
                    color: expandedHelp === i ? "#88ccff" : "#888",
                    cursor: "pointer",
                  }}
                >
                  {expandedHelp === i ? "v" : ">"} {section.title}
                </div>
                {expandedHelp === i && (
                  <div
                    style={{
                      padding: "4px 8px 8px",
                      fontSize: 6,
                      color: "#aaa",
                      lineHeight: 1.8,
                    }}
                  >
                    {section.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main editor area */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: "#0d0d1a",
          }}
        >
          {/* Toolbar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              background: "#151528",
              borderBottom: "4px solid #8B7355",
              fontFamily: '"Press Start 2P", monospace',
            }}
          >
            <span style={{ fontSize: 7, color: "#88ccff", flex: 1 }}>
              .claude/skills/{dirName}/SKILL.md
            </span>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "4px 12px",
                fontSize: 7,
                background: saved
                  ? "rgba(100,255,150,0.2)"
                  : "rgba(100,255,150,0.1)",
                color: saved ? "#88ffaa" : "#88ffaa",
                border: "2px solid #88ffaa",
                borderRadius: 3,
                cursor: saving ? "wait" : "pointer",
                fontFamily: '"Press Start 2P", monospace',
              }}
            >
              {saved ? "SAVED!" : saving ? "SAVING..." : "SAVE"}
            </button>
          </div>

          {/* Editor with line numbers */}
          <div
            style={{
              flex: 1,
              display: "flex",
              overflow: "hidden",
            }}
          >
            {/* Line numbers */}
            <div
              style={{
                width: 36,
                padding: "12px 4px",
                textAlign: "right",
                fontSize: 7,
                fontFamily: '"Press Start 2P", monospace',
                color: "#333",
                lineHeight: "1.7em",
                overflow: "hidden",
                userSelect: "none",
                background: "#0a0a14",
              }}
            >
              {lines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Textarea */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              spellCheck={false}
              style={{
                flex: 1,
                padding: "12px 16px",
                fontSize: 7,
                fontFamily: '"Press Start 2P", monospace',
                color: "#e8dcc8",
                background: "transparent",
                border: "none",
                outline: "none",
                resize: "none",
                lineHeight: "1.7em",
                tabSize: 2,
              }}
            />
          </div>

          {/* Bottom bar */}
          <div
            style={{
              padding: "6px 12px",
              background: "#151528",
              borderTop: "2px solid #333",
              display: "flex",
              justifyContent: "space-between",
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 6,
              color: "#5a4a30",
            }}
          >
            <span>
              <span style={{ color: "#ffe066" }}>Ctrl+S</span> Save{" "}
              <span style={{ color: "#ffe066" }}>Esc</span> Close
            </span>
            <span>
              {lines.length} lines{hasChanges ? " (modified)" : ""}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
