import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('http://api.marketstack.com/v1', {
    encodedQueryParams: true,
  })
    .get('/eod')
    .query({ access_key: 'fake-api-key', symbols: 'AAPL', interval: '1min', limit: 1 })
    .reply(
      200,
      () => ({
        pagination: { limit: 1, offset: 0, count: 1, total: 252 },
        data: [
          {
            open: 167.48,
            high: 170.295,
            low: 164.53,
            close: 164.77,
            volume: 145135682.0,
            adj_high: null,
            adj_low: null,
            adj_close: 164.77,
            adj_open: null,
            adj_volume: null,
            split_factor: 1.0,
            dividend: 0.0,
            symbol: 'AAPL',
            exchange: 'XNAS',
            date: '2021-12-01T00:00:00+0000',
          },
        ],
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
