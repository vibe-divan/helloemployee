/// <reference types="vite/client" />

import type { ReactNode } from "react";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { getCurrentUser } from "@/core/auth";
import appCss from "../lib/ui/index.css?url";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
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
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <RootDocument>
        <Outlet />
      </RootDocument>
    </QueryClientProvider>
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
