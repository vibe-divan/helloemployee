import { unzipSync, zipSync } from "fflate";
import * as mammoth from "mammoth";
import type { DocumentFormat, FieldFill } from "./types.ts";

const decoder = new TextDecoder();
const encoder = new TextEncoder();

const XML_PART_RE = /^word\/(document|header\d*|footer\d*|footnotes|endnotes)\.xml$/;

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

interface RunNode {
  matchStart: number;
  openTagLength: number;
  text: string;
}

/** Parses `<w:t>` runs of a paragraph into nodes with their joined text. */
function parseRuns(paragraph: string): { nodes: RunNode[]; joined: string } {
  const nodes: RunNode[] = [];
  const parts: string[] = [];
  const runRe = /(<w:t\b[^>]*>)([\s\S]*?)(?:<\/w:t>)/g;
  let match: RegExpExecArray | null;
  while ((match = runRe.exec(paragraph)) !== null) {
    nodes.push({
      matchStart: match.index,
      openTagLength: (match[1] ?? "").length,
      text: match[2] ?? "",
    });
    parts.push(match[2] ?? "");
  }
  return { nodes, joined: parts.join("") };
}

/** Rewrites run text so the [start, end) span is replaced without touching other runs. */
function replaceRangeInParagraph(
  paragraph: string,
  nodes: RunNode[],
  start: number,
  end: number,
  value: string,
): string {
  const edits: Array<{ from: number; to: number; text: string }> = [];
  let joinedStart = 0;

  for (const node of nodes) {
    const textStart = node.matchStart + node.openTagLength;
    const textEnd = textStart + node.text.length;
    const joinedEnd = joinedStart + node.text.length;
    const nodeJoinedStart = joinedStart;
    joinedStart = joinedEnd;

    if (joinedEnd <= start || nodeJoinedStart >= end) {
      continue;
    }

    if (nodeJoinedStart <= start && start < joinedEnd) {
      const before = node.text.slice(0, start - nodeJoinedStart);
      const after = end <= joinedEnd ? node.text.slice(end - nodeJoinedStart) : "";
      edits.push({ from: textStart, to: textEnd, text: before + value + after });
    } else {
      const after = end <= joinedEnd ? node.text.slice(end - nodeJoinedStart) : "";
      edits.push({ from: textStart, to: textEnd, text: after });
    }
  }

  let result = paragraph;
  for (const edit of edits.sort((a, b) => b.from - a.from)) {
    result = result.slice(0, edit.from) + edit.text + result.slice(edit.to);
  }
  return result;
}

/** Replaces every occurrence of `anchor` in a paragraph, preserving unrelated runs. */
function replaceAllInParagraph(paragraph: string, anchor: string, value: string): string {
  const occurrences: Array<[number, number]> = [];
  {
    const { joined } = parseRuns(paragraph);
    let from = 0;
    for (;;) {
      const index = joined.indexOf(anchor, from);
      if (index === -1) {
        break;
      }
      occurrences.push([index, index + anchor.length]);
      from = index + anchor.length;
    }
  }

  // Right to left: a replacement never shifts the indices of earlier occurrences.
  let result = paragraph;
  for (let index = occurrences.length - 1; index >= 0; index -= 1) {
    const [start, end] = occurrences[index]!;
    const { nodes } = parseRuns(result);
    result = replaceRangeInParagraph(result, nodes, start, end, value);
  }
  return result;
}

/** Replaces every occurrence of `anchor` across all paragraphs of one XML part. */
function replaceAllInXml(xml: string, anchor: string, value: string): string {
  return xml.replace(/<w:p\b[\s\S]*?<\/w:p>/g, (paragraph) =>
    replaceAllInParagraph(paragraph, anchor, value),
  );
}

export const docxFormat: DocumentFormat = {
  id: "docx",
  label: "Word (DOCX)",
  extensions: ["docx"],
  canWrite: true,
  async extractText(data) {
    const result = await mammoth.extractRawText({ buffer: Buffer.from(data) });
    return result.value;
  },
  async fill(source, fills) {
    const entries = unzipSync(source);
    const xmlParts = Object.keys(entries).filter((key) => XML_PART_RE.test(key));

    for (const fill of fills as FieldFill[]) {
      if (!fill.anchor || fill.value === fill.anchor) {
        continue;
      }
      const anchor = escapeXml(fill.anchor);
      const value = escapeXml(fill.value);
      for (const key of xmlParts) {
        const part = entries[key];
        if (!part) {
          continue;
        }
        const xml = decoder.decode(part);
        const replaced = replaceAllInXml(xml, anchor, value);
        if (replaced !== xml) {
          entries[key] = encoder.encode(replaced);
        }
      }
    }

    return zipSync(entries);
  },
};
