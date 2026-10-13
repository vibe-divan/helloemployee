import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import * as mammoth from "mammoth";
import type { DocumentFormat } from "./types.ts";

export const docxFormat: DocumentFormat = {
  id: "docx",
  label: "Word (DOCX)",
  extensions: ["docx", "doc"],
  canWrite: true,
  async extractText(data) {
    const result = await mammoth.extractRawText({ buffer: Buffer.from(data) });
    return result.value;
  },
  async write(doc) {
    const children: Paragraph[] = [
      new Paragraph({ text: doc.title, heading: HeadingLevel.HEADING_1 }),
    ];

    for (const field of doc.fields) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${field.label}: `, bold: true }),
            new TextRun({ text: field.value }),
          ],
        }),
      );
    }

    for (const line of doc.body.split("\n")) {
      children.push(new Paragraph({ text: line }));
    }

    const document = new Document({ sections: [{ children }] });
    const buffer = await Packer.toBuffer(document);
    return new Uint8Array(buffer);
  },
};
