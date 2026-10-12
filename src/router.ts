import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./router-tree.gen.ts";

export function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultViewTransition: true,
  });
  return router;
}
