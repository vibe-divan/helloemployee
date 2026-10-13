import { createRouter } from "@tanstack/react-router";
import { createQueryClient } from "@/lib/query";
import { routeTree } from "./router-tree.gen.ts";

export function getRouter() {
  const queryClient = createQueryClient();
  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultViewTransition: true,
  });
  return router;
}
