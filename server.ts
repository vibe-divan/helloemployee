/**
 * Production entry. The backend serves the built SPA (dist/client) as static
 * files and delegates everything else (server functions, routes) to the
 * TanStack Start handler. No SSR.
 *
 * Run after `bun run build`: `bun run start`.
 */

import { log } from "@/lib/log";

interface ServerEntry {
  fetch: (request: Request) => Response | Promise<Response>;
}

const clientRoot = new URL("./dist/client/", import.meta.url);
const entryPath = new URL("./dist/server/server.js", import.meta.url).href;

const { default: entry } = (await import(entryPath)) as { default: ServerEntry };

const port = Bun.env.PORT ? Number.parseInt(Bun.env.PORT) : 3000;

async function serveClientFile(pathname: string): Promise<Response | undefined> {
  if (pathname.includes("..")) {
    return undefined;
  }

  const file = Bun.file(new URL(`.${pathname}`, clientRoot));
  return (await file.exists()) ? new Response(file) : undefined;
}

Bun.serve({
  port,
  async fetch(request) {
    const { pathname } = new URL(request.url);
    const asset = await serveClientFile(pathname);
    return asset ?? entry.fetch(request);
  },
});

log.info(`Serving static + server functions on http://localhost:${port}`);
