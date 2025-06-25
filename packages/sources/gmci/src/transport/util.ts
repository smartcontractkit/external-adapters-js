export function convertTimetoUnixMs(isoTime: string) {
  return Date.parse(isoTime)
}
