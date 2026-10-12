import { useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { LogOutIcon } from "lucide-react";
import { signOut, type AuthUser } from "@/core/auth";
import { Avatar, AvatarFallback } from "@/lib/ui/avatar";
import { buttonVariants } from "@/lib/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/lib/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/user", label: "Users" },
] as const;

export function AppHeader({ user }: { user: AuthUser }) {
  const router = useRouter();
  const requestSignOut = useServerFn(signOut);
  const [pending, setPending] = useState(false);

  const initials = user.login.slice(0, 2).toUpperCase();

  async function handleLogout() {
    setPending(true);
    try {
      await requestSignOut();
      await router.invalidate();
      await router.navigate({ to: "/login" });
    } finally {
      setPending(false);
    }
  }

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold">helloemployee</span>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "data-[status=active]:bg-muted data-[status=active]:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Account menu"
            disabled={pending}
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <Avatar>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{user.login}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" disabled={pending} onClick={handleLogout}>
                <LogOutIcon />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
