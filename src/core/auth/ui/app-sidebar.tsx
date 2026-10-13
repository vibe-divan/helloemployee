import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BoxesIcon,
  FilesIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react";
import { signOutMutation, type AuthUser } from "@/core/auth";
import { Avatar, AvatarFallback } from "@/lib/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/lib/ui/sidebar";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboardIcon },
  { to: "/journal", label: "Журнал", icon: FilesIcon },
  { to: "/prompts", label: "Промпты", icon: SparklesIcon },
  { to: "/user", label: "Users", icon: UsersIcon },
] as const;

export function AppSidebar({ user }: { user: AuthUser }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const signOut = useMutation(signOutMutation);
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const initials = user.login.slice(0, 2).toUpperCase();

  async function handleSignOut() {
    try {
      await signOut.mutateAsync();
      queryClient.clear();
      await router.invalidate();
      await router.navigate({ to: "/login" });
    } catch {
      // Sign out must not leave the user stuck; the session is cleared server-side anyway.
      window.location.assign("/login");
    }
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="helloemployee" render={<Link to="/" />}>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <BoxesIcon />
              </span>
              <span className="truncate font-medium">helloemployee</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      tooltip={item.label}
                      isActive={isActive}
                      render={<Link to={item.to} />}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="cursor-default hover:bg-transparent">
              <Avatar>
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.login}</span>
                <span className="truncate text-xs text-muted-foreground">Signed in</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign out"
              onClick={handleSignOut}
              disabled={signOut.isPending}
            >
              <LogOutIcon />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
