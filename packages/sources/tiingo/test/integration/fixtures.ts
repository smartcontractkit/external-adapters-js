import nock from 'nock'

export const mockResponseSuccess = (): nock =>
  nock('https://api.tiingo.com', {
    encodedQueryParams: true,
  })
    .get('/iex/usd')
    .query({ token: 'fake-api-key', tickers: 'usd' })
    .reply(
      200,
      (_, request) => [
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
          ticker: 'USD',
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
      (_, request) => [
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
    .query({ token: 'fake-api-key', tickers: 'ETHusd' })
    .reply(
      200,
      (_, request) => [
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
      baseCurrency: 'ETH',
      convertCurrency: 'usd',
      consolidateBaseCurrency: true,
      resampleFreq: '24hour',
    })
    .reply(
      200,
      (_, request) => [
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
    .get('/tiingo/fx/gbpusd/top')
    .query({ token: 'fake-api-key' })
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
    .get('/tiingo/fx/usoilusd/top')
    .query({ token: 'fake-api-key' })
    .reply(
      200,
      [
        {
          ticker: 'usoilusd',
          quoteTimestamp: '2021-11-23T15:14:45.768000+00:00',
          bidPrice: 77.45,
          bidSize: 1000000,
          askPrice: 77.58,
          askSize: 1000000,
          midPrice: 77.515,
        },
      ],
      [
        'content-type',
        'application/json',
        'content-length',
        '167',
        'x-frame-options',
        'SAMEORIGIN',
        'vary',
        'Accept, Cookie, Origin',
        'allow',
        'GET, HEAD, OPTIONS',
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
      startDate: /^\d{4}-\d{2}-\d{2}$/,
      endDate: /^\d{4}-\d{2}-\d{2}$/,
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
