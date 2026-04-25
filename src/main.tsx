import { createRoot } from "react-dom/client";
import { App } from "./App";
import { useGameStore } from "./store/game-store";
import { useLoomStore } from "./store/loom-store";

// Expose stores on window for dev-only smoke testing.
if (import.meta.env.DEV) {
  (window as unknown as { __gameStore: typeof useGameStore }).__gameStore = useGameStore;
  (window as unknown as { __loomStore: typeof useLoomStore }).__loomStore = useLoomStore;
}

createRoot(document.getElementById("root")!).render(<App />);
