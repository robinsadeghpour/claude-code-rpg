import type { GameObj, KAPLAYCtx, OpacityComp, PosComp, RectComp } from "kaplay";

type CloudObj = GameObj<PosComp & RectComp & OpacityComp>;

export function menuScene(k: KAPLAYCtx) {
  const W = 800;
  const H = 600;

  // ── Sky gradient bands (deep blue -> light blue -> peach at horizon) ──
  const skyBands = [
    { y: 0, h: H * 0.15, color: "#5B7BB5" },
    { y: H * 0.15, h: H * 0.15, color: "#7BA3CB" },
    { y: H * 0.3, h: H * 0.15, color: "#8BB8D8" },
    { y: H * 0.45, h: H * 0.15, color: "#FFD4A8" },
  ];
  for (const band of skyBands) {
    k.add([
      k.rect(W, band.h + 1),
      k.pos(0, band.y),
      k.color(k.Color.fromHex(band.color)),
      k.z(0),
    ]);
  }

  // ── Stars (tiny dots in upper sky) ──
  type StarObj = GameObj<OpacityComp>;
  const stars: { obj: StarObj; baseOpacity: number }[] = [];
  for (let i = 0; i < 22; i++) {
    const sx = k.rand(10, W - 10);
    const sy = k.rand(5, H * 0.35);
    const baseOp = k.rand(0.25, 0.5);
    const size = k.rand(1, 3) < 2 ? 2 : 3;
    const starObj = k.add([
      k.rect(size, size),
      k.pos(sx, sy),
      k.color(k.Color.fromHex("#FFFFFF")),
      k.opacity(baseOp),
      k.z(1),
    ]) as StarObj;
    stars.push({ obj: starObj, baseOpacity: baseOp });
  }

  // Star twinkle state
  let twinkleTimer = k.rand(1, 3);
  let twinklingStarIdx = -1;
  let twinklePhase = 0;

  // ── Back mountains (dark blue-green, parallax layer) ──
  const backMtnZ = 2;
  const backMtnColor = "#4A6B5A";
  const backMtnBaseY = H * 0.42;

  // Build mountain peaks from overlapping rects of decreasing width
  function addMountainPeak(
    cx: number,
    baseY: number,
    peakH: number,
    baseW: number,
    color: string,
    z: number,
    drift: { objs: GameObj<PosComp>[] },
  ) {
    const layers = 8;
    for (let i = 0; i < layers; i++) {
      const t = i / (layers - 1);
      const w = baseW * (1 - t * 0.85);
      const h = peakH / layers + 1;
      const y = baseY - peakH * ((i + 1) / layers);
      const x = cx - w / 2;
      const obj = k.add([
        k.rect(w, h + 1),
        k.pos(x, y),
        k.color(k.Color.fromHex(color)),
        k.z(z),
      ]);
      drift.objs.push(obj);
    }
    // Fill base
    const baseObj = k.add([
      k.rect(baseW, 20),
      k.pos(cx - baseW / 2, baseY - 20),
      k.color(k.Color.fromHex(color)),
      k.z(z),
    ]);
    drift.objs.push(baseObj);
  }

  // Snow cap helper
  function addSnowCap(
    cx: number,
    baseY: number,
    peakH: number,
    z: number,
    drift: { objs: GameObj<PosComp>[] },
  ) {
    const capW = 12;
    const capH = 6;
    const obj = k.add([
      k.rect(capW, capH),
      k.pos(cx - capW / 2, baseY - peakH - 2),
      k.color(k.Color.fromHex("#E8EEF0")),
      k.opacity(0.85),
      k.z(z + 1),
    ]);
    drift.objs.push(obj);
  }

  // Parallax groups
  const backMtnDrift: { objs: GameObj<PosComp>[] } = { objs: [] };
  const frontMtnDrift: { objs: GameObj<PosComp>[] } = { objs: [] };
  const backHillDrift: { objs: GameObj<PosComp>[] } = { objs: [] };
  const frontHillDrift: { objs: GameObj<PosComp>[] } = { objs: [] };

  // Back mountain peaks
  const backPeaks = [
    { cx: 80, h: 140, w: 180 },
    { cx: 250, h: 175, w: 200 },
    { cx: 440, h: 130, w: 170 },
    { cx: 620, h: 165, w: 190 },
    { cx: 760, h: 120, w: 160 },
  ];
  for (const p of backPeaks) {
    addMountainPeak(p.cx, backMtnBaseY, p.h, p.w, backMtnColor, backMtnZ, backMtnDrift);
  }
  // Snow on the two tallest
  addSnowCap(250, backMtnBaseY, 175, backMtnZ, backMtnDrift);
  addSnowCap(620, backMtnBaseY, 165, backMtnZ, backMtnDrift);

  // ── Front mountains (medium green) ──
  const frontMtnZ = 3;
  const frontMtnColor = "#5C8F5E";
  const frontMtnBaseY = H * 0.48;

  const frontPeaks = [
    { cx: 140, h: 110, w: 200 },
    { cx: 400, h: 95, w: 220 },
    { cx: 660, h: 105, w: 200 },
  ];
  for (const p of frontPeaks) {
    addMountainPeak(p.cx, frontMtnBaseY, p.h, p.w, frontMtnColor, frontMtnZ, frontMtnDrift);
  }

  // ── Back hills ──
  const backHillZ = 4;
  const backHillBaseY = H * 0.55;
  const backHillData = [
    { x: -30, w: 280, h: 55 },
    { x: 200, w: 320, h: 65 },
    { x: 470, w: 250, h: 50 },
    { x: 650, w: 200, h: 60 },
  ];
  for (const hd of backHillData) {
    // Main hill body
    const obj1 = k.add([
      k.rect(hd.w, hd.h),
      k.pos(hd.x, backHillBaseY - hd.h),
      k.color(k.Color.fromHex("#6BA368")),
      k.z(backHillZ),
    ]);
    backHillDrift.objs.push(obj1);
    // Rounded top (wider rect on top for softer look)
    const obj2 = k.add([
      k.rect(hd.w * 0.7, hd.h * 0.3),
      k.pos(hd.x + hd.w * 0.15, backHillBaseY - hd.h - hd.h * 0.15),
      k.color(k.Color.fromHex("#6BA368")),
      k.z(backHillZ),
    ]);
    backHillDrift.objs.push(obj2);
  }

  // ── Front hills ──
  const frontHillZ = 5;
  const frontHillBaseY = H * 0.62;
  const frontHillData = [
    { x: -60, w: 320, h: 50 },
    { x: 220, w: 300, h: 55 },
    { x: 500, w: 360, h: 48 },
  ];
  for (const hd of frontHillData) {
    const obj1 = k.add([
      k.rect(hd.w, hd.h),
      k.pos(hd.x, frontHillBaseY - hd.h),
      k.color(k.Color.fromHex("#7DB87A")),
      k.z(frontHillZ),
    ]);
    frontHillDrift.objs.push(obj1);
    const obj2 = k.add([
      k.rect(hd.w * 0.65, hd.h * 0.35),
      k.pos(hd.x + hd.w * 0.175, frontHillBaseY - hd.h - hd.h * 0.15),
      k.color(k.Color.fromHex("#7DB87A")),
      k.z(frontHillZ),
    ]);
    frontHillDrift.objs.push(obj2);
  }

  // ── Tree silhouettes on hills ──
  const treePositions = [
    { x: 80, y: frontHillBaseY - 52 },
    { x: 160, y: frontHillBaseY - 48 },
    { x: 310, y: frontHillBaseY - 56 },
    { x: 450, y: frontHillBaseY - 44 },
    { x: 560, y: frontHillBaseY - 50 },
    { x: 700, y: frontHillBaseY - 46 },
    { x: 370, y: backHillBaseY - 58 },
    { x: 530, y: backHillBaseY - 52 },
  ];
  for (const t of treePositions) {
    // Trunk
    k.add([
      k.rect(3, 8),
      k.pos(t.x, t.y + 4),
      k.color(k.Color.fromHex("#3D5A3A")),
      k.z(frontHillZ + 1),
    ]);
    // Foliage layers (triangle-ish via stacked rects)
    for (let i = 0; i < 3; i++) {
      const w = 10 - i * 2;
      k.add([
        k.rect(w, 5),
        k.pos(t.x + 1.5 - w / 2, t.y - i * 4),
        k.color(k.Color.fromHex("#2E4A2C")),
        k.z(frontHillZ + 1),
      ]);
    }
  }

  // ── Village silhouette on back hills ──
  const villageBaseY = backHillBaseY - 50;
  const villageX = 340;

  // House 1
  k.add([k.rect(18, 14), k.pos(villageX, villageBaseY), k.color(k.Color.fromHex("#4A5A48")), k.z(backHillZ + 1)]);
  // Roof 1 (two stacked rects for triangle shape)
  k.add([k.rect(22, 4), k.pos(villageX - 2, villageBaseY - 4), k.color(k.Color.fromHex("#5A3A30")), k.z(backHillZ + 1)]);
  k.add([k.rect(16, 4), k.pos(villageX + 1, villageBaseY - 8), k.color(k.Color.fromHex("#5A3A30")), k.z(backHillZ + 1)]);
  // Window 1
  k.add([k.rect(3, 3), k.pos(villageX + 5, villageBaseY + 4), k.color(k.Color.fromHex("#FFD080")), k.opacity(0.9), k.z(backHillZ + 2)]);
  k.add([k.rect(3, 3), k.pos(villageX + 11, villageBaseY + 4), k.color(k.Color.fromHex("#FFD080")), k.opacity(0.9), k.z(backHillZ + 2)]);

  // House 2
  k.add([k.rect(14, 12), k.pos(villageX + 28, villageBaseY + 2), k.color(k.Color.fromHex("#4A5A48")), k.z(backHillZ + 1)]);
  k.add([k.rect(18, 4), k.pos(villageX + 26, villageBaseY - 2), k.color(k.Color.fromHex("#5A3A30")), k.z(backHillZ + 1)]);
  k.add([k.rect(12, 3), k.pos(villageX + 29, villageBaseY - 5), k.color(k.Color.fromHex("#5A3A30")), k.z(backHillZ + 1)]);
  // Window 2
  k.add([k.rect(3, 3), k.pos(villageX + 33, villageBaseY + 6), k.color(k.Color.fromHex("#FFD080")), k.opacity(0.85), k.z(backHillZ + 2)]);

  // Church / tower
  k.add([k.rect(10, 22), k.pos(villageX + 52, villageBaseY - 8), k.color(k.Color.fromHex("#4A5A48")), k.z(backHillZ + 1)]);
  k.add([k.rect(6, 8), k.pos(villageX + 54, villageBaseY - 16), k.color(k.Color.fromHex("#4A5A48")), k.z(backHillZ + 1)]);
  k.add([k.rect(14, 4), k.pos(villageX + 50, villageBaseY - 4), k.color(k.Color.fromHex("#5A3A30")), k.z(backHillZ + 1)]);
  // Tower window
  k.add([k.rect(2, 3), k.pos(villageX + 56, villageBaseY - 12), k.color(k.Color.fromHex("#FFD080")), k.opacity(0.95), k.z(backHillZ + 2)]);

  // House 3
  k.add([k.rect(16, 13), k.pos(villageX + 72, villageBaseY + 1), k.color(k.Color.fromHex("#4A5A48")), k.z(backHillZ + 1)]);
  k.add([k.rect(20, 4), k.pos(villageX + 70, villageBaseY - 3), k.color(k.Color.fromHex("#5A3A30")), k.z(backHillZ + 1)]);
  k.add([k.rect(14, 3), k.pos(villageX + 73, villageBaseY - 6), k.color(k.Color.fromHex("#5A3A30")), k.z(backHillZ + 1)]);
  k.add([k.rect(3, 3), k.pos(villageX + 77, villageBaseY + 5), k.color(k.Color.fromHex("#FFD080")), k.opacity(0.8), k.z(backHillZ + 2)]);

  // ── Ground ──
  k.add([
    k.rect(W, H * 0.38),
    k.pos(0, H * 0.62),
    k.color(k.Color.fromHex("#5A9A55")),
    k.z(6),
  ]);

  // Darker grass strip at top of ground
  k.add([
    k.rect(W, 6),
    k.pos(0, H * 0.62),
    k.color(k.Color.fromHex("#4E8A49")),
    k.z(6),
  ]);

  // ── Fence line ──
  const fenceY = H * 0.68;
  // Posts
  for (let fx = 40; fx < W; fx += 50) {
    k.add([
      k.rect(4, 14),
      k.pos(fx, fenceY - 10),
      k.color(k.Color.fromHex("#8B6A4A")),
      k.z(7),
    ]);
  }
  // Rails
  k.add([k.rect(W - 60, 2), k.pos(30, fenceY - 6), k.color(k.Color.fromHex("#A07A55")), k.z(7)]);
  k.add([k.rect(W - 60, 2), k.pos(30, fenceY), k.color(k.Color.fromHex("#A07A55")), k.z(7)]);

  // ── Path (leading from bottom center into distance) ──
  const pathParts = [
    { x: 370, y: H * 0.72, w: 60, h: 30, color: "#C4A86A" },
    { x: 375, y: H * 0.76, w: 55, h: 30, color: "#C4A86A" },
    { x: 372, y: H * 0.80, w: 58, h: 30, color: "#C4A86A" },
    { x: 368, y: H * 0.84, w: 64, h: 30, color: "#C4A86A" },
    { x: 364, y: H * 0.88, w: 72, h: 30, color: "#C4A86A" },
    { x: 358, y: H * 0.92, w: 84, h: 30, color: "#C4A86A" },
    { x: 350, y: H * 0.96, w: 100, h: 30, color: "#C4A86A" },
  ];
  for (const pp of pathParts) {
    k.add([
      k.rect(pp.w, pp.h),
      k.pos(pp.x, pp.y),
      k.color(k.Color.fromHex(pp.color)),
      k.opacity(0.6),
      k.z(6),
    ]);
    // Path border (darker edge)
    k.add([k.rect(2, pp.h), k.pos(pp.x - 1, pp.y), k.color(k.Color.fromHex("#9A8855")), k.opacity(0.4), k.z(6)]);
    k.add([k.rect(2, pp.h), k.pos(pp.x + pp.w - 1, pp.y), k.color(k.Color.fromHex("#9A8855")), k.opacity(0.4), k.z(6)]);
  }

  // ── Wildflowers ──
  const flowerColors = ["#FF88AA", "#FFDD66", "#FFFFFF", "#FF99CC", "#AADDFF"];
  for (let i = 0; i < 45; i++) {
    const fx = k.rand(10, W - 10);
    const fy = k.rand(H * 0.63, H * 0.95);
    // Skip flowers on the path
    if (fx > 345 && fx < 460 && fy > H * 0.7) continue;
    const fc = flowerColors[Math.floor(k.rand(0, flowerColors.length))];
    k.add([
      k.rect(2, 2),
      k.pos(fx, fy),
      k.color(k.Color.fromHex(fc)),
      k.opacity(k.rand(0.5, 0.85)),
      k.z(7),
    ]);
  }

  // ── Clouds (puffy, multi-rect) ──
  type CloudState = { objs: CloudObj[]; speed: number; baseX: number; baseY: number };
  const clouds: CloudState[] = [];

  function addCloud(bx: number, by: number, scale: number, speed: number) {
    const parts = [
      { dx: 0, dy: 6, w: 60 * scale, h: 14 * scale },
      { dx: 8 * scale, dy: 0, w: 44 * scale, h: 12 * scale },
      { dx: -6 * scale, dy: 4, w: 30 * scale, h: 10 * scale },
      { dx: 30 * scale, dy: 2, w: 26 * scale, h: 12 * scale },
    ];
    const objs: CloudObj[] = [];
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      const isEdge = i === 2 || i === 3;
      const obj = k.add([
        k.rect(p.w, p.h),
        k.pos(bx + p.dx, by + p.dy),
        k.color(k.Color.fromHex("#FFFFFF")),
        k.opacity(isEdge ? 0.6 : 0.8),
        k.z(8),
      ]) as CloudObj;
      objs.push(obj);
    }
    clouds.push({ objs, speed, baseX: bx, baseY: by });
  }

  addCloud(60, 30, 1.2, 10);
  addCloud(260, 65, 0.9, 7);
  addCloud(480, 25, 1.4, 12);
  addCloud(700, 55, 1.0, 9);
  addCloud(150, 90, 0.7, 6);

  // ── Birds (V-shapes drifting across sky) ──
  type BirdObj = { parts: GameObj<PosComp>[]; x: number; y: number; speed: number };
  const birds: BirdObj[] = [];

  function addBird(bx: number, by: number, speed: number) {
    const leftWing = k.add([
      k.rect(5, 2),
      k.pos(bx - 5, by),
      k.color(k.Color.fromHex("#3A3A3A")),
      k.opacity(0.5),
      k.z(9),
    ]);
    const rightWing = k.add([
      k.rect(5, 2),
      k.pos(bx + 1, by),
      k.color(k.Color.fromHex("#3A3A3A")),
      k.opacity(0.5),
      k.z(9),
    ]);
    const tip1 = k.add([
      k.rect(2, 2),
      k.pos(bx - 5, by - 2),
      k.color(k.Color.fromHex("#3A3A3A")),
      k.opacity(0.5),
      k.z(9),
    ]);
    const tip2 = k.add([
      k.rect(2, 2),
      k.pos(bx + 4, by - 2),
      k.color(k.Color.fromHex("#3A3A3A")),
      k.opacity(0.5),
      k.z(9),
    ]);
    birds.push({ parts: [leftWing, rightWing, tip1, tip2], x: bx, y: by, speed });
  }

  addBird(k.rand(100, 600), k.rand(40, 110), k.rand(15, 25));
  addBird(k.rand(100, 600), k.rand(40, 110), k.rand(15, 25));

  // ── Fireflies ──
  type Firefly = { obj: GameObj<PosComp & OpacityComp>; baseX: number; baseY: number; phase: number; speed: number };
  const fireflies: Firefly[] = [];

  for (let i = 0; i < 5; i++) {
    const fx = k.rand(50, W - 50);
    const fy = k.rand(H * 0.55, H * 0.85);
    const ffObj = k.add([
      k.rect(3, 3),
      k.pos(fx, fy),
      k.color(k.Color.fromHex("#FFEE77")),
      k.opacity(0),
      k.z(9),
    ]) as GameObj<PosComp & OpacityComp>;
    fireflies.push({
      obj: ffObj,
      baseX: fx,
      baseY: fy,
      phase: k.rand(0, Math.PI * 2),
      speed: k.rand(0.3, 0.7),
    });
  }

  // ── Title shadow + text ──
  k.add([
    k.text("CLAUDE CODE RPG", { size: 48, font: "monospace" }),
    k.pos(W / 2 + 3, 193),
    k.anchor("center"),
    k.color(k.Color.fromHex("#2A1A0A")),
    k.opacity(0.5),
    k.z(10),
  ]);
  k.add([
    k.text("CLAUDE CODE RPG", { size: 48, font: "monospace" }),
    k.pos(W / 2, 190),
    k.anchor("center"),
    k.color(k.Color.fromHex("#FFE066")),
    k.z(10),
  ]);

  // ── Subtitle ──
  k.add([
    k.text("A developer got stuck in a broken game.", { size: 14, font: "monospace" }),
    k.pos(W / 2, 250),
    k.anchor("center"),
    k.color(k.Color.fromHex("#C4A8D8")),
    k.z(10),
  ]);

  // ── 3D Pixel button ──
  const btnW = 220;
  const btnH = 44;
  const btnX = W / 2 - btnW / 2;
  const btnY = 340;
  const borderPx = 3;

  // Button shadow (bottom-right darker border)
  k.add([
    k.rect(btnW + borderPx, btnH + borderPx),
    k.pos(btnX, btnY),
    k.color(k.Color.fromHex("#1A1A1A")),
    k.z(10),
  ]);
  // Button highlight (top-left lighter border)
  k.add([
    k.rect(btnW, btnH),
    k.pos(btnX, btnY),
    k.color(k.Color.fromHex("#5A5A5A")),
    k.z(10),
  ]);
  // Button face
  k.add([
    k.rect(btnW - borderPx * 2, btnH - borderPx * 2),
    k.pos(btnX + borderPx, btnY + borderPx),
    k.color(k.Color.fromHex("#3A3A3A")),
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

  // ── Hint text ──
  k.add([
    k.text("( E / SPACE / ENTER )", { size: 10, font: "monospace" }),
    k.pos(W / 2, btnY + btnH + 18),
    k.anchor("center"),
    k.color(k.Color.fromHex("#C4A8D8")),
    k.opacity(0.6),
    k.z(10),
  ]);

  // ── Glitch overlay ──
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

  // ── Main update loop ──
  let totalTime = 0;

  k.onUpdate(() => {
    const dt = k.dt();
    totalTime += dt;

    // ── Cloud drift ──
    for (const cloud of clouds) {
      const dx = cloud.speed * dt;
      for (const obj of cloud.objs) {
        obj.pos.x -= dx;
      }
      cloud.baseX -= dx;
      // Wrap around
      if (cloud.baseX + 100 < 0) {
        const resetX = W + k.rand(0, 80);
        const offsetX = resetX - cloud.baseX;
        for (const obj of cloud.objs) {
          obj.pos.x += offsetX;
        }
        cloud.baseX = resetX;
        cloud.baseY = k.rand(20, 100);
      }
    }

    // ── Parallax drift (very slow) ──
    const backMtnSpeed = 0.3 * dt;
    const frontMtnSpeed = 0.5 * dt;
    const backHillSpeed = 0.8 * dt;
    const frontHillSpeed = 1.2 * dt;

    // Oscillating parallax (sway back and forth)
    const sway = Math.sin(totalTime * 0.05);
    const backMtnDx = sway * backMtnSpeed;
    const frontMtnDx = sway * frontMtnSpeed;
    const backHillDx = sway * backHillSpeed;
    const frontHillDx = sway * frontHillSpeed;

    for (const obj of backMtnDrift.objs) obj.pos.x += backMtnDx;
    for (const obj of frontMtnDrift.objs) obj.pos.x += frontMtnDx;
    for (const obj of backHillDrift.objs) obj.pos.x += backHillDx;
    for (const obj of frontHillDrift.objs) obj.pos.x += frontHillDx;

    // ── Star twinkle ──
    twinkleTimer -= dt;
    if (twinkleTimer <= 0 && twinklingStarIdx < 0) {
      twinklingStarIdx = Math.floor(k.rand(0, stars.length));
      twinklePhase = 0;
    }
    if (twinklingStarIdx >= 0) {
      twinklePhase += dt;
      const star = stars[twinklingStarIdx];
      if (twinklePhase < 0.3) {
        star.obj.opacity = star.baseOpacity + 0.4;
      } else if (twinklePhase < 0.6) {
        star.obj.opacity = star.baseOpacity;
      } else {
        star.obj.opacity = star.baseOpacity;
        twinklingStarIdx = -1;
        twinkleTimer = k.rand(1.5, 3.5);
      }
    }

    // ── Fireflies ──
    for (const ff of fireflies) {
      ff.phase += ff.speed * dt;
      const flickerCycle = Math.sin(ff.phase);
      ff.obj.opacity = Math.max(0, flickerCycle * 0.7);
      ff.obj.pos.x = ff.baseX + Math.sin(ff.phase * 0.7) * 8;
      ff.obj.pos.y = ff.baseY + Math.cos(ff.phase * 0.5) * 5;
    }

    // ── Birds drift ──
    for (const bird of birds) {
      bird.x += bird.speed * dt;
      const wingY = Math.sin(totalTime * 3 + bird.x * 0.1) * 1;
      bird.parts[0].pos.x = bird.x - 5;
      bird.parts[0].pos.y = bird.y + wingY;
      bird.parts[1].pos.x = bird.x + 1;
      bird.parts[1].pos.y = bird.y + wingY;
      bird.parts[2].pos.x = bird.x - 5;
      bird.parts[2].pos.y = bird.y - 2 + wingY;
      bird.parts[3].pos.x = bird.x + 4;
      bird.parts[3].pos.y = bird.y - 2 + wingY;

      if (bird.x > W + 20) {
        bird.x = -20;
        bird.y = k.rand(40, 110);
      }
    }

    // ── Glitch flicker ──
    glitchCooldown -= dt;
    if (!glitchActive && glitchCooldown <= 0) {
      glitchActive = true;
      glitchTimer = 0;
      glitchCooldown = 8 + k.rand(0, 4);
    }

    if (glitchActive) {
      glitchTimer += dt;
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

  // ── Button handler ──
  k.onButtonPress("interact", () => {
    k.go("transition");
  });
}
