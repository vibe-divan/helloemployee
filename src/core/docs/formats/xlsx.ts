import * as ExcelJS from "exceljs";
import type { DocumentFormat, FieldFill } from "./types.ts";

function cellToString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "object") {
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
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

// exceljs types its own `Buffer` as an ArrayBuffer alias; Node's Buffer still satisfies it at runtime.
function bufferOf(data: Uint8Array): ArrayBuffer {
  return Buffer.from(data) as unknown as ArrayBuffer;
}

function coerceValue(type: string, value: string): ExcelJS.CellValue {
  if (value === "") {
    return null;
  }
  if (type === "number" || type === "integer") {
    const num = Number(value.replace(",", "."));
    return Number.isFinite(num) ? num : value;
  }
  if (type === "boolean") {
    return ["да", "true", "1", "yes", "истина"].includes(value.trim().toLowerCase());
  }
  return value;
}

function resolveCell(workbook: ExcelJS.Workbook, anchor: string): ExcelJS.Cell | undefined {
  const bang = anchor.indexOf("!");
  const sheet = bang === -1 ? workbook.worksheets[0] : workbook.getWorksheet(anchor.slice(0, bang));
  if (!sheet) {
    return undefined;
  }
  const address = bang === -1 ? anchor : anchor.slice(bang + 1);
  return sheet.getCell(address);
}

export const xlsxFormat: DocumentFormat = {
  id: "xlsx",
  label: "Excel (XLSX)",
  extensions: ["xlsx", "xls"],
  canWrite: true,
  async extractText(data) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bufferOf(data));
    const lines: string[] = [];
    workbook.eachSheet((sheet) => {
      lines.push(`# Лист: ${sheet.name}`);
      const rows = sheet.rowCount;
      const columns = sheet.columnCount;
      for (let rowIndex = 1; rowIndex <= rows; rowIndex += 1) {
        const row = sheet.getRow(rowIndex);
        const parts: string[] = [];
        for (let columnIndex = 1; columnIndex <= columns; columnIndex += 1) {
          const cell = row.getCell(columnIndex);
          parts.push(`${sheet.name}!${cell.address} = ${cellToString(cell.value)}`);
        }
        lines.push(parts.join(" | "));
      }
      lines.push("");
    });
    return lines.join("\n").trim();
  },
  async fill(source, fills) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bufferOf(source));
    for (const fill of fills as FieldFill[]) {
      if (!fill.anchor) {
        continue;
      }
      const cell = resolveCell(workbook, fill.anchor);
      if (cell) {
        // Assigning the value keeps the cell's existing style.
        cell.value = coerceValue(fill.type, fill.value);
      }
    }
    const buffer = await workbook.xlsx.writeBuffer();
    return new Uint8Array(buffer);
  },
};
