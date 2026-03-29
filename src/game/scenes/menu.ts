import type { GameObj, KAPLAYCtx, OpacityComp, PosComp, RectComp } from "kaplay";

type CloudObj = GameObj<PosComp & RectComp & OpacityComp>;

export function menuScene(k: KAPLAYCtx) {
  const W = 800;
  const H = 600;

  // Layer 0: Deep sky
  k.add([
    k.rect(W, H * 0.6),
    k.pos(0, 0),
    k.color(k.Color.fromHex("#8BA4C8")),
    k.z(0),
  ]);

  // Layer 1: Warm horizon band
  k.add([
    k.rect(W, H * 0.25),
    k.pos(0, H * 0.35),
    k.color(k.Color.fromHex("#FFD4A8")),
    k.z(1),
  ]);

  // Layer 2: Mountain silhouettes
  const mountains = [
    { x: 0, w: 220, h: 140 },
    { x: 150, w: 200, h: 170 },
    { x: 300, w: 250, h: 130 },
    { x: 500, w: 220, h: 160 },
    { x: 650, w: 200, h: 145 },
  ];
  for (const m of mountains) {
    k.add([
      k.rect(m.w, m.h),
      k.pos(m.x, H * 0.42 - m.h),
      k.color(k.Color.fromHex("#6B8F5E")),
      k.z(2),
    ]);
  }

  // Layer 3: Rolling hills
  const hillData = [
    { x: -40, w: 300, h: 90 },
    { x: 200, w: 350, h: 100 },
    { x: 480, w: 380, h: 80 },
  ];
  for (const hd of hillData) {
    k.add([
      k.rect(hd.w, hd.h),
      k.pos(hd.x, H * 0.55 - hd.h),
      k.color(k.Color.fromHex("#7DB87A")),
      k.z(3),
    ]);
  }

  // Layer 4: Ground strip
  k.add([
    k.rect(W, H * 0.35),
    k.pos(0, H * 0.65),
    k.color(k.Color.fromHex("#5A9A55")),
    k.z(4),
  ]);

  // Clouds
  type CloudState = { obj: CloudObj; w: number; speed: number };
  const clouds: CloudState[] = [];
  const cloudData = [
    { x: 60, y: 40, w: 120, h: 30 },
    { x: 260, y: 70, w: 90, h: 22 },
    { x: 480, y: 35, w: 150, h: 28 },
    { x: 680, y: 60, w: 100, h: 24 },
    { x: 150, y: 90, w: 70, h: 18 },
  ];
  for (const cd of cloudData) {
    const obj = k.add([
      k.rect(cd.w, cd.h),
      k.pos(cd.x, cd.y),
      k.color(k.Color.fromHex("#FFFFFF")),
      k.opacity(0.75),
      k.z(5),
    ]) as CloudObj;
    clouds.push({ obj, w: cd.w, speed: 8 + k.rand(0, 10) });
  }

  // Title
  k.add([
    k.text("CLAUDE CODE RPG", { size: 48, font: "monospace" }),
    k.pos(W / 2, 190),
    k.anchor("center"),
    k.color(k.Color.fromHex("#FFE066")),
    k.z(10),
  ]);

  // Subtitle
  k.add([
    k.text("A developer got stuck in a broken game.", { size: 14, font: "monospace" }),
    k.pos(W / 2, 250),
    k.anchor("center"),
    k.color(k.Color.fromHex("#C4A8D8")),
    k.z(10),
  ]);

  // CTA button background
  const btnW = 220;
  const btnH = 44;
  const btnX = W / 2 - btnW / 2;
  const btnY = 340;
  k.add([
    k.rect(btnW, btnH),
    k.pos(btnX, btnY),
    k.color(k.Color.fromHex("#3A3A3A")),
    k.z(10),
  ]);

  // CTA button text
  k.add([
    k.text("Enter the Valley", { size: 18, font: "monospace" }),
    k.pos(W / 2, btnY + btnH / 2),
    k.anchor("center"),
    k.color(k.Color.fromHex("#FFE066")),
    k.z(11),
  ]);

  // Hint text
  k.add([
    k.text("[ E / SPACE / ENTER ]", { size: 10, font: "monospace" }),
    k.pos(W / 2, btnY + btnH + 14),
    k.anchor("center"),
    k.color(k.Color.fromHex("#C4A8D8")),
    k.opacity(0.6),
    k.z(10),
  ]);

  // Glitch overlay
  const glitchOverlay = k.add([
    k.rect(W, H),
    k.pos(0, 0),
    k.color(k.Color.fromHex("#00FFD4")),
    k.opacity(0),
    k.z(20),
  ]) as GameObj<OpacityComp>;

  let glitchCooldown = 8 + k.rand(0, 4);
  let glitchActive = false;
  let glitchTimer = 0;

  k.onUpdate(() => {
    // Drift clouds left, wrap around
    for (const cloud of clouds) {
      cloud.obj.pos.x -= cloud.speed * k.dt();
      if (cloud.obj.pos.x + cloud.w < 0) {
        cloud.obj.pos.x = W + k.rand(0, 60);
        cloud.obj.pos.y = k.rand(20, 100);
      }
    }

    // Glitch flicker
    glitchCooldown -= k.dt();
    if (!glitchActive && glitchCooldown <= 0) {
      glitchActive = true;
      glitchTimer = 0;
      glitchCooldown = 8 + k.rand(0, 4);
    }

    if (glitchActive) {
      glitchTimer += k.dt();
      if (glitchTimer < 0.15) {
        glitchOverlay.opacity = 0.18;
      } else if (glitchTimer < 0.22) {
        glitchOverlay.opacity = 0;
      } else if (glitchTimer < 0.27) {
        glitchOverlay.opacity = 0.12;
      } else {
        glitchOverlay.opacity = 0;
        glitchActive = false;
      }
    }
  });

  k.onButtonPress("interact", () => {
    k.go("transition");
  });
}
