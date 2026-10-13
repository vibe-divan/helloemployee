import type { DocumentField } from "./types.ts";

/** Validates a single field value; returns a Russian message or undefined. */
export function validateFieldValue(field: DocumentField, value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return field.required ? "Обязательное поле" : undefined;
  }

  const constraints = field.constraints ?? {};

  switch (field.type) {
    case "number":
    case "integer": {
      const num = Number(trimmed.replace(",", "."));
      if (!Number.isFinite(num)) {
        return "Введите число";
      }
      if (field.type === "integer" && !Number.isInteger(num)) {
        return "Введите целое число";
      }
      if (constraints.min !== undefined && num < constraints.min) {
        return `Значение меньше минимума (${constraints.min})`;
      }
      if (constraints.max !== undefined && num > constraints.max) {
        return `Значение больше максимума (${constraints.max})`;
      }
      break;
    }
    case "date": {
      if (Number.isNaN(Date.parse(trimmed))) {
        return "Введите корректную дату";
      }
      break;
    }
    case "boolean": {
      if (!["true", "false", "1", "0", "да", "нет"].includes(trimmed.toLowerCase())) {
        return "Введите одно из: да, нет";
      }
      break;
    }
    case "enum": {
      const values = constraints.values ?? [];
      if (values.length > 0 && !values.includes(trimmed)) {
        return `Одно из: ${values.join(", ")}`;
      }
      break;
    }
    default:
      break;
  }

  if (constraints.minLength !== undefined && trimmed.length < constraints.minLength) {
    return `Минимум ${constraints.minLength} символов`;
  }
  if (constraints.maxLength !== undefined && trimmed.length > constraints.maxLength) {
    return `Максимум ${constraints.maxLength} символов`;
  }
  if (constraints.pattern) {
    try {
      if (!new RegExp(constraints.pattern).test(trimmed)) {
        return "Значение не соответствует формату";
      }
    } catch {
      // ignore an invalid pattern from the model
    }
  }

  return undefined;
}

export function validateFieldValues(
  fields: DocumentField[],
  values: Record<string, string>,
): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const field of fields) {
    const message = validateFieldValue(field, values[field.name] ?? "");
    if (message) {
      (errors[field.name] ??= []).push(message);
    }
  }
  return errors;
}

export function formatProblems(errors: Record<string, string[]>): string {
  return Object.entries(errors)
    .map(([name, list]) => `- ${name}: ${list.join("; ")}`)
    .join("\n");
}
