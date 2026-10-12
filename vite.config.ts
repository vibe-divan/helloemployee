import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  server: {
    port: Bun.env.PORT ? Number.parseInt(Bun.env.PORT) : 3000,
  },

  plugins: [
    tanstackStart({
      router: {
        generatedRouteTree: "./router-tree.gen.ts",
      },
    }),

    // react vite plugin must come after start vite plugin
    viteReact(),
  ],
});
