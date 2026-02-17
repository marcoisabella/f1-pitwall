// Convert ISO 2-letter country code to flag emoji
export function countryFlag(code: string): string {
  const upper = code.toUpperCase();
  const offset = 127397;
  return String.fromCodePoint(...[...upper].map(c => c.charCodeAt(0) + offset));
}
