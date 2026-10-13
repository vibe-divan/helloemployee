import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { cancelDocumentSession, type CancelSessionParams } from "./cancel-session.ts";
import { generateDocument, type GenerateDocumentParams } from "./generate-document.ts";
import { getActiveDocumentSession } from "./get-active-session.ts";
import { listDocumentSessions } from "./list-sessions.ts";
import { getDocumentOptions } from "./options.ts";
import { startDocumentSession } from "./start-session.ts";
import { updateDocumentFieldValues, type UpdateFieldValuesParams } from "./update-field-values.ts";

export const documentKeys = {
  all: ["documents"] as const,
  activeSession: () => [...documentKeys.all, "active-session"] as const,
  sessions: () => [...documentKeys.all, "sessions"] as const,
  options: () => [...documentKeys.all, "options"] as const,
};

export const activeDocumentSessionQuery = queryOptions({
  queryKey: documentKeys.activeSession(),
  queryFn: () => getActiveDocumentSession(),
});

export const documentOptionsQuery = queryOptions({
  queryKey: documentKeys.options(),
  queryFn: () => getDocumentOptions(),
});

export const documentSessionsQuery = queryOptions({
  queryKey: documentKeys.sessions(),
  queryFn: () => listDocumentSessions(),
});

export const startDocumentSessionMutation = mutationOptions({
  mutationFn: (file: File) => {
    const formData = new FormData();
    formData.set("file", file);
    return startDocumentSession({ data: formData });
  },
});

export const updateDocumentFieldValuesMutation = mutationOptions({
  mutationFn: (params: UpdateFieldValuesParams) => updateDocumentFieldValues({ data: params }),
});

export const generateDocumentMutation = mutationOptions({
  mutationFn: (params: GenerateDocumentParams) => generateDocument({ data: params }),
});

export const cancelDocumentSessionMutation = mutationOptions({
  mutationFn: (params: CancelSessionParams) => cancelDocumentSession({ data: params }),
});
