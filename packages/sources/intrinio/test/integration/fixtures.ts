import nock from 'nock'

export const mockRateResponseSuccess = (): nock =>
  nock('https://api-v2.intrinio.com/', {
    encodedQueryParams: true,
  })
    .get('/securities/ETH/prices/realtime')
    .query({ api_key: 'fake-api-key' })
    .reply(
      200,
      {
        last_price: 24.25,
        last_time: '2022-02-23T17:58:46.261+00:00',
        last_size: 1,
        bid_price: 24.23,
        bid_size: 233,
        ask_price: 24.24,
        ask_size: 118,
        open_price: 25.74,
        close_price: null,
        high_price: 25.74,
        low_price: 24.1,
        exchange_volume: null,
        market_volume: 34311,
        updated_on: null,
        source: 'intrinio_mx',
        security: {
          id: 'sec_gkZOZA',
          ticker: 'ETD',
          exchange_ticker: 'ETD:UN',
          figi: 'BBG000BBVHG3',
          composite_figi: 'BBG000BBVDT8',
        },
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
