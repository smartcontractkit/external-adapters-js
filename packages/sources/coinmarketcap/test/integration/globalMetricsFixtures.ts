import nock from 'nock'

export function mockSuccessfulGlobalMetricsResponse(market?: string) {
    let getPath = "/v1/global-metrics/quotes/latest"
    if (market) getPath += `?convert=${market}`
    nock('https://pro-api.coinmarketcap.com')
    .get(getPath)
    .reply(
        200,
        {
            "data":{
               "btc_dominance":67.0057,
               "eth_dominance":9.02205,
               "active_cryptocurrencies":2941,
               "total_cryptocurrencies":4637,
               "active_market_pairs":21209,
               "active_exchanges":445,
               "total_exchanges":677,
               "last_updated":"2019-05-16T18:47:00.000Z",
               "quote":{
                  "active_cryptocurrencies":4986,
                  "total_cryptocurrencies":9607,
                  "active_market_pairs":39670,
                  "active_exchanges":372,
                  "total_exchanges":1347,
                  "eth_dominance":16.989007016505,
                  "btc_dominance":45.002265776962,
                  "eth_dominance_yesterday":17.25405255,
                  "btc_dominance_yesterday":45.41455043,
                  "eth_dominance_24h_percentage_change":-0.265045533495,
                  "btc_dominance_24h_percentage_change":-0.412284653038,
                  "defi_volume_24h":20443320643.718483,
                  "defi_volume_24h_reported":20443320643.718483,
                  "defi_market_cap":131290122769.1664,
                  "defi_24h_percentage_change":-17.648761478379,
                  "stablecoin_volume_24h":209258420492.51562,
                  "stablecoin_volume_24h_reported":209258420492.51562,
                  "stablecoin_market_cap":95606043432.70901,
                  "stablecoin_24h_percentage_change":2.518312658305,
                  "derivatives_volume_24h":282420341063.98895,
                  "derivatives_volume_24h_reported":282420341063.98895,
                  "derivatives_24h_percentage_change":-13.893947771549,
                  "quote":{
                     "USD":{
                        "total_market_cap":2374432083905.6846,
                        "total_volume_24h":262906061281.24,
                        "total_volume_24h_reported":262906061281.24,
                        "altcoin_volume_24h":195175095816.0813,
                        "altcoin_volume_24h_reported":195175095816.0813,
                        "altcoin_market_cap":1305883846812.9905,
                        "defi_volume_24h":20443320643.718483,
                        "defi_volume_24h_reported":20443320643.718483,
                        "defi_24h_percentage_change":-17.648761478379,
                        "defi_market_cap":131290122769.1664,
                        "stablecoin_volume_24h":209258420492.51562,
                        "stablecoin_volume_24h_reported":209258420492.51562,
                        "stablecoin_24h_percentage_change":2.518312658305,
                        "stablecoin_market_cap":95606043432.70901,
                        "derivatives_volume_24h":282420341063.98895,
                        "derivatives_volume_24h_reported":282420341063.98895,
                        "derivatives_24h_percentage_change":-13.893947771549,
                        "last_updated":"2021-05-06T01:45:17.999Z",
                        "total_market_cap_yesterday":2255175879567.3643,
                        "total_volume_24h_yesterday":254911841723.5,
                        "total_market_cap_yesterday_percentage_change":5.288111025788297,
                        "total_volume_24h_yesterday_percentage_change":3.1360722607823135
                     }
                  },
                  "last_updated":"2021-05-06T01:45:17.999Z"
               }
            },
            "status":{
               "timestamp":"2021-07-23T14:39:23.626Z",
               "error_code":0,
               "error_message":"",
               "elapsed":10,
               "credit_count":1
            }
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

export function mockFailedGloalMetricsResponse(market?: string) {
    let getPath = "/v1/global-metrics/quotes/latest"
    if (market) getPath += `?convert=${market}`
    nock('https://pro-api.coinmarketcap.com')
      .get(getPath)
      .reply(
        429,
        {
            "status": {
                "timestamp": "2018-06-02T22:51:28.209Z",
                "error_code": 1008,
                "error_message": "You've exceeded your API Key's HTTP request rate limit. Rate limits reset every minute.",
                "elapsed": 10,
                "credit_count": 0
            }
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

export function mockSuccessfulCoinMarketCapResponseWithSlug(slug = "BTC") {
    nock('https://pro-api.coinmarketcap.com')
      .get(`/v1/cryptocurrency/quotes/latest?convert=USD&slug=${slug}`)
      .reply(
          200,
          {           
              "data": {
                  [slug]: {
                      "id":1,
                      "name":"Bitcoin",
                      "symbol":"BTC",
                      "slug":"bitcoin",
                      "is_active":1,
                      "is_fiat":0,
                      "circulating_supply":17199862,
                      "total_supply":17199862,
                      "max_supply":21000000,
                      "date_added":"2013-04-28T00:00:00.000Z",
                      "num_market_pairs":331,
                      "cmc_rank":1,
                      "last_updated":"2018-08-09T21:56:28.000Z",
                      "tags":[
                          "mineable"
                      ],
                      "platform":null,
                      "quote":{
                          "USD":{
                          "price":6602.60701122,
                          "volume_24h":4314444687.5194,
                          "percent_change_1h":0.988615,
                          "percent_change_24h":4.37185,
                          "percent_change_7d":-12.1352,
                          "percent_change_30d":-12.1352,
                          "market_cap":113563929433.21645,
                          "last_updated":"2018-08-09T21:56:28.000Z"
                          }
                      }
                  }
              },
              "status":{
                  "timestamp":"2021-07-23T14:39:23.626Z",
                  "error_code":0,
                  "error_message":"",
                  "elapsed":10,
                  "credit_count":1
              }
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