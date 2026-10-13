import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { DownloadIcon } from "lucide-react";
import {
  listDocumentSessions,
  type DocumentSessionStatus,
  type DocumentSessionView,
} from "@/core/docs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/lib/ui/card";

const STATUS_LABELS: Record<DocumentSessionStatus, string> = {
  analyzing: "Анализ",
  awaiting_input: "Ожидает ввода",
  generating: "Формирование",
  completed: "Завершена",
  failed: "Ошибка",
  cancelled: "Отменена",
};

function formatDate(timestamp: string): string {
  return new Date(Number(timestamp)).toLocaleString("ru-RU");
}

export function SessionJournal() {
  const fetchSessions = useServerFn(listDocumentSessions);
  const [sessions, setSessions] = useState<DocumentSessionView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchSessions().then((result) => {
      setSessions(result.sessions);
      setLoading(false);
    });
  }, [fetchSessions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Журнал сессий</CardTitle>
        <CardDescription>Все сессии обработки документов (read-only), с автором.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? <p className="text-sm text-muted-foreground">Загрузка…</p> : null}
        {!loading && sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Пока нет сессий.</p>
        ) : null}

        {sessions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Автор</th>
                  <th className="py-2 pr-4 font-medium">Документ</th>
                  <th className="py-2 pr-4 font-medium">Статус</th>
                  <th className="py-2 pr-4 font-medium">Создана</th>
                  <th className="py-2 font-medium">Результат</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{session.authorLogin}</td>
                    <td className="py-2 pr-4">{session.sourceFileName ?? "—"}</td>
                    <td className="py-2 pr-4">{STATUS_LABELS[session.status]}</td>
                    <td className="py-2 pr-4 whitespace-nowrap">{formatDate(session.createdAt)}</td>
                    <td className="py-2">
                      {session.status === "completed" && session.resultDocumentId ? (
                        <a
                          className="inline-flex items-center gap-1 text-primary underline"
                          href={`/api/documents/${session.resultDocumentId}`}
                        >
                          <DownloadIcon className="size-4" /> скачать
                        </a>
                      ) : session.status === "failed" ? (
                        <span className="text-destructive">{session.error ?? "ошибка"}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
