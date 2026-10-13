import { useCallback, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DownloadIcon, Loader2Icon, XIcon } from "lucide-react";
import {
  cancelDocumentSessionMutation,
  documentKeys,
  generateDocumentMutation,
  updateDocumentFieldValuesMutation,
  type DocumentField,
  type DocumentFieldType,
  type DocumentSessionView,
  type DocumentTemplate,
} from "@/core/docs";
import { validateFieldValues } from "@/core/docs/validation.ts";
import { Alert, AlertDescription, AlertTitle } from "@/lib/ui/alert";
import { Button, buttonVariants } from "@/lib/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/lib/ui/card";
import { Checkbox } from "@/lib/ui/checkbox";
import { ErrorAlert } from "@/lib/ui/error-alert";
import { Input } from "@/lib/ui/input";
import { Label } from "@/lib/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/lib/ui/select";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<DocumentFieldType, string> = {
  string: "текст",
  number: "число",
  integer: "целое число",
  boolean: "да/нет",
  date: "дата",
  enum: "выбор",
};

/** Invalidates the queries affected by any document-session mutation. */
function useRefreshDocumentQueries() {
  const queryClient = useQueryClient();
  return useCallback(
    () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: documentKeys.activeSession() }),
        queryClient.invalidateQueries({ queryKey: documentKeys.sessions() }),
      ]),
    [queryClient],
  );
}

function initialValues(template: DocumentTemplate): Record<string, string> {
  const values: Record<string, string> = {};
  for (const field of template.fields) {
    values[field.name] = field.value ?? "";
  }
  return values;
}

/** Renders a control matching the field type: checkbox, number, select, date or text. */
function FieldControl({
  field,
  value,
  disabled,
  invalid,
  onChange,
}: {
  field: DocumentField;
  value: string;
  disabled: boolean;
  invalid: boolean;
  onChange: (value: string) => void;
}) {
  const id = `field-${field.id}`;

  switch (field.type) {
    case "boolean":
      return (
        <div className="flex items-center gap-2">
          <Checkbox
            id={id}
            disabled={disabled}
            aria-invalid={invalid}
            checked={value === "true"}
            onCheckedChange={(checked) => onChange(checked ? "true" : "false")}
          />
          <Label htmlFor={id} className="font-normal">
            Да
          </Label>
        </div>
      );
    case "enum": {
      const options = field.constraints.values ?? [];
      return (
        <Select
          value={value || null}
          disabled={disabled}
          onValueChange={(next) => onChange(next ?? "")}
        >
          <SelectTrigger id={id} aria-invalid={invalid}>
            <SelectValue placeholder="Выберите значение" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    case "number":
    case "integer":
      return (
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          step={field.type === "integer" ? 1 : "any"}
          disabled={disabled}
          aria-invalid={invalid}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    case "date":
      return (
        <Input
          id={id}
          type="date"
          disabled={disabled}
          aria-invalid={invalid}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    default:
      return (
        <Input
          id={id}
          type="text"
          disabled={disabled}
          aria-invalid={invalid}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      );
  }
}

function FieldForm({
  session,
  template,
}: {
  session: DocumentSessionView;
  template: DocumentTemplate;
}) {
  const refresh = useRefreshDocumentQueries();
  const updateValues = useMutation(updateDocumentFieldValuesMutation);
  const generate = useMutation(generateDocumentMutation);
  const [values, setValues] = useState<Record<string, string>>(() => initialValues(template));
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState("");

  const pending = updateValues.isPending || generate.isPending;

  async function runGenerate() {
    const generated = await generate.mutateAsync({ sessionId: session.id });
    if (!generated.ok) {
      setError(generated.error);
      return;
    }
    await refresh();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const clientErrors = validateFieldValues(template.fields, values);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) {
      return;
    }

    setError("");
    try {
      const updated = await updateValues.mutateAsync({ sessionId: session.id, values });
      if (!updated.ok) {
        setError(updated.error);
        return;
      }
      if (Object.keys(updated.errors).length > 0) {
        setErrors(updated.errors);
        return;
      }
      await runGenerate();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Не удалось запустить формирование документа",
      );
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
            setError("");
            void runGenerate().catch((requestError) =>
              setError(
                requestError instanceof Error
                  ? requestError.message
                  : "Не удалось запустить формирование документа",
              ),
            );
          }}
          className="w-fit"
        >
          {pending ? <Loader2Icon className="animate-spin" /> : null}
          Сформировать документ
        </Button>
        {error ? <ErrorAlert error={error} /> : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {template.fields.map((field) => {
        const fieldErrors = errors[field.name] ?? [];
        const invalid = fieldErrors.length > 0;
        return (
          <div key={field.id} className="grid gap-2">
            {field.type !== "boolean" ? (
              <Label htmlFor={`field-${field.id}`}>
                {field.label}
                {field.required ? <span className="text-destructive"> *</span> : null}
                <span className="text-xs text-muted-foreground"> ({TYPE_LABELS[field.type]})</span>
              </Label>
            ) : (
              <p className="text-sm font-medium">
                {field.label}
                {field.required ? <span className="text-destructive"> *</span> : null}
                <span className="text-xs font-normal text-muted-foreground">
                  {" "}
                  ({TYPE_LABELS[field.type]})
                </span>
              </p>
            )}
            {field.description ? (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            ) : null}
            <FieldControl
              field={field}
              value={values[field.name] ?? ""}
              disabled={pending}
              invalid={invalid}
              onChange={(next) => setValues((previous) => ({ ...previous, [field.name]: next }))}
            />
            {invalid ? <p className="text-sm text-destructive">{fieldErrors.join("; ")}</p> : null}
          </div>
        );
      })}

      {error ? <ErrorAlert error={error} /> : null}

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? <Loader2Icon className="animate-spin" /> : null}
        Сформировать документ
      </Button>
    </form>
  );
}

export function DocumentSession({ session }: { session: DocumentSessionView }) {
  const refresh = useRefreshDocumentQueries();
  const cancel = useMutation(cancelDocumentSessionMutation);
  const [cancelError, setCancelError] = useState<unknown>(null);

  async function handleCancel() {
    setCancelError(null);
    try {
      await cancel.mutateAsync({ sessionId: session.id });
      await refresh();
    } catch (requestError) {
      setCancelError(requestError);
    }
  }

  const pending = cancel.isPending;
  const title = session.template?.title ?? session.sourceFileName ?? "Документ";

  let content: ReactNode = null;

  if (session.status === "analyzing") {
    content = (
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
  } else if (session.status === "generating") {
    content = (
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
  } else if (session.status === "awaiting_input" && session.template) {
    content = (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            Шаблон — это документ с подстановочными значениями. Проверьте поля и сформируйте
            документ; сам шаблон можно скачать и использовать повторно.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <a
            href={`/api/sessions/${session.id}/template`}
            className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
          >
            <DownloadIcon /> Скачать шаблон
          </a>
          <FieldForm session={session} template={session.template} />
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
  } else if (session.status === "completed") {
    content = (
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
  } else if (session.status === "failed") {
    content = (
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

  return (
    <div className="grid gap-4">
      {cancelError ? <ErrorAlert title="Не удалось обновить сессию" error={cancelError} /> : null}
      {content}
    </div>
  );
}
