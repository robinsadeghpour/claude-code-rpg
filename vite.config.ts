import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { claudeApiPlugin } from "./src/server/claude-api";

export default defineConfig({
  plugins: [react(), claudeApiPlugin()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
