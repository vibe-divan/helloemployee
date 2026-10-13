import * as v from "valibot";
import { privateServerFn } from "@/core/auth/middleware.ts";
import {
  buildSessionView,
  findSessionById,
  findTemplateWithFields,
  updateFieldValues,
} from "./store.ts";
import { validateFieldValues } from "./validation.ts";

const schema = v.object({
  sessionId: v.pipe(v.string(), v.minLength(1)),
  values: v.record(v.string(), v.string()),
});

export type UpdateFieldValuesParams = v.InferOutput<typeof schema>;

/** Persists user-entered values and returns per-field validation errors. */
export const updateDocumentFieldValues = privateServerFn({ method: "POST" })
  .validator((data: UpdateFieldValuesParams) => v.parse(schema, data))
  .handler(async ({ data, context }) => {
    const session = await findSessionById(data.sessionId);
    if (!session || session.ownerId !== context.session.userId) {
      return { ok: false as const, error: "Сессия не найдена" };
    }
    if (session.status !== "awaiting_input") {
      return { ok: false as const, error: "Сессия не ожидает ввода" };
    }
    if (!session.templateId) {
      return { ok: false as const, error: "Шаблон ещё не готов" };
    }

    const template = await findTemplateWithFields(session.templateId);
    if (!template) {
      return { ok: false as const, error: "Шаблон не найден" };
    }

    const errors = validateFieldValues(template.fields, data.values);
    const hasErrors = Object.keys(errors).length > 0;
    await updateFieldValues(session.templateId, data.values, hasErrors ? "invalid" : "filled");

    const updated = await findSessionById(data.sessionId);
    return {
      ok: true as const,
      errors,
      session: updated ? await buildSessionView(updated) : null,
    };
  });
