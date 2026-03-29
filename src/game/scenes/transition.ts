import type { GameObj, KAPLAYCtx, OpacityComp, PosComp } from "kaplay";

type MutableObj = GameObj<OpacityComp & PosComp>;

export function transitionScene(k: KAPLAYCtx) {
  const W = 800;
  const H = 600;

  // Black base
  k.add([
    k.rect(W, H),
    k.pos(0, 0),
    k.color(k.Color.fromHex("#000000")),
    k.z(0),
  ]);

  // --- Phase 1: RGB channel split bars (0 – 0.3s) ---
  type Bar = { obj: MutableObj; tx: number; ty: number };
  const barColors = ["#FF0040", "#00FFD4", "#FFE066"];
  const rgbBars: Bar[] = [];
  for (let i = 0; i < 9; i++) {
    const bh = 4 + Math.floor(k.rand(0, 10));
    const startX = k.rand(-W * 0.5, W * 0.5);
    const startY = k.rand(0, H - bh);
    const targetX = k.rand(0, W - 100);
    const targetY = k.rand(0, H - bh);
    const color = barColors[i % barColors.length];
    const obj = k.add([
      k.rect(80 + k.rand(0, 120), bh),
      k.pos(startX, startY),
      k.color(k.Color.fromHex(color)),
      k.opacity(0),
      k.z(5),
    ]) as MutableObj;
    rgbBars.push({ obj, tx: targetX, ty: targetY });
  }

  // --- Phase 2: Cyan scanline (0.3 – 0.6s) ---
  const scanline = k.add([
    k.rect(W, 6),
    k.pos(0, 0),
    k.color(k.Color.fromHex("#00FFD4")),
    k.opacity(0),
    k.z(6),
  ]) as MutableObj;

  // --- Phase 3: White flash (0.6 – 0.85s) ---
  const whiteFlash = k.add([
    k.rect(W, H),
    k.pos(0, 0),
    k.color(k.Color.fromHex("#FFFFFF")),
    k.opacity(0),
    k.z(8),
  ]) as GameObj<OpacityComp>;

  // --- Phase 4: Fade to black (0.85 – 1.2s) ---
  const blackFade = k.add([
    k.rect(W, H),
    k.pos(0, 0),
    k.color(k.Color.fromHex("#000000")),
    k.opacity(0),
    k.z(9),
  ]) as GameObj<OpacityComp>;

  let elapsed = 0;
  let done = false;

  k.onUpdate(() => {
    if (done) return;
    elapsed += k.dt();

    // Phase 1 (0 – 0.3s): scatter RGB bars into position
    if (elapsed <= 0.3) {
      const t = elapsed / 0.3;
      for (const bar of rgbBars) {
        bar.obj.opacity = t * 0.85;
        bar.obj.pos.x = bar.tx * t;
        bar.obj.pos.y = bar.ty * t;
      }
    } else {
      for (const bar of rgbBars) {
        bar.obj.opacity = Math.max(0, bar.obj.opacity - k.dt() * 4);
      }
    }

    // Phase 2 (0.3 – 0.6s): scanline sweep top→bottom
    if (elapsed >= 0.3 && elapsed <= 0.6) {
      const t = (elapsed - 0.3) / 0.3;
      scanline.opacity = 0.9;
      scanline.pos.y = t * H;
    } else if (elapsed > 0.6) {
      scanline.opacity = 0;
    }

    // Phase 3 (0.6 – 0.85s): white flash builds to full
    if (elapsed >= 0.6 && elapsed <= 0.85) {
      const t = (elapsed - 0.6) / 0.25;
      whiteFlash.opacity = t;
    } else if (elapsed > 0.85) {
      whiteFlash.opacity = 0;
    }

    // Phase 4 (0.85 – 1.2s): fade to black
    if (elapsed >= 0.85 && elapsed <= 1.2) {
      const t = (elapsed - 0.85) / 0.35;
      blackFade.opacity = t;
    }

    if (elapsed >= 1.2 && !done) {
      done = true;
      k.go("world");
    }
  });
}
