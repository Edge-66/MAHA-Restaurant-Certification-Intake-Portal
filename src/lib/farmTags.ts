/**
 * Farm `livestock_types`, `produce_types`, and `regenerative_practices` may be:
 * - JSON-stringified arrays (new applications)
 * - Legacy comma-separated text
 */
export function parseFarmTagField(val: string | null | undefined): string[] {
  if (val == null || !String(val).trim()) return [];
  const s = String(val).trim();
  if (s.startsWith('[')) {
    try {
      const parsed = JSON.parse(s) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
    } catch {
      return [];
    }
  }
  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

export function serializeFarmTags(selected: string[]): string | null {
  const cleaned = selected.map((s) => s.trim()).filter(Boolean);
  if (cleaned.length === 0) return null;
  return JSON.stringify(cleaned);
}

/** Admin / free-text editing: comma- or newline-separated labels → JSON array string */
export function serializeFarmTagsFromText(text: string): string | null {
  const tags = text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return serializeFarmTags(tags);
}
