import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://api.twelvedata.com', {
    encodedQueryParams: true,
  })
    .get('/eod')
    .query({ apikey: 'fake-api-key', symbol: 'VXX' })
    .reply(
      200,
      () => ({
        symbol: 'VXX',
        exchange: 'CBOE',
        currency: 'USD',
        datetime: '2021-11-05',
        close: '20.86750',
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
    .get('/price')
    .query({ apikey: 'fake-api-key', symbol: 'VXX' })
    .reply(200, () => ({ price: '20.86750' }), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
