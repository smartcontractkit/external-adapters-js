import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://api.tiingo.com', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/iex')
    .query({ token: 'fake-api-key', tickers: 'aapl' })
    .reply(
      200,
      () => [
        {
          prevClose: 48.77,
          last: 51.27,
          lastSaleTimestamp: '2021-11-05T11:54:23.055122029-04:00',
          low: 49.68,
          bidSize: 0,
          askPrice: 0.0,
          open: 49.68,
          mid: null,
          volume: 680,
          lastSize: 80,
          tngoLast: 51.27,
          ticker: 'AAPL',
          askSize: 0,
          quoteTimestamp: '2021-11-05T11:54:23.055122029-04:00',
          bidPrice: 0.0,
          timestamp: '2021-11-05T11:54:23.055122029-04:00',
          high: 51.345,
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
    .get('/tiingo/daily/usd/prices')
    .query({ token: 'fake-api-key' })
    .reply(
      200,
      () => [
        {
          adjClose: 48.77,
          adjHigh: 50.02,
          adjLow: 45.3,
          adjOpen: 45.3,
          adjVolume: 253971,
          close: 48.77,
          date: '2021-11-04T00:00:00+00:00',
          divCash: 0.0,
          high: 50.02,
          low: 45.3,
          open: 45.3,
          splitFactor: 1.0,
          volume: 253971,
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
    .get('/tiingo/crypto/top')
    .query({ token: 'fake-api-key', tickers: 'ethusd' })
    .reply(
      200,
      () => [
        {
          topOfBookData: [
            {
              lastSizeNotional: 447.19,
              lastSaleTimestamp: '2021-11-05T15:58:34.551417+00:00',
              bidExchange: 'KRAKEN',
              lastPrice: 4471.9,
              bidSize: 0.8815,
              askPrice: 4465.77,
              lastSize: 0.1,
              lastExchange: 'KRAKEN',
              askSize: 0.67187449,
              quoteTimestamp: '2021-11-05T15:58:53.024522+00:00',
              bidPrice: 4471.9,
              askExchange: 'BITTREX',
            },
          ],
          quoteCurrency: 'usd',
          baseCurrency: 'eth',
          ticker: 'ethusd',
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
    .get('/tiingo/crypto/prices')
    .query({
      token: 'fake-api-key',
      tickers: 'ethusd',
      resampleFreq: '24hour',
    })
    .reply(
      200,
      () => [
        {
          ticker: 'ethusd',
          baseCurrency: 'eth',
          quoteCurrency: 'usd',
          priceData: [
            {
              open: 4480.102875037304,
              high: 4587.688720578152,
              low: 4417.835408304461,
              close: 4462.5193860735335,
              volume: 917488.0172696838,
              tradesDone: 2567528.0,
              volumeNotional: 4094298121.291589,
              fxOpen: 4480.102875037304,
              fxHigh: 4587.688720578152,
              fxLow: 4417.835408304461,
              fxClose: 4462.5193860735335,
              fxVolumeNotional: 4094298121.291589,
              fxRate: 1.0,
            },
          ],
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
    .get('/tiingo/fx/top')
    .query({ token: 'fake-api-key', tickers: 'gbpusd' })
    .reply(
      200,
      [
        {
          ticker: 'gbpusd',
          quoteTimestamp: '2021-11-23T15:13:39.472000+00:00',
          bidPrice: 1.31418,
          bidSize: 1000000,
          askPrice: 1.35792,
          askSize: 1000000,
          midPrice: 1.33605,
        },
      ],
      [
        'content-type',
        'application/json',
        'content-length',
        '170',
        'vary',
        'Accept, Cookie, Origin',
        'allow',
        'GET, HEAD, OPTIONS',
        'x-frame-options',
        'SAMEORIGIN',
        'connection',
        'close',
      ],
    )
    .get('/tiingo/crypto/prices')
    .query({
      token: 'fake-api-key',
      baseCurrency: 'amplcvwap',
      convertCurrency: 'usd',
      consolidateBaseCurrency: true,
      resampleFreq: '24hour',
    })
    .reply(
      200,
      [
        {
          ticker: 'amplusd',
          baseCurrency: 'ampl',
          quoteCurrency: 'usd',
          priceData: [
            {
              fxLow: 0.6687492814959118,
              volume: 3040820.8077948317,
              volumeNotional: 2156262.1333203353,
              close: 0.7091192957589304,
              tradesDone: 15128.0,
              fxRate: 1.0,
              open: 0.7253618170091394,
              date: '2022-01-10T00:00:00+00:00',
              low: 0.6687492814959118,
              fxOpen: 0.7253618170091394,
              fxClose: 0.7091192957589304,
              high: 0.7421611700495103,
              fxVolumeNotional: 2156262.1333203353,
              fxHigh: 0.7421611700495103,
            },
            {
              fxLow: 0.7021978513298123,
              volume: 3046332.756485964,
              volumeNotional: 2594073.9097942426,
              close: 0.851625908515737,
              tradesDone: 22817.0,
              fxRate: 1.0,
              open: 0.708183339731143,
              date: '2022-01-11T00:00:00+00:00',
              low: 0.7021978513298123,
              fxOpen: 0.708183339731143,
              fxClose: 0.851625908515737,
              high: 0.8598988101118933,
              fxVolumeNotional: 2594073.9097942426,
              fxHigh: 0.8598988101118933,
            },
          ],
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
    .get('/tiingo/crypto/prices')
    .query({
      token: 'fake-api-key',
      baseCurrency: 'real_vol_ETH',
      convertCurrency: 'USD',
      consolidateBaseCurrency: true,
    })
    .reply(
      200,
      () => [
        {
          baseCurrency: 'eth',
          quoteCurrency: 'usd',
          realVolData: [
            {
              date: '2022-01-11T00:00:00+00:00',
              realVol1Day: 0.3312392184952228,
              realVol7Day: 0.6687492814959118,
              realVol30Day: 0.851625908515737,
            },
          ],
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
    .get('/tiingo/crypto-yield/ticks')
    .query({
      token: 'fake-api-key',
      poolCodes: 'ethnetwork_eth',
    })
    .reply(
      200,
      () => [
        {
          date: '2023-03-28T08:18:37.836912+00:00',
          yieldPoolID: 42,
          yieldPoolName: 'ethnetwork_eth',
          epoch: 190538,
          startSlot: 6097216,
          endSlot: 6097247,
          validatorReward: 8.387974508106709,
          transactionReward: 0.9943422706363183,
          validatorSubtractions: -0.03651446599984354,
          deposits: 0,
          totalReward: 9.345802312743183,
          divisor: 17818985,
          apr30Day: 0.05041705428139954,
          apr90Day: 0.0509027044623858,
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
    .get('/tiingo/crypto-yield/ticks')
    .query({
      token: 'fake-api-key',
      poolCodes: 'compound_usdt',
    })
    .reply(
      200,
      () => [
        {
          date: '2023-03-18T09:07:00+00:00',
          poolCode: 'compound_usdt',
          variableBorrowRate: 0.040187752938891874,
          stableBorrowRate: null,
          totalStableBorrowAmount: null,
          totalVariableBorrowAmount: 109152599.889651,
          totalBorrowAmount: 109152599.889651,
          supplyRate: 0.025501153223986828,
          totalSupplyAmount: 157984241.97059688,
          availableLiquidityAmount: 48831642.08094588,
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
