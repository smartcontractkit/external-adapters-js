import nock from 'nock'

export const mockResponseSuccess = (): nock =>
  nock('https://marketdata.tradermade.com', {
    encodedQueryParams: true,
  })
    .get('/api/v1/live')
    .query({ api_key: 'fake-api-key', currency: 'ETHUSD' })
    .reply(
      200,
      (_, request) => ({
        endpoint: 'live',
        quotes: [
          {
            ask: 4494.03,
            base_currency: 'ETH',
            bid: 4494.02,
            mid: 4494.0249,
            quote_currency: 'USD',
          },
        ],
        requested_time: 'Fri, 05 Nov 2021 17:11:25 GMT',
        timestamp: 1636132286,
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
    .get('/api/v1/live')
    .query({ api_key: 'fake-api-key', currency: 'AAPL' })
    .reply(
      200,
      (_, request) => ({
        endpoint: 'live',
        quotes: [
          {
            ask: 150.51,
            bid: 150.5,
            instrument: 'AAPL',
            mid: 150.50501,
          },
        ],
        requested_time: 'Fri, 05 Nov 2021 17:12:07 GMT',
        timestamp: 1636132328,
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

export const mockResponseFailure = (): nock =>
  nock('https://marketdata.tradermade.com', {
    encodedQueryParams: true,
  })
    .get('/api/v1/live')
    .query({ api_key: 'fake-api-key', currency: 'NON-EXISTING' })
    .reply(
      200,
      (_, request) => ({
        endpoint: 'live',
        quotes: [
          {
            error: 400,
            instrument: 'NON_EXISTING',
            message: 'currency code is invalid',
          },
        ],
        requested_time: 'Fri, 05 Nov 2021 17:17:16 GMT',
        timestamp: 1636132636,
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
