import nock from 'nock'

export function mockSuccessfulCoinMarketCapResponse(cid = '1') {
  nock('https://pro-api.coinmarketcap.com')
    .get(`/v1/cryptocurrency/quotes/latest?convert=USD&id=${cid}`)
    .reply(
      200,
      {
        data: {
          [cid]: {
            id: 1,
            name: 'Bitcoin',
            symbol: 'BTC',
            slug: 'bitcoin',
            is_active: 1,
            is_fiat: 0,
            circulating_supply: 17199862,
            total_supply: 17199862,
            max_supply: 21000000,
            date_added: '2013-04-28T00:00:00.000Z',
            num_market_pairs: 331,
            cmc_rank: 1,
            last_updated: '2018-08-09T21:56:28.000Z',
            tags: ['mineable'],
            platform: null,
            quote: {
              USD: {
                price: 6602.60701122,
                volume_24h: 4314444687.5194,
                percent_change_1h: 0.988615,
                percent_change_24h: 4.37185,
                percent_change_7d: -12.1352,
                percent_change_30d: -12.1352,
                market_cap: 113563929433.21645,
                last_updated: '2018-08-09T21:56:28.000Z',
              },
            },
          },
        },
        status: {
          timestamp: '2021-07-23T14:39:23.626Z',
          error_code: 0,
          error_message: '',
          elapsed: 10,
          credit_count: 1,
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

export function mockCoinMarketCapErrorTooManyRequests(cid = '1') {
  nock('https://pro-api.coinmarketcap.com')
    .get(`/v1/cryptocurrency/quotes/latest?convert=USD&id=${cid}`)
    .reply(
      429,
      {
        status: {
          timestamp: '2018-06-02T22:51:28.209Z',
          error_code: 1008,
          error_message:
            "You've exceeded your API Key's HTTP request rate limit. Rate limits reset every minute.",
          elapsed: 10,
          credit_count: 0,
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

export function mockSuccessfulCoinMarketCapResponseWithSlug(slug = 'BTC') {
  nock('https://pro-api.coinmarketcap.com')
    .get(`/v1/cryptocurrency/quotes/latest?convert=USD&slug=${slug}`)
    .reply(
      200,
      {
        data: {
          [slug]: {
            id: 1,
            name: 'Bitcoin',
            symbol: 'BTC',
            slug: 'bitcoin',
            is_active: 1,
            is_fiat: 0,
            circulating_supply: 17199862,
            total_supply: 17199862,
            max_supply: 21000000,
            date_added: '2013-04-28T00:00:00.000Z',
            num_market_pairs: 331,
            cmc_rank: 1,
            last_updated: '2018-08-09T21:56:28.000Z',
            tags: ['mineable'],
            platform: null,
            quote: {
              USD: {
                price: 6602.60701122,
                volume_24h: 4314444687.5194,
                percent_change_1h: 0.988615,
                percent_change_24h: 4.37185,
                percent_change_7d: -12.1352,
                percent_change_30d: -12.1352,
                market_cap: 113563929433.21645,
                last_updated: '2018-08-09T21:56:28.000Z',
              },
            },
          },
        },
        status: {
          timestamp: '2021-07-23T14:39:23.626Z',
          error_code: 0,
          error_message: '',
          elapsed: 10,
          credit_count: 1,
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
