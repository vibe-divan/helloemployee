import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2Icon, UploadIcon } from "lucide-react";
import { getDocumentOptions, startDocumentSession, type OutputFormatOption } from "@/core/docs";
import { Alert, AlertDescription, AlertTitle } from "@/lib/ui/alert";
import { Button } from "@/lib/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/lib/ui/card";
import { Label } from "@/lib/ui/label";

export function DocumentPicker({ onStarted }: { onStarted: () => void }) {
  const fetchOptions = useServerFn(getDocumentOptions);
  const startSession = useServerFn(startDocumentSession);
  const inputRef = useRef<HTMLInputElement>(null);
  const [outputFormats, setOutputFormats] = useState<OutputFormatOption[]>([]);
  const [accept, setAccept] = useState("");
  const [outputFormat, setOutputFormat] = useState("docx");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    void fetchOptions().then((options) => {
      setOutputFormats(options.outputFormats);
      setAccept(options.inputExtensions.map((extension) => `.${extension}`).join(","));
      const preferred = options.outputFormats.find(
        (format) => format.id === "docx" && format.available,
      );
      if (!preferred) {
        const first = options.outputFormats.find((format) => format.available);
        if (first) {
          setOutputFormat(first.id);
        }
      }
    });
  }, [fetchOptions]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Выберите файл");
      return;
    }

    setPending(true);
    setError("");
    setNotice("");
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("outputFormat", outputFormat);
      const result = await startSession({ data: formData });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.notice) {
        setNotice(result.notice);
      }
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      onStarted();
    } catch {
      setError("Не удалось загрузить документ");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Новый документ</CardTitle>
        <CardDescription>
          Загрузите документ — ИИ определит поля для заполнения и создаст шаблон.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="grid gap-4">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Ошибка</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {notice ? (
            <Alert>
              <AlertTitle>Внимание</AlertTitle>
              <AlertDescription>{notice}</AlertDescription>
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

          <div className="grid gap-2">
            <Label htmlFor="document-format">Формат результата</Label>
            <select
              id="document-format"
              value={outputFormat}
              disabled={pending}
              onChange={(event) => setOutputFormat(event.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring"
            >
              {outputFormats.map((format) => (
                <option key={format.id} value={format.id} disabled={!format.available}>
                  {format.label}
                  {format.available ? "" : " (недоступен)"}
                </option>
              ))}
            </select>
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
