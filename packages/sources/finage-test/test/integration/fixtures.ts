import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://api.finage.co.uk', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/last/stocks')
    .query({ apikey: 'fake-api-key', symbols: 'AAPL' })
    .reply(
      200,
      () => [
        {
          symbol: 'AAPL',
          ask: 26.32,
          bid: 25.8,
          asize: 13,
          bsize: 1,
          timestamp: 1628899200621,
        },
      ],
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
    .get('/agg/stock/prev-close/ETH')
    .query({ apikey: 'fake-api-key' })
    .reply(
      200,
      () => ({
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
    .persist()
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
    .persist()
    .get('/last/crypto/BTCUSD')
    .query({ apikey: 'fake-api-key' })
    .reply(200, { symbol: 'BTCUSD', price: 50940.12, timestamp: 1638898619885 }, [
      'Content-Type',
      'application/json; charset=utf-8',
      'Content-Length',
      '73',
      'Connection',
      'close',
    ])
    .persist()
    .get('/last/trade/forex/WTIUSD')
    .query({ apikey: 'fake-api-key' })
    .reply(
      200,
      {
        symbol: 'WTIUSD',
        price: 98.91,
        timestamp: 1659017220,
      },
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
