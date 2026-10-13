import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { AlertCircleIcon, Loader2Icon } from "lucide-react";
import { signInMutation, signInSchema, type SignInParams } from "@/core/auth";
import { Alert, AlertDescription, AlertTitle } from "@/lib/ui/alert";
import { Button } from "@/lib/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/lib/ui/card";
import { Input } from "@/lib/ui/input";
import { Label } from "@/lib/ui/label";

/** Standard Schema issues surface as objects with a `message`. */
function toMessage(error: unknown): string | undefined {
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error === "object" && "message" in error) {
    const message: unknown = (error as { message: unknown }).message;
    return typeof message === "string" ? message : undefined;
  }
  return undefined;
}

function FieldError({ errors }: { errors: readonly unknown[] }) {
  const message = errors.map(toMessage).find((value) => value !== undefined);
  if (!message) {
    return null;
  }
  return <p className="text-sm text-destructive">{message}</p>;
}

const defaultValues: SignInParams = { login: "", password: "" };

export function LoginForm() {
  const router = useRouter();
  const signIn = useMutation(signInMutation);
  const [error, setError] = useState("");

  const form = useForm({
    defaultValues,
    validators: { onSubmit: signInSchema },
    onSubmit: async ({ value }) => {
      setError("");
      try {
        const result = await signIn.mutateAsync(value);
        if (!result.ok) {
          setError(result.error);
          return;
        }

        await router.invalidate();
        await router.navigate({ to: "/" });
      } catch {
        setError("Login failed. Please try again.");
      }
    },
  });

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Enter your login and password to continue.</CardDescription>
      </CardHeader>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <CardContent className="grid gap-4">
          {error ? (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>Could not sign in</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <form.Field name="login">
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Login</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  autoComplete="username"
                  autoFocus
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={field.state.meta.errors.length > 0}
                />
                <FieldError errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          <form.Field name="password">
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Password</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  autoComplete="current-password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={field.state.meta.errors.length > 0}
                />
                <FieldError errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>
        </CardContent>
        <CardFooter className="mt-6">
          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
                Sign in
              </Button>
            )}
          </form.Subscribe>
        </CardFooter>
      </form>
    </Card>
  );
}
