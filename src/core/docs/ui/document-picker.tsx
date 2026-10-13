import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, UploadIcon } from "lucide-react";
import { documentKeys, documentOptionsQuery, startDocumentSessionMutation } from "@/core/docs";
import { Alert, AlertDescription, AlertTitle } from "@/lib/ui/alert";
import { Button } from "@/lib/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/lib/ui/card";
import { ErrorAlert } from "@/lib/ui/error-alert";
import { Label } from "@/lib/ui/label";

export function DocumentPicker() {
  const queryClient = useQueryClient();
  const {
    data: options,
    isError: optionsError,
    error: optionsErrorValue,
  } = useQuery(documentOptionsQuery);
  const startSession = useMutation(startDocumentSessionMutation);
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  const accept = options?.inputExtensions.map((extension) => `.${extension}`).join(",") ?? "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Выберите файл");
      return;
    }

    setError("");
    try {
      const result = await startSession.mutateAsync(file);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      await queryClient.invalidateQueries({ queryKey: documentKeys.activeSession() });
      await queryClient.invalidateQueries({ queryKey: documentKeys.sessions() });
    } catch {
      setError("Не удалось загрузить документ");
    }
  }

  const pending = startSession.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Новый документ</CardTitle>
        <CardDescription>
          Загрузите документ — ИИ определит поля для заполнения и создаст шаблон. Итоговый файл
          сохранит исходный формат и оформление.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="grid gap-4">
          {optionsError ? (
            <ErrorAlert title="Не удалось загрузить форматы" error={optionsErrorValue} />
          ) : null}
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Ошибка</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="document-file">Файл</Label>
            <input
              id="document-file"
              ref={inputRef}
              type="file"
              accept={accept}
              disabled={pending}
              className="flex h-9 w-full items-center rounded-lg border border-input bg-transparent px-2.5 text-sm file:mr-2 file:border-0 file:bg-transparent file:text-sm file:font-medium"
            />
          </div>

          <Button type="submit" disabled={pending} className="w-fit">
            {pending ? <Loader2Icon className="animate-spin" /> : <UploadIcon />}
            Загрузить
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
