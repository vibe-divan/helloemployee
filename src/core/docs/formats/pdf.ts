import { PDFDocument } from "pdf-lib";
import { extractText } from "unpdf";
import type { DocumentFormat, FieldFill } from "./types.ts";

function formFieldNames(document: PDFDocument): string[] {
  try {
    return document
      .getForm()
      .getFields()
      .map((field) => field.getName());
  } catch {
    return [];
  }
}

export const pdfFormat: DocumentFormat = {
  id: "pdf",
  label: "PDF (формы)",
  extensions: ["pdf"],
  canWrite: true,
  async extractText(data) {
    const { text } = await extractText(data, { mergePages: true });
    const document = await PDFDocument.load(data);
    const names = formFieldNames(document);
    return names.length > 0 ? `${text}\n\nПоля формы PDF: ${names.join(", ")}` : text;
  },
  async fill(source, fills) {
    const document = await PDFDocument.load(source);
    const form = document.getForm();
    if (form.getFields().length === 0) {
      throw new Error(
        "PDF не содержит полей формы. Заполнение PDF без форм невозможно — выберите другой формат.",
      );
    }

    const missing: string[] = [];
    for (const fill of fills as FieldFill[]) {
      if (!fill.anchor) {
        continue;
      }
      try {
        form.getTextField(fill.anchor).setText(fill.value);
      } catch {
        missing.push(fill.anchor);
      }
    }

    if (missing.length > 0) {
      throw new Error(`В PDF нет полей формы: ${missing.join(", ")}`);
    }

    // Flattening writes the values into the page content, preserving the layout.
    form.flatten();
    return document.save();
  },
};
