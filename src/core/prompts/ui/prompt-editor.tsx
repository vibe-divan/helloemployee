import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, RotateCcwIcon, SaveIcon } from "lucide-react";
import {
  promptKeys,
  promptsQuery,
  resetPromptMutation,
  updatePromptMutation,
  type PromptView,
} from "@/core/prompts";
import { Alert, AlertDescription, AlertTitle } from "@/lib/ui/alert";
import { Button } from "@/lib/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/lib/ui/card";
import { Label } from "@/lib/ui/label";
import { ErrorAlert } from "@/lib/ui/error-alert";
import { Textarea } from "@/lib/ui/textarea";
import { cn } from "@/lib/utils";

function StatusBadge({ custom }: { custom: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-normal",
        custom ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
      )}
    >
      {custom ? "изменён" : "по умолчанию"}
    </span>
  );
}

function PromptForm({ prompt }: { prompt: PromptView }) {
  const queryClient = useQueryClient();
  const save = useMutation(updatePromptMutation);
  const reset = useMutation(resetPromptMutation);
  const [content, setContent] = useState(prompt.content);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setContent(prompt.content);
  }, [prompt.content]);

  const pending = save.isPending || reset.isPending;
  const dirty = content !== prompt.content;

  async function handleSave() {
    setError("");
    setSaved(false);
    try {
      const result = await save.mutateAsync({ key: prompt.key, content });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
      await queryClient.invalidateQueries({ queryKey: promptKeys.all });
    } catch {
      setError("Не удалось сохранить промпт");
    }
  }

  async function handleReset() {
    setError("");
    setSaved(false);
    try {
      const result = await reset.mutateAsync({ key: prompt.key });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: promptKeys.all });
    } catch {
      setError("Не удалось сбросить промпт");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          {prompt.title}
          <StatusBadge custom={prompt.isCustom} />
        </CardTitle>
        <CardDescription>{prompt.description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Ошибка</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {saved ? (
          <Alert>
            <AlertTitle>Сохранено</AlertTitle>
            <AlertDescription>Промпт применят следующие запуски обработки.</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-2">
          <Label htmlFor={`prompt-${prompt.key}`}>Системный промпт</Label>
          <Textarea
            id={`prompt-${prompt.key}`}
            value={content}
            rows={16}
            disabled={pending}
            aria-invalid={!content.trim()}
            onChange={(event) => {
              setContent(event.target.value);
              setSaved(false);
            }}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="w-fit"
            disabled={pending || !dirty || !content.trim()}
            onClick={handleSave}
          >
            {pending ? <Loader2Icon className="animate-spin" /> : <SaveIcon />}
            Сохранить
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-fit"
            disabled={pending || !prompt.isCustom}
            onClick={handleReset}
          >
            <RotateCcwIcon />
            Сбросить к стандартному
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function PromptsEditor() {
  const { data, isPending, isError, error } = useQuery(promptsQuery);

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Загрузка…</p>;
  }

  if (isError) {
    return <ErrorAlert title="Не удалось загрузить промпты" error={error} />;
  }

  return (
    <div className="grid gap-6">
      {data?.prompts.map((prompt) => (
        <PromptForm key={prompt.key} prompt={prompt} />
      ))}
    </div>
  );
}
