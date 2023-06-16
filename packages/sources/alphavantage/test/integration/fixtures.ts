import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://www.alphavantage.co', {
    encodedQueryParams: true,
  })
    .get('/query')
    .query({
      apikey: 'fake-api-key',
      function: 'CURRENCY_EXCHANGE_RATE',
      from_currency: 'GBP',
      to_currency: 'USD',
      from_symbol: 'GBP',
      to_symbol: 'USD',
      symbol: 'GBP',
      market: 'USD',
    })
    .reply(
      200,
      () => ({
        'Realtime Currency Exchange Rate': {
          '1. From_Currency Code': 'GBP',
          '2. From_Currency Name': 'British Pound Sterling',
          '3. To_Currency Code': 'USD',
          '4. To_Currency Name': 'United States Dollar',
          '5. Exchange Rate': '1.36606000',
          '6. Last Refreshed': '2021-11-01 19:33:43',
          '7. Time Zone': 'UTC',
          '8. Bid Price': '1.36602600',
          '9. Ask Price': '1.36612700',
        },
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
