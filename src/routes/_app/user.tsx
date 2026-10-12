import { createFileRoute } from "@tanstack/react-router";
import { listUsers } from "@/core/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/lib/ui/card";

export const Route = createFileRoute("/_app/user")({
  loader: () => listUsers(),
  component: UsersPage,
});

function UsersPage() {
  const { users } = Route.useLoaderData();

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">
          Loaded through a server function guarded by the auth middleware.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All users</CardTitle>
          <CardDescription>{users.length} account(s)</CardDescription>
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
