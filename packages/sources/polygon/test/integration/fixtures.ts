import nock from 'nock'

export const mockResponseSuccess = (): nock =>
  nock('https://api.polygon.io/v1', {
    encodedQueryParams: true,
  })
    .get('/conversion/USD/GBP')
    .query({ apikey: 'fake-api-key', amount: 1, precision: 6 })
    .reply(
      200,
      (_, request) => ({
        converted: 0.7536,
        from: 'USD',
        initialAmount: 1,
        last: { ask: 0.7537, bid: 0.7536, exchange: 48, timestamp: 1638296882000 },
        request_id: '744873f269fecf272b15c6f665a94438',
        status: 'success',
        symbol: 'USD/GBP',
        to: 'GBP',
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
