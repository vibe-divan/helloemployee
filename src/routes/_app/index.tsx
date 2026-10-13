import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { getActiveDocumentSession, type DocumentSessionView } from "@/core/docs";
import { isActiveStatus } from "@/core/docs/types.ts";
import { DocumentPicker, DocumentSession } from "@/core/docs/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/lib/ui/card";

export const Route = createFileRoute("/_app/")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const fetchActive = useServerFn(getActiveDocumentSession);
  const [session, setSession] = useState<DocumentSessionView | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const result = await fetchActive();
    setSession(result.session);
    setLoading(false);
  }, [fetchActive]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Poll while background work (analysis/generation) is in progress.
  useEffect(() => {
    if (!session || !isActiveStatus(session.status)) {
      return;
    }
    const interval = setInterval(() => {
      void refresh();
    }, 2500);
    return () => clearInterval(interval);
  }, [session, refresh]);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Заполнение документов</h1>
        <p className="text-sm text-muted-foreground">Здравствуйте, {user.login}.</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      ) : session ? (
        <DocumentSession session={session} onChanged={refresh} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Нет активной сессии</CardTitle>
            <CardDescription>Загрузите документ, чтобы начать.</CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      )}

      <DocumentPicker onStarted={refresh} />
    </div>
  );
}
