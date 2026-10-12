import { createFileRoute, redirect } from "@tanstack/react-router";
import { LoginForm } from "@/core/auth/ui";

export const Route = createFileRoute("/login")({
  beforeLoad: ({ context }) => {
    if (context.user) {
      throw redirect({ to: "/" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <LoginForm />
    </div>
  );
}
