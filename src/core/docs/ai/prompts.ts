import type { GenerationContext } from "./types.ts";

export const ANALYZE_SYSTEM_PROMPT = `Ты — эксперт по анализу документов и форм.
Тебе передают текстовое содержимое документа. Определи, какие поля нужно дозаполнить,
чтобы документ стал заполненным: их машинное имя, человекочитаемую подпись, тип,
обязательность и ограничения.

Правила:
- Возвращай ТОЛЬКО поля, которые реально нужно заполнить (пустые/отсутствующие). Если таких нет — верни пустой массив.
- type строго из: "string", "number", "integer", "boolean", "date", "enum".
- name — латиницей в snake_case, уникальный.
- label — на русском.
- Если тип "enum" — обязательно заполни constraints.values (список допустимых значений).
- constraints может содержать: min, max, minLength, maxLength, pattern (регулярка), values.
- required — true, если поле обязательно для заполнения.
- Пиши на русском. Не добавляй пояснений вне JSON.

Формат ответа (строго JSON):
{
  "title": "название документа",
  "fields": [
    { "name": "customer_name", "label": "Имя заказчика", "type": "string", "required": true, "description": "ФИО", "constraints": { "maxLength": 200 } }
  ]
}`;

export function analyzeUserPrompt(sourceText: string, format: string): string {
  return `Формат документа: ${format}.
Текст документа:
"""
${sourceText}
"""
Определи поля для дозаполнения и верни строгий JSON.`;
}

export const GENERATE_SYSTEM_PROMPT = `Ты — эксперт по заполнению документов.
Тебе дают исходный текст документа, список полей с подписями/типами и уже введённые пользователем значения.
Твоя задача — заполнить оставшиеся значения и сформировать итоговый документ.

Правила:
- Заполни все поля, для которых можешь достоверно определить значение. При необходимости используй инструменты
  (текущие дата/время и данные приложения через query_database).
- НЕ выдумывай данные. Если значение определить невозможно — оставь поле пустой строкой, не гадай.
- Значения из ответа пользователя не меняй.
- Соблюдай типы и ограничения полей.
- "body" — итоговый текст документа на русском языке со всеми подставленными значениями (готовый к выгрузке).
- Пиши на русском. Не добавляй пояснений вне JSON.

Формат ответа (строго JSON):
{ "fields": { "имя_поля": "значение" }, "body": "итоговый текст документа" }`;

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
    `Исходный текст документа:\n"""\n${context.sourceText}\n"""`,
  ];

  if (problems) {
    parts.push(
      `Предыдущая попытка была отклонена валидацией. Исправь проблемы и заполни документ заново:\n${problems}`,
    );
  }

  return parts.join("\n\n");
}
