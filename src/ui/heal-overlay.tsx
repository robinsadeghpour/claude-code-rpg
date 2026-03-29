import { useEffect, useState } from "react";
import { useGameStore } from "../store/game-store";

type Phase = "flash" | "bloom" | "settle" | "done";

export function HealOverlay() {
  const { isHealing, finishHeal } = useGameStore();
  const [phase, setPhase] = useState<Phase>("flash");

  useEffect(() => {
    if (!isHealing) return;

    setPhase("flash");

    const t1 = setTimeout(() => setPhase("bloom"), 200);
    const t2 = setTimeout(() => setPhase("settle"), 1200);
    const t3 = setTimeout(() => setPhase("done"), 2000);
    const t4 = setTimeout(() => finishHeal(), 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isHealing, finishHeal]);

  if (!isHealing) return null;

  const styleByPhase: Record<Phase, React.CSSProperties> = {
    flash: { background: "white", opacity: 1 },
    bloom: {
      background: "radial-gradient(circle, #FFE066 0%, #88D4B0 100%)",
      opacity: 0.6,
    },
    settle: {
      background: "radial-gradient(circle, #88D4B0 0%, transparent 100%)",
      opacity: 0.3,
    },
    done: { background: "transparent", opacity: 0 },
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        pointerEvents: "none",
        transition: "opacity 0.4s ease, background 0.4s ease",
        ...styleByPhase[phase],
      }}
    />
  );
}
