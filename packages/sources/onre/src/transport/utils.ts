export function parseDateToTimestamp(dateString: string): number | null {
  const [month, day, year] = dateString.split('/').map(Number)

  if (![month, day, year].every(Number.isFinite)) return null

  const timestamp = Date.UTC(year, month - 1, day, 0, 0, 0)
  return Number.isFinite(timestamp) ? timestamp : null
}
