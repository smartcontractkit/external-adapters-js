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

export const mockSubscribeResponse = {
  request: {
    event: 'subscribe',
    topic: 'SPOT_ETH_USDT@bbo',
    id: 1,
  },
  response: [
    {
      id: '1',
      event: 'subscribe',
      success: true,
      ts: 1645125717465,
    },
    {
      topic: 'SPOT_ETH_USDT@bbo',
      ts: 1645125717486,
      data: {
        symbol: 'SPOT_ETH_USDT',
        ask: 2907.59,
        askSize: 1.503387,
        bid: 2907.2,
        bidSize: 2.253,
      },
    },
  ],
}

export const mockUnsubscribeResponse = {
  request: {
    event: 'unsubscribe',
    topic: 'SPOT_ETH_USDT@bbo',
    id: 1,
  },
  response: {
    id: '1',
    event: 'unsubscribe',
    success: true,
    ts: 1645125721430,
  },
}
