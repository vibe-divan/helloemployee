export function getTimestamp(): string {
  const timestamp = new Date().toISOString();
  return timestamp;
}
