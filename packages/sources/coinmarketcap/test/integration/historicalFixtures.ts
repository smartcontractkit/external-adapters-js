import nock from 'nock'

export function mockSuccessfulHistoricalCapResponse() {
  nock('https://pro-api.coinmarketcap.com')
    .get(
      `/v1/cryptocurrency/quotes/historical?symbol=ETH&time_start=2021-07-23T14&convert=BTC&count=10&interval=5m`,
    )
    .reply(
      200,
      {
        status: {
          timestamp: '2021-12-01T14:44:08.026Z',
          error_code: 0,
          error_message: null,
          elapsed: 30,
          credit_count: 1,
          notice: null,
        },
        data: {
          quotes: [
            {
              timestamp: '2021-07-23T14:04:03.000Z',
              quote: {
                BTC: {
                  price: 0.06372463643632112,
                  volume_24h: 504265.23763687897,
                  market_cap: 7443591.90020768,
                  timestamp: '2021-07-23T14:04:12.000Z',
                },
              },
            },
            {
              timestamp: '2021-07-23T14:09:03.000Z',
              quote: {
                BTC: {
                  price: 0.06371941629686442,
                  volume_24h: 503702.65783204953,
                  market_cap: 7442982.142507192,
                  timestamp: '2021-07-23T14:09:13.000Z',
                },
              },
            },
            {
              timestamp: '2021-07-23T14:14:08.000Z',
              quote: {
                BTC: {
                  price: 0.06372453768196841,
                  volume_24h: 503184.31892236834,
                  market_cap: 7443649.549774187,
                  timestamp: '2021-07-23T14:14:23.000Z',
                },
              },
            },
            {
              timestamp: '2021-07-23T14:19:06.000Z',
              quote: {
                BTC: {
                  price: 0.06367490340039632,
                  volume_24h: 503087.4919427468,
                  market_cap: 7437851.780012068,
                  timestamp: '2021-07-23T14:19:12.000Z',
                },
              },
            },
            {
              timestamp: '2021-07-23T14:24:05.000Z',
              quote: {
                BTC: {
                  price: 0.06362402824508358,
                  volume_24h: 501663.79642084066,
                  market_cap: 7431909.064055017,
                  timestamp: '2021-07-23T14:24:09.000Z',
                },
              },
            },
            {
              timestamp: '2021-07-23T14:29:06.000Z',
              quote: {
                BTC: {
                  price: 0.06362223765893496,
                  volume_24h: 499637.90000928735,
                  market_cap: 7431699.906071862,
                  timestamp: '2021-07-23T14:29:13.000Z',
                },
              },
            },
            {
              timestamp: '2021-07-23T14:34:04.000Z',
              quote: {
                BTC: {
                  price: 0.06355415525274345,
                  volume_24h: 497509.87502596335,
                  market_cap: 7423747.214838163,
                  timestamp: '2021-07-23T14:34:15.000Z',
                },
              },
            },
            {
              timestamp: '2021-07-23T14:39:07.000Z',
              quote: {
                BTC: {
                  price: 0.06355962091247133,
                  volume_24h: 497304.8331171168,
                  market_cap: 7424385.657376196,
                  timestamp: '2021-07-23T14:39:19.000Z',
                },
              },
            },
            {
              timestamp: '2021-07-23T14:44:04.000Z',
              quote: {
                BTC: {
                  price: 0.06363986524132226,
                  volume_24h: 496738.91156870575,
                  market_cap: 7433758.980181678,
                  timestamp: '2021-07-23T14:44:07.000Z',
                },
              },
            },
            {
              timestamp: '2021-07-23T14:49:03.000Z',
              quote: {
                BTC: {
                  price: 0.06359201049147004,
                  volume_24h: 495928.26554275176,
                  market_cap: 7428169.077137268,
                  timestamp: '2021-07-23T14:49:09.000Z',
                },
              },
            },
          ],
          id: 1027,
          name: 'Ethereum',
          symbol: 'ETH',
          is_active: 1,
          is_fiat: 0,
        },
      },
      [
        'X-Powered-By',
        'Express',
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '714',
        'ETag',
        'W/"2ca-B0TkX1zAQfIfnHwQo6e4kGAEMCs"',
        'Date',
        'Wed, 23 Jun 2021 22:38:43 GMT',
        'Connection',
        'close',
      ],
    )
}
