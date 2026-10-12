import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { AppHeader } from "@/core/auth/ui";

export const Route = createFileRoute("/_app")({
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/login" });
    }
    return { user: context.user };
  },
  component: AppShell,
});

function AppShell() {
  const { user } = Route.useRouteContext();

  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader user={user} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
