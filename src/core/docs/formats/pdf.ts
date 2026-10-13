import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont } from "pdf-lib";
import { extractText } from "unpdf";
import { env } from "@/lib/env";
import { renderPlainText } from "./render.ts";
import type { DocumentFormat } from "./types.ts";

const fontPath = env.PDF_FONT_PATH;
// pdf-lib standard fonts are Latin-1 only; Cyrillic needs an embedded TTF/OTF.
const canWrite = fontPath.length > 0 && existsSync(fontPath);

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const raw of text.split("\n")) {
    let current = "";
    for (const word of raw.split(" ")) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !current) {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    }
    lines.push(current);
  }
  return lines;
}

export const pdfFormat: DocumentFormat = {
  id: "pdf",
  label: "PDF",
  extensions: ["pdf"],
  canWrite,
  async extractText(data) {
    const result = await extractText(data, { mergePages: true });
    return result.text;
  },
  async write(doc) {
    if (!canWrite) {
      throw new Error("PDF недоступен: задайте PDF_FONT_PATH с TTF/OTF-шрифтом");
    }

    const pdf = await PDFDocument.create();
    pdf.registerFontkit(fontkit);
    const font = await pdf.embedFont(await readFile(fontPath), { subset: true });

    const fontSize = 12;
    const lineHeight = 16;
    const margin = 48;
    const height = 842;
    const lines = wrap(renderPlainText(doc), font, fontSize, 595 - margin * 2);

    let page = pdf.addPage([595, height]);
    let y = height - margin;
    for (const line of lines) {
      if (y < margin) {
        page = pdf.addPage([595, height]);
        y = height - margin;
      }
      page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
      y -= lineHeight;
    }

    return pdf.save();
  },
};
