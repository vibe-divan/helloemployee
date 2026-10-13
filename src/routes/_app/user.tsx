import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { usersQuery } from "@/core/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/lib/ui/card";
import { ErrorAlert } from "@/lib/ui/error-alert";

export const Route = createFileRoute("/_app/user")({
  component: UsersPage,
});

function UsersPage() {
  const { data, isPending, isError, error } = useQuery(usersQuery);
  const users = data?.users ?? [];

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">
          Loaded through a server function guarded by the auth middleware.
        </p>
      </div>

      {isError ? <ErrorAlert title="Не удалось загрузить пользователей" error={error} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>All users</CardTitle>
          <CardDescription>{isPending ? "Loading…" : `${users.length} account(s)`}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {users.map((user) => (
              <li key={user.id} className="flex items-center justify-between gap-4 py-3">
                <span className="font-medium">{user.login}</span>
                <span className="font-mono text-xs text-muted-foreground">{user.id}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
