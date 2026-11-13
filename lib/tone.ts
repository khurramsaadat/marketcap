/**
 * Categorical colours for things that are not up/down: news sources, company
 * attributes and similar labels. The palette lives in `app/globals.css` as
 * `--tone-1…6` so light and dark each get a readable variant.
 */
export const TONES = [
  "var(--tone-1)",
  "var(--tone-2)",
  "var(--tone-3)",
  "var(--tone-4)",
  "var(--tone-5)",
  "var(--tone-6)",
] as const;

/** Same source name always gets the same colour, across sessions and themes. */
export function toneFor(value: string): string {
  const key = value.trim().toLowerCase();
  let hash = 0;

  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) >>> 0;
  }

  return TONES[hash % TONES.length];
}
