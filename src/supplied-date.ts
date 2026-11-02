/** Read an explicit assessment date without introducing a wall clock dependency. */
export function suppliedAssessmentDate(text: string): Date | null {
  const lines = text.split(/[;\n]/).map(x => x.trim()).filter(x => /^Assessment date:/i.test(x));
  if (!lines.length) return null;
  const dates = lines.map(line => /^Assessment date:\s*(\d{4}-\d{2}-\d{2})\s*$/i.exec(line)?.[1]);
  if (dates.some(x => !x) || new Set(dates).size !== 1) return null;
  const value = dates[0]!;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(+date) && date.toISOString().slice(0, 10) === value ? date : null;
}
