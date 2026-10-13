/** Placeholder token for a variable, e.g. `{{contract.number}}`. */
export function placeholder(name: string): string {
  return `{{${name}}}`;
}

const PLACEHOLDER_RE = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;

/** Unique variable names found as placeholders in the text. */
export function extractPlaceholderNames(text: string): string[] {
  const names = new Set<string>();
  for (const match of text.matchAll(PLACEHOLDER_RE)) {
    const name = match[1];
    if (name) {
      names.add(name);
    }
  }
  return [...names];
}

/** Where a session's template document lives in storage. */
export function templateStorageKey(sessionId: string, formatId: string): string {
  return `templates/${sessionId}.${formatId}`;
}
