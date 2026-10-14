import nock from 'nock'

export const mockPostResponseSuccess = (id: string): nock.Scope =>
  nock('https://dataproviderapi.com', {
    encodedQueryParams: true,
  })
    .get(`/${id}/tradeinfo`)
    .reply(
      200,
      () => ({
        lastPrice: '0.9990000',
        referencePrice: '0.9990000',
        priceChange24h: '0.000000',
        tradeVolume24h: '0',
        liquidityBand: 7,
        tradingStatus: 'CONTINUOUS_TRADING',
        statusChangeReason: 'START_OF_TRADING_DAY',
        tradingHaltCounter: 0,
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
    .get(`/${id}/orderbook`)
    .reply(
      200,
      () => ({
        tradingPairId: id,
        buy: [
          {
            orderType: 'LIMIT',
            quantity: '11000.0000000',
            limit: '0.9999999',
          },
        ],
        sell: [
          {
            orderType: 'LIMIT',
            quantity: '136500.0000000',
            limit: '1.0000000',
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
    .persist()
