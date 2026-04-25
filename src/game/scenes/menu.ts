import type { GameObj, KAPLAYCtx, OpacityComp } from "kaplay";
import { useGameStore } from "../../store/game-store";
import { audio } from "../systems/audio";

type MenuMode = "main" | "settings" | "credits";

type MainAction = {
  id: string;
  label: string;
  hint: string;
  enabled: () => boolean;
  activate: () => void;
};

type SettingsRow =
  | {
      id: string;
      kind: "slider";
      label: string;
      get: () => number;
      set: (v: number) => void;
    }
  | {
      id: string;
      kind: "toggle";
      label: string;
      get: () => boolean;
      toggle: () => void;
    }
  | {
      id: string;
      kind: "action";
      label: string;
      activate: () => void;
    };

const W = 800;
const H = 600;

// Brand palette
const INK = "#2A1A0A";
const PARCHMENT = "#FFF8E7";
const SUN = "#FFE066";
const LAVENDER = "#C4A8D8";
const PEACH = "#FFB088";
const SAGE = "#C5D5A5";
const GRAY = "#7A7A7A";
const CHARCOAL = "#3A3A3A";

export function menuScene(k: KAPLAYCtx) {
  let mode: MenuMode = "main";
  let mainIndex = 0;
  let settingsIndex = 0;

  const mainActions: MainAction[] = [
    {
      id: "new-game",
      label: "Begin New Journey",
      hint: "Wake in the valley with no memory of how you got here.",
      enabled: () => true,
      activate: async () => {
        audio.playBlip("select");
        await useGameStore.getState().resetGame();
        fadeOutAndGo("transition");
      },
    },
    {
      id: "continue",
      label: "Return to the Valley",
      hint: "Pick up where you last set down your pack.",
      enabled: () => useGameStore.getState().hasStartedGame,
      activate: () => {
        audio.playBlip("select");
        fadeOutAndGo("transition");
      },
    },
    {
      id: "settings",
      label: "Attune the Senses",
      hint: "Adjust the sound of wind, song, and bell.",
      enabled: () => true,
      activate: () => {
        audio.playBlip("select");
        mode = "settings";
        settingsIndex = 0;
        render();
      },
    },
    {
      id: "credits",
      label: "The Makers",
      hint: "Those who shaped this small corner of the world.",
      enabled: () => true,
      activate: () => {
        audio.playBlip("select");
        mode = "credits";
        render();
      },
    },
  ];

  const settingsRows: SettingsRow[] = [
    {
      id: "master",
      kind: "slider",
      label: "Master",
      get: () => audio.getVolumes().master,
      set: (v) => audio.setMaster(v),
    },
    {
      id: "music",
      kind: "slider",
      label: "Music",
      get: () => audio.getVolumes().music,
      set: (v) => audio.setMusic(v),
    },
    {
      id: "sfx",
      kind: "slider",
      label: "Sound",
      get: () => audio.getVolumes().sfx,
      set: (v) => audio.setSfx(v),
    },
    {
      id: "mute",
      kind: "toggle",
      label: "Silence All",
      get: () => audio.getVolumes().muted,
      toggle: () => audio.toggleMute(),
    },
    {
      id: "back",
      kind: "action",
      label: "Back",
      activate: () => goBackToMain(),
    },
  ];

  // ── static background ──────────────────────────────────────────
  k.add([
    k.sprite("menu-background"),
    k.pos(0, 0),
    k.scale(W / 1024, H / 1024),
    k.z(0),
  ]);

  // Soft cream overlay for warmth + legibility
  k.add([
    k.rect(W, H),
    k.pos(0, 0),
    k.color(k.Color.fromHex(PARCHMENT)),
    k.opacity(0.1),
    k.z(1),
  ]);

  // Vignette bars — top and bottom for a proper title-screen feel
  k.add([
    k.rect(W, 90),
    k.pos(0, 0),
    k.color(k.Color.fromHex(INK)),
    k.opacity(0.45),
    k.z(2),
  ]);
  k.add([
    k.rect(W, 90),
    k.pos(0, H - 90),
    k.color(k.Color.fromHex(INK)),
    k.opacity(0.55),
    k.z(2),
  ]);

  // Title (with drop shadow)
  k.add([
    k.text("CLAUDE CODE RPG", { size: 44, font: "monospace" }),
    k.pos(W / 2 + 3, 133),
    k.anchor("center"),
    k.color(k.Color.fromHex(INK)),
    k.opacity(0.55),
    k.z(10),
  ]);
  k.add([
    k.text("CLAUDE CODE RPG", { size: 44, font: "monospace" }),
    k.pos(W / 2, 130),
    k.anchor("center"),
    k.color(k.Color.fromHex(SUN)),
    k.z(11),
  ]);

  // Subtitle
  k.add([
    k.text("A cozy valley. A tangle of glitches. A quiet quest.", {
      size: 12,
      font: "monospace",
    }),
    k.pos(W / 2, 172),
    k.anchor("center"),
    k.color(k.Color.fromHex(LAVENDER)),
    k.z(11),
  ]);

  // Fade-in on scene entry
  const fade = k.add([
    k.rect(W, H),
    k.pos(0, 0),
    k.color(k.Color.fromHex("#000000")),
    k.opacity(1),
    k.z(1000),
  ]) as GameObj<OpacityComp>;

  let fading: "in" | "out" | "idle" = "in";
  let fadeTarget: string | null = null;
  let fadeTime = 0;

  // Footer — control hint (updated per mode in render())
  let footerLabel: GameObj<{ text: string }> | null = null;

  // ── helpers ────────────────────────────────────────────────────

  function clearDynamic() {
    k.destroyAll("menu-dynamic");
  }

  function fadeOutAndGo(scene: string) {
    if (fading === "out") return;
    fading = "out";
    fadeTarget = scene;
    fadeTime = 0;
  }

  function goBackToMain() {
    audio.playBlip("back");
    mode = "main";
    render();
  }

  // Selection indicator pulse
  let pulse = 0;

  // ── renderers ─────────────────────────────────────────────────

  function render() {
    clearDynamic();
    if (mode === "main") renderMain();
    else if (mode === "settings") renderSettings();
    else if (mode === "credits") renderCredits();
  }

  function renderMain() {
    const btnW = 320;
    const btnH = 48;
    const gap = 12;
    const startY = 240;

    for (let i = 0; i < mainActions.length; i++) {
      const action = mainActions[i];
      const y = startY + i * (btnH + gap);
      const isSelected = i === mainIndex;
      const isDisabled = !action.enabled();
      drawMenuButton({
        x: W / 2 - btnW / 2,
        y,
        w: btnW,
        h: btnH,
        label: action.label,
        selected: isSelected,
        disabled: isDisabled,
        index: i,
      });
    }

    // Selected hint line
    const selected = mainActions[mainIndex];
    const hintText = !selected.enabled() && selected.id === "continue"
      ? "No journey yet. Begin a new one."
      : selected.hint;
    k.add([
      k.text(hintText, { size: 11, font: "monospace", width: W - 120, align: "center" }),
      k.pos(W / 2, H - 62),
      k.anchor("center"),
      k.color(k.Color.fromHex(PARCHMENT)),
      k.opacity(0.85),
      k.z(12),
      "menu-dynamic",
    ]);

    setFooter("↑↓ choose   · ENTER select");
  }

  function renderSettings() {
    const panelW = 440;
    const panelH = 340;
    const px = W / 2 - panelW / 2;
    const py = 210;

    // Panel shadow
    k.add([
      k.rect(panelW + 4, panelH + 4),
      k.pos(px + 4, py + 4),
      k.color(k.Color.fromHex(INK)),
      k.opacity(0.5),
      k.z(9),
      "menu-dynamic",
    ]);
    // Panel face
    k.add([
      k.rect(panelW, panelH),
      k.pos(px, py),
      k.color(k.Color.fromHex(CHARCOAL)),
      k.z(10),
      "menu-dynamic",
    ]);
    // Inner lighter plate
    k.add([
      k.rect(panelW - 10, panelH - 10),
      k.pos(px + 5, py + 5),
      k.color(k.Color.fromHex("#4A3A2A")),
      k.opacity(0.85),
      k.z(11),
      "menu-dynamic",
    ]);
    // Heading
    k.add([
      k.text("SETTINGS", { size: 18, font: "monospace" }),
      k.pos(W / 2, py + 28),
      k.anchor("center"),
      k.color(k.Color.fromHex(SUN)),
      k.z(12),
      "menu-dynamic",
    ]);

    // Rows
    const rowStartY = py + 68;
    const rowH = 46;
    for (let i = 0; i < settingsRows.length; i++) {
      const row = settingsRows[i];
      const ry = rowStartY + i * rowH;
      const isSelected = i === settingsIndex;
      drawSettingsRow(row, px + 24, ry, panelW - 48, isSelected, i);
    }

    setFooter("↑↓ choose   · ←→ adjust   · ENTER toggle   · ESC back");
  }

  function renderCredits() {
    const panelW = 480;
    const panelH = 320;
    const px = W / 2 - panelW / 2;
    const py = 210;

    k.add([
      k.rect(panelW + 4, panelH + 4),
      k.pos(px + 4, py + 4),
      k.color(k.Color.fromHex(INK)),
      k.opacity(0.5),
      k.z(9),
      "menu-dynamic",
    ]);
    k.add([
      k.rect(panelW, panelH),
      k.pos(px, py),
      k.color(k.Color.fromHex(CHARCOAL)),
      k.z(10),
      "menu-dynamic",
    ]);
    k.add([
      k.rect(panelW - 10, panelH - 10),
      k.pos(px + 5, py + 5),
      k.color(k.Color.fromHex("#4A3A2A")),
      k.opacity(0.85),
      k.z(11),
      "menu-dynamic",
    ]);

    k.add([
      k.text("THE MAKERS", { size: 18, font: "monospace" }),
      k.pos(W / 2, py + 28),
      k.anchor("center"),
      k.color(k.Color.fromHex(SUN)),
      k.z(12),
      "menu-dynamic",
    ]);

    const lines = [
      ["Game Design", "The Claude Code RPG Team"],
      ["Engine", "Kaplay · Vite · React"],
      ["Art Direction", "Cozy Pixel Valley"],
      ["Music", "A procedural lo-fi loop"],
      ["Dedicated to", "Every developer who has ever"],
      ["", "been pulled into their own code."],
    ];

    for (let i = 0; i < lines.length; i++) {
      const [label, value] = lines[i];
      const y = py + 80 + i * 32;
      if (label) {
        k.add([
          k.text(label, { size: 11, font: "monospace" }),
          k.pos(px + 40, y),
          k.color(k.Color.fromHex(LAVENDER)),
          k.z(12),
          "menu-dynamic",
        ]);
      }
      k.add([
        k.text(value, { size: 12, font: "monospace" }),
        k.pos(px + 180, y),
        k.color(k.Color.fromHex(PARCHMENT)),
        k.z(12),
        "menu-dynamic",
      ]);
    }

    setFooter("ENTER / ESC to return");
  }

  // ── primitives ────────────────────────────────────────────────

  function drawMenuButton(opts: {
    x: number;
    y: number;
    w: number;
    h: number;
    label: string;
    selected: boolean;
    disabled: boolean;
    index: number;
  }) {
    const { x, y, w, h, label, selected, disabled, index } = opts;

    // Drop shadow
    k.add([
      k.rect(w + 3, h + 3),
      k.pos(x, y),
      k.color(k.Color.fromHex(INK)),
      k.opacity(0.55),
      k.z(10),
      "menu-dynamic",
    ]);

    // Base face
    const faceColor = selected ? "#5A4A30" : "#3A2E20";
    k.add([
      k.rect(w, h),
      k.pos(x, y),
      k.color(k.Color.fromHex(faceColor)),
      k.z(11),
      "menu-dynamic",
    ]);

    // Inner highlight
    k.add([
      k.rect(w - 8, h - 8),
      k.pos(x + 4, y + 4),
      k.color(k.Color.fromHex(selected ? "#6A573A" : "#483828")),
      k.z(12),
      "menu-dynamic",
    ]);

    // Left accent ornament (brightens when selected)
    k.add([
      k.rect(4, h - 12),
      k.pos(x + 10, y + 6),
      k.color(k.Color.fromHex(selected ? SUN : GRAY)),
      k.opacity(selected ? 1 : 0.6),
      k.z(13),
      "menu-dynamic",
    ]);

    // Label
    const textColor = disabled ? GRAY : selected ? SUN : PARCHMENT;
    k.add([
      k.text(label, { size: 16, font: "monospace" }),
      k.pos(x + 30, y + h / 2),
      k.anchor("left"),
      k.color(k.Color.fromHex(textColor)),
      k.opacity(disabled ? 0.5 : 1),
      k.z(13),
      "menu-dynamic",
    ]);

    // Selection caret ">" pulsing
    if (selected) {
      k.add([
        k.text(">", { size: 18, font: "monospace" }),
        k.pos(x - 16, y + h / 2),
        k.anchor("right"),
        k.color(k.Color.fromHex(PEACH)),
        k.opacity(1),
        k.z(13),
        "menu-dynamic",
        "menu-caret",
      ]);
    }

    // Invisible click/hover hit area covering the button
    const hit = k.add([
      k.rect(w, h),
      k.pos(x, y),
      k.area(),
      k.opacity(0),
      k.z(14),
      "menu-dynamic",
    ]);
    hit.onHover(() => {
      if (mode !== "main" || fading !== "idle") return;
      if (mainIndex === index) return;
      mainIndex = index;
      audio.playBlip("move");
      render();
    });
    hit.onClick(() => {
      if (mode !== "main" || fading !== "idle") return;
      audio.resume();
      audio.startMusic();
      if (disabled) {
        audio.playBlip("back");
        return;
      }
      mainIndex = index;
      mainActions[index].activate();
    });
  }

  function drawSettingsRow(
    row: SettingsRow,
    x: number,
    y: number,
    w: number,
    selected: boolean,
    index: number,
  ) {
    // Selection band
    if (selected) {
      k.add([
        k.rect(w + 16, 36),
        k.pos(x - 8, y - 4),
        k.color(k.Color.fromHex(SUN)),
        k.opacity(0.12),
        k.z(12),
        "menu-dynamic",
      ]);
      k.add([
        k.text(">", { size: 16, font: "monospace" }),
        k.pos(x - 18, y + 14),
        k.anchor("right"),
        k.color(k.Color.fromHex(PEACH)),
        k.opacity(1),
        k.z(14),
        "menu-dynamic",
        "menu-caret",
      ]);
    }

    if (row.kind === "slider") {
      k.add([
        k.text(row.label, { size: 13, font: "monospace" }),
        k.pos(x, y + 14),
        k.anchor("left"),
        k.color(k.Color.fromHex(selected ? SUN : PARCHMENT)),
        k.z(13),
        "menu-dynamic",
      ]);

      // 10-segment bar — leaves space for label on left and percent on right
      const segCount = 10;
      const segGap = 4;
      const barX = x + 110;
      const barW = w - 190;
      const segW = (barW - segGap * (segCount - 1)) / segCount;
      const filled = Math.round(row.get() * segCount);
      for (let i = 0; i < segCount; i++) {
        const on = i < filled;
        k.add([
          k.rect(segW, 16),
          k.pos(barX + i * (segW + segGap), y + 7),
          k.color(k.Color.fromHex(on ? (selected ? SUN : SAGE) : INK)),
          k.opacity(on ? 1 : 0.5),
          k.z(13),
          "menu-dynamic",
        ]);
      }

      k.add([
        k.text(`${Math.round(row.get() * 100)}%`, { size: 11, font: "monospace" }),
        k.pos(x + w, y + 14),
        k.anchor("right"),
        k.color(k.Color.fromHex(LAVENDER)),
        k.z(13),
        "menu-dynamic",
      ]);
    } else if (row.kind === "toggle") {
      k.add([
        k.text(row.label, { size: 13, font: "monospace" }),
        k.pos(x, y + 14),
        k.anchor("left"),
        k.color(k.Color.fromHex(selected ? SUN : PARCHMENT)),
        k.z(13),
        "menu-dynamic",
      ]);
      const state = row.get();
      k.add([
        k.text(state ? "[ ON ]" : "[ OFF ]", { size: 12, font: "monospace" }),
        k.pos(x + w, y + 14),
        k.anchor("right"),
        k.color(k.Color.fromHex(state ? PEACH : GRAY)),
        k.z(13),
        "menu-dynamic",
      ]);
    } else {
      // action
      k.add([
        k.text(row.label, { size: 14, font: "monospace" }),
        k.pos(x + w / 2, y + 14),
        k.anchor("center"),
        k.color(k.Color.fromHex(selected ? SUN : PARCHMENT)),
        k.z(13),
        "menu-dynamic",
      ]);
    }

    // Click/hover hit area for the row
    const hit = k.add([
      k.rect(w + 32, 36),
      k.pos(x - 16, y - 4),
      k.area(),
      k.opacity(0),
      k.z(15),
      "menu-dynamic",
    ]);
    hit.onHover(() => {
      if (mode !== "settings" || fading !== "idle") return;
      if (settingsIndex === index) return;
      settingsIndex = index;
      audio.playBlip("move");
      render();
    });
    hit.onClick(() => {
      if (mode !== "settings" || fading !== "idle") return;
      audio.resume();
      audio.startMusic();
      settingsIndex = index;
      if (row.kind === "toggle") {
        row.toggle();
        audio.playBlip("select");
        render();
      } else if (row.kind === "action") {
        row.activate();
      } else if (row.kind === "slider") {
        // Click position within the bar to set value
        const segCount = 10;
        const segGap = 4;
        const barX = x + 110;
        const barW = w - 190;
        const segW = (barW - segGap * (segCount - 1)) / segCount;
        // Use mouse pos in world coordinates
        const mouseX = k.mousePos().x;
        const localX = mouseX - barX;
        if (localX >= 0 && localX <= barW) {
          const fillFraction = localX / barW;
          const stepped = Math.round(fillFraction * segCount) / segCount;
          row.set(Math.max(0, Math.min(1, stepped)));
          audio.playBlip("move");
          render();
        }
      }
    });
  }

  function setFooter(text: string) {
    if (footerLabel) {
      footerLabel.text = text;
      return;
    }
    footerLabel = k.add([
      k.text(text, { size: 10, font: "monospace" }),
      k.pos(W / 2, H - 32),
      k.anchor("center"),
      k.color(k.Color.fromHex(LAVENDER)),
      k.opacity(0.8),
      k.z(20),
    ]) as GameObj<{ text: string }>;
  }

  // ── input handling ────────────────────────────────────────────

  k.onButtonPress("up", () => {
    if (fading !== "idle") return;
    if (mode === "main") {
      mainIndex = wrap(mainIndex - 1, mainActions.length);
      audio.playBlip("move");
      render();
    } else if (mode === "settings") {
      settingsIndex = wrap(settingsIndex - 1, settingsRows.length);
      audio.playBlip("move");
      render();
    }
  });

  k.onButtonPress("down", () => {
    if (fading !== "idle") return;
    if (mode === "main") {
      mainIndex = wrap(mainIndex + 1, mainActions.length);
      audio.playBlip("move");
      render();
    } else if (mode === "settings") {
      settingsIndex = wrap(settingsIndex + 1, settingsRows.length);
      audio.playBlip("move");
      render();
    }
  });

  k.onButtonPress("left", () => {
    if (fading !== "idle") return;
    if (mode !== "settings") return;
    const row = settingsRows[settingsIndex];
    if (row.kind === "slider") {
      row.set(Math.max(0, row.get() - 0.1));
      audio.playBlip("move");
      render();
    }
  });

  k.onButtonPress("right", () => {
    if (fading !== "idle") return;
    if (mode !== "settings") return;
    const row = settingsRows[settingsIndex];
    if (row.kind === "slider") {
      row.set(Math.min(1, row.get() + 0.1));
      audio.playBlip("move");
      render();
    }
  });

  k.onButtonPress("interact", () => {
    // Any key press counts as a gesture — unlock + start music if not yet running.
    audio.resume();
    audio.startMusic();

    if (fading !== "idle") return;

    if (mode === "main") {
      const action = mainActions[mainIndex];
      if (!action.enabled()) {
        audio.playBlip("back");
        return;
      }
      action.activate();
    } else if (mode === "settings") {
      const row = settingsRows[settingsIndex];
      if (row.kind === "toggle") {
        row.toggle();
        audio.playBlip("select");
        render();
      } else if (row.kind === "action") {
        row.activate();
      }
    } else if (mode === "credits") {
      goBackToMain();
    }
  });

  k.onButtonPress("back", () => {
    if (fading !== "idle") return;
    if (mode === "settings" || mode === "credits") {
      goBackToMain();
    }
  });

  // First mouse click anywhere also unlocks audio (browser autoplay policies).
  // In credits mode, any click returns to main.
  k.onClick(() => {
    audio.resume();
    audio.startMusic();
    if (fading !== "idle") return;
    if (mode === "credits") goBackToMain();
  });

  // ── update: fade + caret pulse ───────────────────────────────

  k.onUpdate(() => {
    const dt = k.dt();
    pulse += dt;

    // Caret pulse (tag all carets in a group and tween opacity together)
    const caretOpacity = 0.5 + 0.5 * Math.sin(pulse * 5);
    k.get("menu-caret").forEach((obj) => {
      const o = obj as GameObj<OpacityComp>;
      if ("opacity" in o) o.opacity = caretOpacity;
    });

    if (fading === "in") {
      fadeTime += dt;
      fade.opacity = Math.max(0, 1 - fadeTime / 0.6);
      if (fadeTime >= 0.6) {
        fade.opacity = 0;
        fading = "idle";
      }
    } else if (fading === "out") {
      fadeTime += dt;
      fade.opacity = Math.min(1, fadeTime / 0.45);
      if (fadeTime >= 0.45 && fadeTarget) {
        const target = fadeTarget;
        fadeTarget = null;
        k.go(target);
      }
    }
  });

  // Initial render
  render();
}

function wrap(i: number, n: number): number {
  return ((i % n) + n) % n;
}
