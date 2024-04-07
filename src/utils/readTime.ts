const WORDS_PER_MINUTE = 200;

export function computeReadTime(content: string): number {
  const words = content.split(" ").length;

  const minutes = words / WORDS_PER_MINUTE;
  return Math.ceil(minutes);
}
