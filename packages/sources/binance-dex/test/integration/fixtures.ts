import nock from 'nock'

export const mockRateResponseSuccess = (): nock.Scope =>
  nock('https://dex-asiapacific.binance.org', {
    encodedQueryParams: true,
  })
    .get('/api/v1/ticker/24hr')
    .query({ symbol: 'BUSD-BD1_USDT-6D8' })
    .reply(
      200,
      () => [
        {
          symbol: 'BUSD-BD1_USDT-6D8',
          baseAssetName: 'BUSD-BD1',
          quoteAssetName: 'USDT-6D8',
          priceChange: '0.00050000',
          priceChangePercent: '0.0500',
          prevClosePrice: '0.99900000',
          lastPrice: '1.00000000',
          lastQuantity: '22.00000000',
          openPrice: '0.99950000',
          highPrice: '1.00980000',
          lowPrice: '0.99700000',
          openTime: 1636993579000,
          closeTime: 163707997900000000000000000000000000,
          firstId: '202650439-0',
          lastId: '202857405-0',
          bidPrice: '0.99900000',
          bidQuantity: '6766.00000000',
          askPrice: '1.00000000',
          askQuantity: '1515.00000000',
          weightedAvgPrice: '1.00001116',
          volume: '253006.00000000',
          quoteVolume: '253008.82463200',
          count: 337,
        },
      ],
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

export const mockRateResponseFailure = (): nock.Scope =>
  nock('https://dex-asiapacific.binance.org', {
    encodedQueryParams: true,
  })
    .get('/api/v1/ticker/24hr')
    .query({ symbol: 'NON_EXISTING' })
    .reply(400, () => ({ code: 400, message: 'Symbol is not valid' }), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
