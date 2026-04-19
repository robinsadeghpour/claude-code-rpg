import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { claudeApiPlugin } from "./src/server/claude-api";
import { fileWatcherPlugin } from "./src/server/file-watcher-plugin";

export default defineConfig({
  plugins: [react(), claudeApiPlugin(), fileWatcherPlugin()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
