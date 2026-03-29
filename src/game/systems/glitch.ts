import type { GameObj, KAPLAYCtx } from "kaplay";

export function addGlitchOverlay(
  k: KAPLAYCtx,
  x: number,
  y: number,
  w: number,
  h: number,
): GameObj {
  // 1. Purple desaturation overlay
  const overlay = k.add([
    k.rect(w, h),
    k.pos(x, y),
    k.color(k.Color.fromHex("#9B30FF")),
    k.opacity(0.08),
    k.z(15),
    "glitch-overlay",
  ]);

  // Random flicker: every 2–5 seconds, bump opacity to 0.15 for 0.15s
  const scheduleFlicker = () => {
    const delay = 2 + k.rand(0, 3);
    k.wait(delay, () => {
      if (!overlay.exists()) return;
      overlay.opacity = 0.15;
      k.wait(0.15, () => {
        if (!overlay.exists()) return;
        overlay.opacity = 0.08;
        scheduleFlicker();
      });
    });
  };
  scheduleFlicker();

  // 2. Moving cyan scanline
  const scanline = k.add([
    k.rect(w, 2),
    k.pos(x, y),
    k.color(k.Color.fromHex("#00FFD4")),
    k.opacity(0.15),
    k.z(16),
    "glitch-scanline",
  ]);

  scanline.onUpdate(() => {
    scanline.pos.y += 40 * k.dt();
    if (scanline.pos.y > y + h) {
      scanline.pos.y = y;
    }
  });

  return overlay;
}

export function removeGlitchEffects(k: KAPLAYCtx) {
  k.get("glitch-overlay").forEach((obj) => k.destroy(obj));
  k.get("glitch-scanline").forEach((obj) => k.destroy(obj));
}
