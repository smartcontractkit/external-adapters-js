import nock from 'nock'

export const mockWootradeResponseSuccess = (): nock =>
  nock('https://api.woo.network', { encodedQueryParams: true })
    .persist()
    .get('/v1/public/market_trades/?symbol=SPOT_ETH_USDT&limit=1')
    .reply(
      200,

      {
        success: true,
        rows: [
          {
            symbol: 'SPOT_ETH_USDT',
            side: 'SELL',
            executed_price: 4499.01,
            executed_quantity: 0.043747,
            executed_timestamp: '1636138728.930',
          },
        ],
      },
      [
        'Date',
        'Wed, 22 Sep 2021 14:24:17 GMT',
        'Content-Type',
        'application/json',
        'Content-Length',
        '152',
        'Connection',
        'close',
        'Server',
        'nginx',
        'Vary',
        'Origin',
      ],
    )
