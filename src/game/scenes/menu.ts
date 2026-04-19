import type { KAPLAYCtx } from "kaplay";

export function menuScene(k: KAPLAYCtx) {
  const W = 800;
  const H = 600;

  // Background sprite (Gemini-generated village scene)
  k.add([
    k.sprite("menu-background"),
    k.pos(0, 0),
    k.scale(W / 1024, H / 1024), // Scale to fit canvas (Gemini outputs 1024x1024)
    k.z(0),
  ]);

  // Warm golden overlay for cohesion
  k.add([
    k.rect(W, H),
    k.pos(0, 0),
    k.color(k.Color.fromHex("#FFF8D0")),
    k.opacity(0.08),
    k.z(1),
  ]);

  // Title shadow
  k.add([
    k.text("CLAUDE CODE RPG", { size: 48, font: "monospace" }),
    k.pos(W / 2 + 3, 173),
    k.anchor("center"),
    k.color(k.Color.fromHex("#2A1A0A")),
    k.opacity(0.5),
    k.z(10),
  ]);

  // Title
  k.add([
    k.text("CLAUDE CODE RPG", { size: 48, font: "monospace" }),
    k.pos(W / 2, 170),
    k.anchor("center"),
    k.color(k.Color.fromHex("#FFE066")),
    k.z(10),
  ]);

  // Subtitle
  k.add([
    k.text("You got stuck in your own unfinished game.", {
      size: 14,
      font: "monospace",
    }),
    k.pos(W / 2, 230),
    k.anchor("center"),
    k.color(k.Color.fromHex("#C4A8D8")),
    k.z(10),
  ]);

  // Button
  const btnW = 220;
  const btnH = 44;
  const btnX = W / 2 - btnW / 2;
  const btnY = 320;

  // Button shadow
  k.add([
    k.rect(btnW + 3, btnH + 3),
    k.pos(btnX, btnY),
    k.color(k.Color.fromHex("#1A1A1A")),
    k.z(10),
  ]);
  // Button face
  k.add([
    k.rect(btnW, btnH),
    k.pos(btnX, btnY),
    k.color(k.Color.fromHex("#3A3A3A")),
    k.z(10),
  ]);
  // Button highlight
  k.add([
    k.rect(btnW - 6, btnH - 6),
    k.pos(btnX + 3, btnY + 3),
    k.color(k.Color.fromHex("#444444")),
    k.z(10),
  ]);
  // Button text
  k.add([
    k.text("Enter the Valley", { size: 18, font: "monospace" }),
    k.pos(W / 2, btnY + btnH / 2),
    k.anchor("center"),
    k.color(k.Color.fromHex("#FFE066")),
    k.z(11),
  ]);

  // Hint
  k.add([
    k.text("( E / SPACE / ENTER )", { size: 10, font: "monospace" }),
    k.pos(W / 2, btnY + btnH + 18),
    k.anchor("center"),
    k.color(k.Color.fromHex("#C4A8D8")),
    k.opacity(0.6),
    k.z(10),
  ]);

  // Button handler
  k.onButtonPress("interact", () => {
    k.go("transition");
  });
}
