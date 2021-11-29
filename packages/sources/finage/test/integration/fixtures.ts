import nock from 'nock'

export const mockResponseSuccess = (): nock =>
  nock('https://api.finage.co.uk', {
    encodedQueryParams: true,
  })
    .get('/last/stock/ETH')
    .query({ apikey: 'fake-api-key' })
    .reply(
      200,
      (_, request) => ({
        symbol: 'ETH',
        ask: 26.32,
        bid: 25.8,
        asize: 13,
        bsize: 1,
        timestamp: 1628899200621,
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
    .get('/agg/stock/prev-close/ETH')
    .query({ apikey: 'fake-api-key' })
    .reply(
      200,
      (_, request) => ({
        symbol: 'ETH',
        totalResults: 1,
        results: [{ o: 26.79, h: 26.85, l: 26.02, c: 26.3, v: 367009, t: 1628884800000 }],
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
    .get('/last/forex/GBPUSD')
    .query({ apikey: 'fake-api-key' })
    .reply(200, { symbol: 'GBPUSD', ask: 1.34435, bid: 1.34426, timestamp: 1637060382000 }, [
      'Content-Type',
      'application/json; charset=utf-8',
      'Content-Length',
      '73',
      'Connection',
      'close',
    ])

export const mockResponseFailure = (): nock =>
  nock('https://api.finage.co.uk', {
    encodedQueryParams: true,
  })
    .get('/last/stock/NON-EXISTING')
    .query({ apikey: 'fake-api-key' })
    .reply(400, (_, request) => ({ error: 'Please check the symbol and try again.' }), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
