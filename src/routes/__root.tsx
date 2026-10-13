/// <reference types="vite/client" />

import type { ReactNode } from "react";
import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { getCurrentUser } from "@/core/auth";
import appCss from "../lib/ui/index.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "helloemployee",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  beforeLoad: async () => ({ user: await getCurrentUser() }),
  notFoundComponent: NotFound,
  component: RootComponent,
});

function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3">
      <h1 className="text-2xl font-semibold">Страница не найдена</h1>
      <Link to="/" className="text-sm text-primary underline underline-offset-4">
        На главную
      </Link>
    </div>
  );
}

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
