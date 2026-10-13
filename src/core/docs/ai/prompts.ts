import type { GenerationContext } from "./types.ts";

export function analyzeUserPrompt(sourceText: string, format: string): string {
  return `Формат документа: ${format}.
Содержимое документа:
"""
${sourceText}
"""
Верни строгий JSON со списком найденных сущностей (без подписей и печатей).`;
}

export function generateUserPrompt(context: GenerationContext, problems?: string): string {
  const fields = context.fields
    .map(
      (field) =>
        `- ${field.name} | ${field.label} | тип: ${field.type} | обязательное: ${field.required ? "да" : "нет"}${
          field.description ? ` | ${field.description}` : ""
        }`,
    )
    .join("\n");

  const values = context.fields
    .map((field) => `- ${field.name}: ${context.values[field.name] ?? ""}`)
    .join("\n");

  const parts = [
    `Название документа: ${context.title}`,
    `Поля:\n${fields}`,
    `Значения, введённые пользователем:\n${values}`,
    `Контекст документа:\n"""\n${context.sourceText}\n"""`,
  ];

  if (problems) {
    parts.push(`Предыдущая попытка отклонена валидацией. Исправь и верни заново:\n${problems}`);
  }

  return parts.join("\n\n");
}
