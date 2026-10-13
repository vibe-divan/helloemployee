import * as ExcelJS from "exceljs";
import type { DocumentFormat } from "./types.ts";

function cellToString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "object") {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join("");
    }
    if ("text" in value && typeof value.text === "string") {
      return value.text;
    }
    if ("result" in value) {
      return String(value.result ?? "");
    }
    return "";
  }
  return String(value);
}

export const xlsxFormat: DocumentFormat = {
  id: "xlsx",
  label: "Excel (XLSX)",
  extensions: ["xlsx", "xls"],
  canWrite: true,
  async extractText(data) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(data) as unknown as ExcelJS.Buffer);
    const lines: string[] = [];
    workbook.eachSheet((sheet) => {
      lines.push(`# Лист: ${sheet.name}`);
      sheet.eachRow((row) => {
        const values = (row.values as ExcelJS.CellValue[]).slice(1).map(cellToString);
        lines.push(values.join("\t"));
      });
      lines.push("");
    });
    return lines.join("\n").trim();
  },
  async write(doc) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Документ");
    sheet.addRow([doc.title]);
    sheet.addRow([]);
    sheet.columns = [{ width: 40 }, { width: 60 }];
    for (const field of doc.fields) {
      sheet.addRow([field.label, field.value]);
    }
    const body = doc.body.trim();
    if (body) {
      sheet.addRow([]);
      for (const line of body.split("\n")) {
        sheet.addRow([line]);
      }
    }
    const buffer = await workbook.xlsx.writeBuffer();
    return new Uint8Array(buffer);
  },
};
