import nock from 'nock'

export function mockSuccessfulGlobalMetricsResponse(market?: string) {
  let getPath = '/v1/global-metrics/quotes/latest'
  if (market) getPath += `?convert=${market}`
  nock('https://pro-api.coinmarketcap.com')
    .get(getPath)
    .reply(
      200,
      {
        data: {
          active_cryptocurrencies: 6017,
          total_cryptocurrencies: 11248,
          active_market_pairs: 45167,
          active_exchanges: 393,
          total_exchanges: 1442,
          eth_dominance: 19.378133207236,
          btc_dominance: 44.897494474523,
          eth_dominance_yesterday: 19.45085113,
          btc_dominance_yesterday: 45.1173045,
          eth_dominance_24h_percentage_change: -0.072717922764,
          btc_dominance_24h_percentage_change: -0.219810025477,
          defi_volume_24h: 11171849499.90983,
          defi_volume_24h_reported: 11171849499.90983,
          defi_market_cap: 100662876315.55212,
          defi_24h_percentage_change: -14.552599373715,
          stablecoin_volume_24h: 80887368824.77817,
          stablecoin_volume_24h_reported: 80887368824.77817,
          stablecoin_market_cap: 115035497531.29771,
          stablecoin_24h_percentage_change: -18.721871177865,
          derivatives_volume_24h: 176366780668.25778,
          derivatives_volume_24h_reported: 176366780668.25778,
          derivatives_24h_percentage_change: -8.941373750913,
          quote: {
            USD: {
              total_market_cap: 1939416192105.152,
              total_volume_24h: 103678071089.66,
              total_volume_24h_reported: 103678071089.66,
              altcoin_volume_24h: 73879228768.87762,
              altcoin_volume_24h_reported: 73879228768.87762,
              altcoin_market_cap: 1068666914416.7322,
              defi_volume_24h: 11171849499.90983,
              defi_volume_24h_reported: 11171849499.90983,
              defi_24h_percentage_change: -14.552599373715,
              defi_market_cap: 100662876315.55212,
              stablecoin_volume_24h: 80887368824.77817,
              stablecoin_volume_24h_reported: 80887368824.77817,
              stablecoin_24h_percentage_change: -18.721871177865,
              stablecoin_market_cap: 115035497531.29771,
              derivatives_volume_24h: 176366780668.25778,
              derivatives_volume_24h_reported: 176366780668.25778,
              derivatives_24h_percentage_change: -8.941373750913,
              last_updated: '2021-08-13T14:44:11.999Z',
              total_market_cap_yesterday: 1844975970092.2852,
              total_volume_24h_yesterday: 126740803516.14,
              total_market_cap_yesterday_percentage_change: 5.118777888914352,
              total_volume_24h_yesterday_percentage_change: -18.196769932536398,
            },
          },
          last_updated: '2021-08-13T14:44:11.999Z',
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

export function mockFailedGlobalMetricsResponse(market?: string) {
  let getPath = '/v1/global-metrics/quotes/latest'
  if (market) getPath += `?convert=${market}`
  nock('https://pro-api.coinmarketcap.com')
    .get(getPath)
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
