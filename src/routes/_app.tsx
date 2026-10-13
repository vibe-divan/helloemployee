import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { AppSidebar } from "@/core/auth/ui";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/lib/ui/sidebar";
import { TooltipProvider } from "@/lib/ui/tooltip";

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
    <SidebarProvider>
      <TooltipProvider>
        <AppSidebar user={user} />
        <SidebarInset>
          <div className="p-2 md:hidden">
            <SidebarTrigger />
          </div>
          <div className="flex-1 p-4 md:p-6">
            <Outlet />
          </div>
        </SidebarInset>
      </TooltipProvider>
    </SidebarProvider>
  );
}
