import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { activeDocumentSessionQuery } from "@/core/docs";
import { isActiveStatus } from "@/core/docs/types.ts";
import { DocumentPicker, DocumentSession } from "@/core/docs/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/lib/ui/card";
import { ErrorAlert } from "@/lib/ui/error-alert";

export const Route = createFileRoute("/_app/")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const { data, isPending, isError, error } = useQuery({
    ...activeDocumentSessionQuery,
    // Poll while background work (analysis/generation) is in progress.
    refetchInterval: (query) => {
      const session = query.state.data?.session;
      return session && isActiveStatus(session.status) ? 2500 : false;
    },
  });

  const session = data?.session ?? null;

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Заполнение документов</h1>
        <p className="text-sm text-muted-foreground">Здравствуйте, {user.login}.</p>
      </div>

      {isError ? <ErrorAlert title="Не удалось загрузить сессию" error={error} /> : null}

      {isPending ? (
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      ) : isError ? null : session ? (
        <DocumentSession session={session} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Нет активной сессии</CardTitle>
            <CardDescription>Загрузите документ, чтобы начать.</CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      )}

      <DocumentPicker />
    </div>
  );
}
