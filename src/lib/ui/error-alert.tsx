import { AlertCircleIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./alert";

/** Human-readable text for an unknown thrown value. */
export function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string" && error) {
    return error;
  }
  return "Неизвестная ошибка";
}

/** Destructive alert that renders an error message. */
export function ErrorAlert({ title = "Ошибка", error }: { title?: string; error: unknown }) {
  return (
    <Alert variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{errorMessage(error)}</AlertDescription>
    </Alert>
  );
}
