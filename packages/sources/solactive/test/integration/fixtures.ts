import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://dataproviderapi.com', {
    encodedQueryParams: true,
  })
    .get('/abc123/A0B1C2D3/performance')
    .query(() => true)
    .reply(
      200,
      () => ({
        indexId: 'A0B1C2D3',
        timestamp: 1756222196746,
        level: '49.2564',
        levelHigh: '49.4619',
        levelLow: '48.3759',
        yearLevelHigh: '49.4619',
        yearLevelLow: '47.7564',
        lastClosingLevel: '49.1481',
        differencePercentage: '0.22',
        differencePercentage4p: '0.2204',
        differenceAbsolute: '0.11',
      }),
      [
        'Content-Type',
        'application/json',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )
    .persist()

export const mockResponseFailure = (): nock.Scope =>
  nock('https://dataproviderapi.com', {
    encodedQueryParams: true,
  })
    .get('/abc123/BAD_ISIN/performance')
    .query(() => true)
    .reply(403, () => ({}), [
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
