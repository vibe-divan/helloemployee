import { createFileRoute } from "@tanstack/react-router";
import { PromptsEditor } from "@/core/prompts/ui";

export const Route = createFileRoute("/_app/prompts")({
  component: PromptsPage,
});

function PromptsPage() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Системные промпты</h1>
        <p className="text-sm text-muted-foreground">
          Промпты, которые используются при обращении к ИИ. Правки применяются к следующим запускам
          обработки документов.
        </p>
      </div>
      <PromptsEditor />
    </div>
  );
}
