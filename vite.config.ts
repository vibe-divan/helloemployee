import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// bunqueue's exports map resolves to a throwing Node stub under Vite's SSR
// conditions; point the specifier at the real Bun entry instead.
const bunqueueClient = fileURLToPath(
  new URL("./node_modules/bunqueue/dist/client/index.js", import.meta.url),
);
const bunqueueMain = fileURLToPath(
  new URL("./node_modules/bunqueue/dist/main.js", import.meta.url),
);

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      "bunqueue/client": bunqueueClient,
      bunqueue: bunqueueMain,
    },
  },
  server: {
    port: Bun.env.PORT ? Number.parseInt(Bun.env.PORT) : 3000,
  },

  plugins: [
    tanstackStart({
      // app is static-only
      spa: { enabled: true },
      router: {
        generatedRouteTree: "./router-tree.gen.ts",
      },
    }),

    // react vite plugin must come after start vite plugin
    viteReact(),
    tailwindcss(),
  ],
});
