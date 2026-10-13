import { createFileRoute } from "@tanstack/react-router";
import { SessionJournal } from "@/core/docs/ui";

export const Route = createFileRoute("/_app/journal")({
  component: JournalPage,
});

function JournalPage() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Журнал</h1>
        <p className="text-sm text-muted-foreground">
          Завершённые и прочие сессии обработки документов — только для чтения.
        </p>
      </div>
      <SessionJournal />
    </div>
  );
}
