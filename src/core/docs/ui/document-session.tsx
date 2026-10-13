import { useState } from "react";
import type { FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { DownloadIcon, Loader2Icon, XIcon } from "lucide-react";
import {
  cancelDocumentSession,
  generateDocument,
  updateDocumentFieldValues,
  type DocumentSessionView,
  type DocumentTemplate,
} from "@/core/docs";
import { validateFieldValues } from "@/core/docs/validation.ts";
import { Alert, AlertDescription, AlertTitle } from "@/lib/ui/alert";
import { Button, buttonVariants } from "@/lib/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/lib/ui/card";
import { Input } from "@/lib/ui/input";
import { Label } from "@/lib/ui/label";
import { cn } from "@/lib/utils";

function initialValues(template: DocumentTemplate): Record<string, string> {
  const values: Record<string, string> = {};
  for (const field of template.fields) {
    values[field.name] = field.value ?? "";
  }
  return values;
}

function FieldForm({
  session,
  template,
  onChanged,
}: {
  session: DocumentSessionView;
  template: DocumentTemplate;
  onChanged: () => void;
}) {
  const updateValues = useServerFn(updateDocumentFieldValues);
  const generate = useServerFn(generateDocument);
  const [values, setValues] = useState<Record<string, string>>(() => initialValues(template));
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const clientErrors = validateFieldValues(template.fields, values);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) {
      return;
    }

    setPending(true);
    setError("");
    try {
      const updated = await updateValues({ data: { sessionId: session.id, values } });
      if (!updated.ok) {
        setError(updated.error);
        return;
      }
      if (Object.keys(updated.errors).length > 0) {
        setErrors(updated.errors);
        return;
      }

      const generated = await generate({ data: { sessionId: session.id } });
      if (!generated.ok) {
        setError(generated.error);
        return;
      }
      onChanged();
    } catch {
      setError("Не удалось запустить формирование документа");
    } finally {
      setPending(false);
    }
  }

  if (template.fields.length === 0) {
    return (
      <div className="grid gap-4">
        <p className="text-sm text-muted-foreground">
          ИИ не нашёл полей для заполнения. Можно сформировать документ как есть.
        </p>
        <Button
          type="button"
          disabled={pending}
          onClick={() => {
            setPending(true);
            void generate({ data: { sessionId: session.id } })
              .then((result) => {
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                onChanged();
              })
              .finally(() => setPending(false));
          }}
          className="w-fit"
        >
          {pending ? <Loader2Icon className="animate-spin" /> : null}
          Сформировать документ
        </Button>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {template.fields.map((field) => {
        const fieldErrors = errors[field.name] ?? [];
        return (
          <div key={field.id} className="grid gap-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required ? <span className="text-destructive"> *</span> : null}
              <span className="text-xs text-muted-foreground"> ({field.type})</span>
            </Label>
            <Input
              id={field.id}
              value={values[field.name] ?? ""}
              disabled={pending}
              aria-invalid={fieldErrors.length > 0}
              onChange={(event) =>
                setValues((previous) => ({ ...previous, [field.name]: event.target.value }))
              }
            />
            {field.description ? (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            ) : null}
            {fieldErrors.length > 0 ? (
              <p className="text-sm text-destructive">{fieldErrors.join("; ")}</p>
            ) : null}
          </div>
        );
      })}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? <Loader2Icon className="animate-spin" /> : null}
        Сформировать документ
      </Button>
    </form>
  );
}

export function DocumentSession({
  session,
  onChanged,
}: {
  session: DocumentSessionView;
  onChanged: () => void;
}) {
  const cancel = useServerFn(cancelDocumentSession);
  const [pending, setPending] = useState(false);

  async function handleCancel() {
    setPending(true);
    try {
      await cancel({ data: { sessionId: session.id } });
      onChanged();
    } finally {
      setPending(false);
    }
  }

  const title = session.template?.title ?? session.sourceFileName ?? "Документ";

  if (session.status === "analyzing") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Анализ документа</CardTitle>
          <CardDescription>{session.sourceFileName}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="animate-spin" /> ИИ анализирует документ и формирует шаблон…
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            disabled={pending}
            onClick={handleCancel}
          >
            <XIcon /> Отменить
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (session.status === "generating") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Формирование документа</CardTitle>
          <CardDescription>{title}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="animate-spin" /> ИИ заполняет и проверяет документ
            {session.attempts > 0 ? ` (попытка ${session.attempts}/${session.maxAttempts})` : ""}…
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            disabled={pending}
            onClick={handleCancel}
          >
            <XIcon /> Остановить
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (session.status === "awaiting_input" && session.template) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Заполните поля — затем ИИ сформирует документ.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <FieldForm session={session} template={session.template} onChanged={onChanged} />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-fit"
            disabled={pending}
            onClick={handleCancel}
          >
            <XIcon /> Отменить сессию
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (session.status === "completed") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Документ готов.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {session.resultDocumentId ? (
            <a
              href={`/api/documents/${session.resultDocumentId}`}
              className={cn(buttonVariants({ variant: "default" }), "w-fit")}
            >
              <DownloadIcon /> Скачать {session.resultFileName}
            </a>
          ) : null}
          <p className="text-sm text-muted-foreground">
            Чтобы начать новую сессию, загрузите новый документ.
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-fit"
            disabled={pending}
            onClick={handleCancel}
          >
            Закрыть сессию
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (session.status === "failed") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Не удалось обработать документ</CardTitle>
          <CardDescription>{title}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Alert variant="destructive">
            <AlertTitle>Ошибка</AlertTitle>
            <AlertDescription>{session.error ?? "Неизвестная ошибка"}</AlertDescription>
          </Alert>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            disabled={pending}
            onClick={handleCancel}
          >
            Закрыть сессию
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}
