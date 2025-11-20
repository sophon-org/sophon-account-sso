export const sentenceCase = (text: string) =>
  text.trim().replace(/^(\s*\p{L})/u, (value: string) => value.toUpperCase());
