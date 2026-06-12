import nock, { DataMatcher } from 'nock'

export const mockProviderResponse = (
  url: string,
  params: DataMatcher,
  response: Record<string, unknown>,
): nock.Scope => {
  return nock(url, {
    encodedQueryParams: true,
  })
    .post('/', { data: params })
    .reply(200, () => response, [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
}
