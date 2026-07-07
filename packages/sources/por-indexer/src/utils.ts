/** Builds a URL by appending a path to a base endpoint. */
export function buildUrl(baseEndpoint: string, path: string): string {
  const url = new URL(baseEndpoint)
  url.pathname = url.pathname.replace(/\/$/, '') + path
  return url.toString()
}
