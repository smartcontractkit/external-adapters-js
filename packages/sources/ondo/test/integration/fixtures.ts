import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://api.gm.ondo.finance/', {
    encodedQueryParams: true,
  })
    .get('/v1/assets/AAPLon/prices/latest')
    .reply(
      200,
      () => ({
        primaryMarket: {
          symbol: 'AAPLon',
          price: '12.345',
        },
        underlyingMarket: {
          symbol: 'AAPL',
          price: '12.3456',
        },
        timestamp: 1234567890,
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
