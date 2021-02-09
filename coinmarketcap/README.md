# Chainlink CoinMarketCap Pro External Adapter

### Environment Variables

| Required? |  Name   |                            Description                             | Options | Defaults to |
| :-------: | :-----: | :----------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | API_KEY | An API key that can be made [here](https://coinmarketcap.com/api/) |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |                                                    Options                                                     | Defaults to |
| :-------: | :------: | :-----------------: | :------------------------------------------------------------------------------------------------------------: | :---------: |
|           | endpoint | The endpoint to use | [price](#Price-Endpoint), [dominance](#Dominance-Endpoint), [globalMarketCap](#Market-Capitalization-Endpoint) |   `price`   |

---

## Price Endpoint

https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest

### Input Params

| Required? |                Name                |                      Description                       | Options | Defaults to |
| :-------: | :--------------------------------: | :----------------------------------------------------: | :-----: | :---------: |
|    ✅     |   `base`, `from`, `coin`, `sym`    |          The symbol of the currency to query           |         |             |
|    ✅     | `quote`, `to`, `market`, `convert` |        The symbol of the currency to convert to        |         |             |
|    🟡     |               `cid`                |  The CMC coin ID (optional to use in place of `base`)  |         |             |
|    🟡     |               `slug`               | The CMC coin name (optional to use in place of `base`) |         |             |

### Output

```json
{
  "jobRunID": "1",
  "data": {
    "status": {
      "timestamp": "2020-04-13T20:52:42.250Z",
      "error_code": 0,
      "error_message": null,
      "elapsed": 9,
      "credit_count": 1,
      "notice": null
    },
    "data": {
      "ETH": {
        "id": 1027,
        "name": "Ethereum",
        "symbol": "ETH",
        "slug": "ethereum",
        "num_market_pairs": 5135,
        "date_added": "2015-08-07T00:00:00.000Z",
        "tags": ["mineable"],
        "max_supply": null,
        "circulating_supply": 110505332.374,
        "total_supply": 110505332.374,
        "platform": null,
        "cmc_rank": 2,
        "last_updated": "2020-04-13T20:51:27.000Z",
        "quote": {
          "USD": {
            "price": 155.22087406,
            "volume_24h": 16301412264.6787,
            "percent_change_1h": 0.250983,
            "percent_change_24h": -5.25413,
            "percent_change_7d": -5.93502,
            "market_cap": 17152734279.383095,
            "last_updated": "2020-04-13T20:51:27.000Z"
          }
        }
      }
    },
    "result": 155.22087406
  },
  "result": 155.22087406,
  "statusCode": 200
}
```

## Dominance Endpoint

https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest

### Input Params

| Required? |          Name           |             Description             |   Options    | Defaults to |
| :-------: | :---------------------: | :---------------------------------: | :----------: | :---------: |
|    ✅     | `quote`, `to`, `market` | The symbol of the currency to query | `BTC`, `ETH` |             |

### Output

```json
{
  "jobRunID": "1",
  "data": {
    "status": {
      "timestamp": "2020-10-20T23:43:10.921Z",
      "error_code": 0,
      "error_message": null,
      "elapsed": 24,
      "credit_count": 1,
      "notice": null
    },
    "data": {
      "active_cryptocurrencies": 3686,
      "total_cryptocurrencies": 7458,
      "active_market_pairs": 31687,
      "active_exchanges": 357,
      "total_exchanges": 1188,
      "eth_dominance": 11.442731417817,
      "btc_dominance": 60.526174889375,
      "defi_volume_24h": 3580425804.8360143,
      "defi_volume_24h_reported": 4687819883.24599,
      "defi_market_cap": 11756342062.876287,
      "defi_24h_percentage_change": -31.901796001889,
      "stablecoin_volume_24h": 46272327712.47732,
      "stablecoin_volume_24h_reported": 54378545566.47114,
      "stablecoin_market_cap": 22530880660.946377,
      "stablecoin_24h_percentage_change": 24.589731019677,
      "derivatives_volume_24h": 23991994606.209496,
      "derivatives_volume_24h_reported": 23991994606.209496,
      "derivatives_24h_percentage_change": 30.62858016525,
      "quote": {
        "USD": {
          "total_market_cap": 364954113310.4291,
          "total_volume_24h": 86730243860.65276,
          "total_volume_24h_reported": 116107838119.04984,
          "altcoin_volume_24h": 55978895794.776985,
          "altcoin_volume_24h_reported": 71472205490.42107,
          "altcoin_market_cap": 144061348422.18985,
          "last_updated": "2020-10-20T23:40:18.000Z"
        }
      },
      "last_updated": "2020-10-20T23:40:18.000Z"
    },
    "result": 60.526174889375
  },
  "result": 60.526174889375,
  "statusCode": 200
}
```

## Market Capitalization Endpoint

https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest

### Input Params

| Required? |          Name           |             Description             | Options | Defaults to |
| :-------: | :---------------------: | :---------------------------------: | :-----: | :---------: |
|    ✅     | `quote`, `to`, `market` | The symbol of the currency to query |  `USD`  |             |

### Output

```json
{
  "jobRunID": "1",
  "data": {
    "status": {
      "timestamp": "2021-02-09T22:07:14.787Z",
      "error_code": 0,
      "error_message": null,
      "elapsed": 24,
      "credit_count": 1,
      "notice": null
    },
    "data": {
      "active_cryptocurrencies": 4039,
      "total_cryptocurrencies": 8417,
      "active_market_pairs": 33557,
      "active_exchanges": 365,
      "total_exchanges": 1271,
      "eth_dominance": 14.492658185967,
      "btc_dominance": 62.891411561113,
      "defi_volume_24h": 16138915987.218157,
      "defi_volume_24h_reported": 27444522785.122807,
      "defi_market_cap": 58964101882.03461,
      "defi_24h_percentage_change": 1.045042749245,
      "stablecoin_volume_24h": 169445823565.66757,
      "stablecoin_volume_24h_reported": 312699703386.8201,
      "stablecoin_market_cap": 47755045514.65084,
      "stablecoin_24h_percentage_change": 5.670684885241,
      "derivatives_volume_24h": 131232253607.2902,
      "derivatives_volume_24h_reported": 131237691538.61276,
      "derivatives_24h_percentage_change": 2.369666048721,
      "quote": {
        "USD": {
          "total_market_cap": 1393964637158.628,
          "total_volume_24h": 215007147237,
          "total_volume_24h_reported": 404197132217.27,
          "altcoin_volume_24h": 116627624277.44908,
          "altcoin_volume_24h_reported": 199039183261.18234,
          "altcoin_market_cap": 517280600186.8229,
          "last_updated": "2021-02-09T22:05:18.000Z"
        }
      },
      "last_updated": "2021-02-09T22:05:18.000Z"
    },
    "result": 1393964637158.628
  },
  "result": 1393964637158.628,
  "statusCode": 200
}
```
