# Chainlink External Adapter for Coinmarketcap

![1.3.32](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/coinmarketcap/package.json)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |  Name   |                                 Description                                 |  Type  | Options | Default |
| :-------: | :-----: | :-------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     | API_KEY | An API key that can be obtained from [here](https://coinmarketcap.com/api/) | string |         |         |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                                                                                               Options                                                                                                                | Default  |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint), [dominance](#dominance-endpoint), [globalmarketcap](#globalmarketcap-endpoint), [historical](#historical-endpoint), [marketcap](#crypto-endpoint), [price](#crypto-endpoint), [volume](#crypto-endpoint) | `crypto` |

## Dominance Endpoint

https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest

`dominance` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  |    Aliases    |             Description             |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----------: | :---------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | market | `quote`, `to` | The symbol of the currency to query | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "dominance",
    "market": "BTC"
  },
  "debug": {
    "cacheKey": "68fvKmTaemya72URaHbma8IMB7s="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "data": {
      "active_cryptocurrencies": 6017,
      "total_cryptocurrencies": 11248,
      "active_market_pairs": 45167,
      "active_exchanges": 393,
      "total_exchanges": 1442,
      "eth_dominance": 19.378133207236,
      "btc_dominance": 44.897494474523,
      "eth_dominance_yesterday": 19.45085113,
      "btc_dominance_yesterday": 45.1173045,
      "eth_dominance_24h_percentage_change": -0.072717922764,
      "btc_dominance_24h_percentage_change": -0.219810025477,
      "defi_volume_24h": 11171849499.90983,
      "defi_volume_24h_reported": 11171849499.90983,
      "defi_market_cap": 100662876315.55212,
      "defi_24h_percentage_change": -14.552599373715,
      "stablecoin_volume_24h": 80887368824.77817,
      "stablecoin_volume_24h_reported": 80887368824.77817,
      "stablecoin_market_cap": 115035497531.29771,
      "stablecoin_24h_percentage_change": -18.721871177865,
      "derivatives_volume_24h": 176366780668.25778,
      "derivatives_volume_24h_reported": 176366780668.25778,
      "derivatives_24h_percentage_change": -8.941373750913,
      "quote": {
        "USD": {
          "total_market_cap": 1939416192105.152,
          "total_volume_24h": 103678071089.66,
          "total_volume_24h_reported": 103678071089.66,
          "altcoin_volume_24h": 73879228768.87762,
          "altcoin_volume_24h_reported": 73879228768.87762,
          "altcoin_market_cap": 1068666914416.7322,
          "defi_volume_24h": 11171849499.90983,
          "defi_volume_24h_reported": 11171849499.90983,
          "defi_24h_percentage_change": -14.552599373715,
          "defi_market_cap": 100662876315.55212,
          "stablecoin_volume_24h": 80887368824.77817,
          "stablecoin_volume_24h_reported": 80887368824.77817,
          "stablecoin_24h_percentage_change": -18.721871177865,
          "stablecoin_market_cap": 115035497531.29771,
          "derivatives_volume_24h": 176366780668.25778,
          "derivatives_volume_24h_reported": 176366780668.25778,
          "derivatives_24h_percentage_change": -8.941373750913,
          "last_updated": "2021-08-13T14:44:11.999Z",
          "total_market_cap_yesterday": 1844975970092.2852,
          "total_volume_24h_yesterday": 126740803516.14,
          "total_market_cap_yesterday_percentage_change": 5.118777888914352,
          "total_volume_24h_yesterday_percentage_change": -18.196769932536398
        }
      },
      "last_updated": "2021-08-13T14:44:11.999Z"
    },
    "result": 44.897494474523
  },
  "result": 44.897494474523,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

## Crypto Endpoint

https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest

**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.**

Supported names for this endpoint are: `crypto`, `marketcap`, `price`, `volume`.

### Input Params

| Required? |  Name   |             Aliases             |                    Description                     |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-----: | :-----------------------------: | :------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  base   | `coin`, `from`, `sym`, `symbol` |        The symbol of the currency to query         |        |         |         |            |                |
|    ✅     | convert |     `market`, `quote`, `to`     |      The symbol of the currency to convert to      |        |         |         |            |                |
|           |   cid   |                                 | The CMC coin ID (optional to use in place of base) | string |         |         |            |                |
|           |  slug   |                                 | The CMC coin ID (optional to use in place of base) | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "crypto",
    "resultPath": "price",
    "base": "BTC",
    "convert": "USD"
  },
  "debug": {
    "cacheKey": "OGfHdehjHraavx1cn4Ua96mPJmY=",
    "batchCacheKey": "S9lQVRuqngyyYwVYhEJCVcsxqQU=",
    "batchChildrenCacheKeys": [
      [
        "OGfHdehjHraavx1cn4Ua96mPJmY=",
        {
          "id": "1",
          "data": {
            "endpoint": "crypto",
            "resultPath": "price",
            "base": "BTC",
            "convert": "USD"
          }
        }
      ]
    ]
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "data": {
      "1": {
        "id": 1,
        "name": "Bitcoin",
        "symbol": "BTC",
        "slug": "bitcoin",
        "is_active": 1,
        "is_fiat": 0,
        "circulating_supply": 17199862,
        "total_supply": 17199862,
        "max_supply": 21000000,
        "date_added": "2013-04-28T00:00:00.000Z",
        "num_market_pairs": 331,
        "cmc_rank": 1,
        "last_updated": "2018-08-09T21:56:28.000Z",
        "tags": ["mineable"],
        "platform": null,
        "quote": {
          "USD": {
            "price": 6602.60701122,
            "volume_24h": 4314444687.5194,
            "percent_change_1h": 0.988615,
            "percent_change_24h": 4.37185,
            "percent_change_7d": -12.1352,
            "percent_change_30d": -12.1352,
            "market_cap": 113563929433.21645,
            "last_updated": "2018-08-09T21:56:28.000Z"
          }
        }
      }
    },
    "status": {
      "timestamp": "2021-07-23T14:39:23.626Z",
      "error_code": 0,
      "error_message": "",
      "elapsed": 10,
      "credit_count": 1
    },
    "result": 6602.60701122
  },
  "result": 6602.60701122,
  "statusCode": 200,
  "debug": {
    "batchablePropertyPath": [
      {
        "name": "base"
      },
      {
        "name": "convert",
        "limit": 120
      }
    ]
  },
  "providerStatusCode": 200
}
```

<details>
<summary>Additional Examples</summary>

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "crypto",
    "resultPath": "price",
    "base": "BTC",
    "convert": "USD",
    "cid": "1100"
  },
  "debug": {
    "cacheKey": "o0FSMv8ruIrLjPJJYJjZ+Eb0/2Q=",
    "batchCacheKey": "Wd3qvYisEtK0cdrn9igv+oYIMtU=",
    "batchChildrenCacheKeys": [
      [
        "o0FSMv8ruIrLjPJJYJjZ+Eb0/2Q=",
        {
          "id": "1",
          "data": {
            "endpoint": "crypto",
            "resultPath": "price",
            "base": "BTC",
            "convert": "USD",
            "cid": "1100"
          }
        }
      ]
    ]
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "data": {
      "1100": {
        "id": 1,
        "name": "Bitcoin",
        "symbol": "BTC",
        "slug": "bitcoin",
        "is_active": 1,
        "is_fiat": 0,
        "circulating_supply": 17199862,
        "total_supply": 17199862,
        "max_supply": 21000000,
        "date_added": "2013-04-28T00:00:00.000Z",
        "num_market_pairs": 331,
        "cmc_rank": 1,
        "last_updated": "2018-08-09T21:56:28.000Z",
        "tags": ["mineable"],
        "platform": null,
        "quote": {
          "USD": {
            "price": 6602.60701122,
            "volume_24h": 4314444687.5194,
            "percent_change_1h": 0.988615,
            "percent_change_24h": 4.37185,
            "percent_change_7d": -12.1352,
            "percent_change_30d": -12.1352,
            "market_cap": 113563929433.21645,
            "last_updated": "2018-08-09T21:56:28.000Z"
          }
        }
      }
    },
    "status": {
      "timestamp": "2021-07-23T14:39:23.626Z",
      "error_code": 0,
      "error_message": "",
      "elapsed": 10,
      "credit_count": 1
    },
    "result": 6602.60701122
  },
  "result": 6602.60701122,
  "statusCode": 200,
  "debug": {
    "batchablePropertyPath": [
      {
        "name": "base"
      },
      {
        "name": "convert",
        "limit": 120
      }
    ]
  },
  "providerStatusCode": 200
}
```

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "crypto",
    "resultPath": "price",
    "base": "BTC",
    "convert": "USD",
    "slug": "BTC"
  },
  "debug": {
    "cacheKey": "Gg8B/hbMcomsAmJUDMcNJBf7mcY=",
    "batchCacheKey": "c7TDhO68//9/Jk1uH2yNfnKqiAc=",
    "batchChildrenCacheKeys": [
      [
        "Gg8B/hbMcomsAmJUDMcNJBf7mcY=",
        {
          "id": "1",
          "data": {
            "endpoint": "crypto",
            "resultPath": "price",
            "base": "BTC",
            "convert": "USD",
            "slug": "BTC"
          }
        }
      ]
    ]
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "data": {
      "BTC": {
        "id": 1,
        "name": "Bitcoin",
        "symbol": "BTC",
        "slug": "bitcoin",
        "is_active": 1,
        "is_fiat": 0,
        "circulating_supply": 17199862,
        "total_supply": 17199862,
        "max_supply": 21000000,
        "date_added": "2013-04-28T00:00:00.000Z",
        "num_market_pairs": 331,
        "cmc_rank": 1,
        "last_updated": "2018-08-09T21:56:28.000Z",
        "tags": ["mineable"],
        "platform": null,
        "quote": {
          "USD": {
            "price": 6602.60701122,
            "volume_24h": 4314444687.5194,
            "percent_change_1h": 0.988615,
            "percent_change_24h": 4.37185,
            "percent_change_7d": -12.1352,
            "percent_change_30d": -12.1352,
            "market_cap": 113563929433.21645,
            "last_updated": "2018-08-09T21:56:28.000Z"
          }
        }
      }
    },
    "status": {
      "timestamp": "2021-07-23T14:39:23.626Z",
      "error_code": 0,
      "error_message": "",
      "elapsed": 10,
      "credit_count": 1
    },
    "result": 6602.60701122
  },
  "result": 6602.60701122,
  "statusCode": 200,
  "debug": {
    "batchablePropertyPath": [
      {
        "name": "base"
      },
      {
        "name": "convert",
        "limit": 120
      }
    ]
  },
  "providerStatusCode": 200
}
```

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "crypto",
    "resultPath": "price",
    "base": "BTC",
    "convert": "USD"
  },
  "debug": {
    "cacheKey": "OGfHdehjHraavx1cn4Ua96mPJmY=",
    "batchCacheKey": "S9lQVRuqngyyYwVYhEJCVcsxqQU=",
    "batchChildrenCacheKeys": [
      [
        "OGfHdehjHraavx1cn4Ua96mPJmY=",
        {
          "id": "1",
          "data": {
            "endpoint": "crypto",
            "resultPath": "price",
            "base": "BTC",
            "convert": "USD"
          }
        }
      ]
    ]
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "data": {
      "1": {
        "id": 1,
        "name": "Bitcoin",
        "symbol": "BTC",
        "slug": "bitcoin",
        "is_active": 1,
        "is_fiat": 0,
        "circulating_supply": 17199862,
        "total_supply": 17199862,
        "max_supply": 21000000,
        "date_added": "2013-04-28T00:00:00.000Z",
        "num_market_pairs": 331,
        "cmc_rank": 1,
        "last_updated": "2018-08-09T21:56:28.000Z",
        "tags": ["mineable"],
        "platform": null,
        "quote": {
          "USD": {
            "price": 6602.60701122,
            "volume_24h": 4314444687.5194,
            "percent_change_1h": 0.988615,
            "percent_change_24h": 4.37185,
            "percent_change_7d": -12.1352,
            "percent_change_30d": -12.1352,
            "market_cap": 113563929433.21645,
            "last_updated": "2018-08-09T21:56:28.000Z"
          }
        }
      }
    },
    "status": {
      "timestamp": "2021-07-23T14:39:23.626Z",
      "error_code": 0,
      "error_message": "",
      "elapsed": 10,
      "credit_count": 1
    },
    "result": 6602.60701122
  },
  "result": 6602.60701122,
  "statusCode": 200,
  "debug": {
    "batchablePropertyPath": [
      {
        "name": "base"
      },
      {
        "name": "convert",
        "limit": 120
      }
    ]
  },
  "providerStatusCode": 200
}
```

</details>

---

## GlobalMarketCap Endpoint

https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest

`globalmarketcap` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  |    Aliases    |             Description             |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----------: | :---------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | market | `quote`, `to` | The symbol of the currency to query | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "globalmarketcap",
    "market": "USD"
  },
  "debug": {
    "cacheKey": "1+HiIBSsojqbfCOU78q7iZbzdWA="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "data": {
      "active_cryptocurrencies": 6017,
      "total_cryptocurrencies": 11248,
      "active_market_pairs": 45167,
      "active_exchanges": 393,
      "total_exchanges": 1442,
      "eth_dominance": 19.378133207236,
      "btc_dominance": 44.897494474523,
      "eth_dominance_yesterday": 19.45085113,
      "btc_dominance_yesterday": 45.1173045,
      "eth_dominance_24h_percentage_change": -0.072717922764,
      "btc_dominance_24h_percentage_change": -0.219810025477,
      "defi_volume_24h": 11171849499.90983,
      "defi_volume_24h_reported": 11171849499.90983,
      "defi_market_cap": 100662876315.55212,
      "defi_24h_percentage_change": -14.552599373715,
      "stablecoin_volume_24h": 80887368824.77817,
      "stablecoin_volume_24h_reported": 80887368824.77817,
      "stablecoin_market_cap": 115035497531.29771,
      "stablecoin_24h_percentage_change": -18.721871177865,
      "derivatives_volume_24h": 176366780668.25778,
      "derivatives_volume_24h_reported": 176366780668.25778,
      "derivatives_24h_percentage_change": -8.941373750913,
      "quote": {
        "USD": {
          "total_market_cap": 1939416192105.152,
          "total_volume_24h": 103678071089.66,
          "total_volume_24h_reported": 103678071089.66,
          "altcoin_volume_24h": 73879228768.87762,
          "altcoin_volume_24h_reported": 73879228768.87762,
          "altcoin_market_cap": 1068666914416.7322,
          "defi_volume_24h": 11171849499.90983,
          "defi_volume_24h_reported": 11171849499.90983,
          "defi_24h_percentage_change": -14.552599373715,
          "defi_market_cap": 100662876315.55212,
          "stablecoin_volume_24h": 80887368824.77817,
          "stablecoin_volume_24h_reported": 80887368824.77817,
          "stablecoin_24h_percentage_change": -18.721871177865,
          "stablecoin_market_cap": 115035497531.29771,
          "derivatives_volume_24h": 176366780668.25778,
          "derivatives_volume_24h_reported": 176366780668.25778,
          "derivatives_24h_percentage_change": -8.941373750913,
          "last_updated": "2021-08-13T14:44:11.999Z",
          "total_market_cap_yesterday": 1844975970092.2852,
          "total_volume_24h_yesterday": 126740803516.14,
          "total_market_cap_yesterday_percentage_change": 5.118777888914352,
          "total_volume_24h_yesterday_percentage_change": -18.196769932536398
        }
      },
      "last_updated": "2021-08-13T14:44:11.999Z"
    },
    "result": 1939416192105.152
  },
  "result": 1939416192105.152,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

## Historical Endpoint

https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/historical

`historical` is the only supported name for this endpoint.

### Input Params

| Required? |    Name     |             Aliases             |                                   Description                                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---------: | :-----------------------------: | :-----------------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |    base     | `coin`, `from`, `sym`, `symbol` |                       The symbol of the currency to query                       | string |         |         |            |                |
|    ✅     |   convert   |     `market`, `quote`, `to`     |                    The symbol of the currency to convert to                     | string |         |         |            |                |
|           |    start    |                                 |           Timestamp (Unix or ISO 8601) to start returning quotes for            | string |         |         |            |                |
|           |     end     |                                 |            Timestamp (Unix or ISO 8601) to stop returning quotes for            | string |         |         |            |                |
|           |    count    |                                 |              The number of interval periods to return results for               | number |         |  `10`   |            |                |
|           |  interval   |                                 |                   Interval of time to return data points for                    | string |         |  `5m`   |            |                |
|           |     cid     |                                 |               The CMC coin ID (optional to use in place of base)                | string |         |         |            |                |
|           |     aux     |                                 | Optionally specify a comma-separated list of supplemental data fields to return | string |         |         |            |                |
|           | skipInvalid |                                 |                                                                                 | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "historical",
    "base": "ETH",
    "convert": "BTC",
    "start": "2021-07-23T14",
    "count": 10,
    "interval": "5m"
  },
  "debug": {
    "cacheKey": "JT2rxlQZgzUERZo0ldZev/lpySo="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "status": {
      "timestamp": "2021-12-01T14:44:08.026Z",
      "error_code": 0,
      "error_message": null,
      "elapsed": 30,
      "credit_count": 1,
      "notice": null
    },
    "data": {
      "quotes": [
        {
          "timestamp": "2021-07-23T14:04:03.000Z",
          "quote": {
            "BTC": {
              "price": 0.06372463643632112,
              "volume_24h": 504265.23763687897,
              "market_cap": 7443591.90020768,
              "timestamp": "2021-07-23T14:04:12.000Z"
            }
          }
        },
        {
          "timestamp": "2021-07-23T14:09:03.000Z",
          "quote": {
            "BTC": {
              "price": 0.06371941629686442,
              "volume_24h": 503702.65783204953,
              "market_cap": 7442982.142507192,
              "timestamp": "2021-07-23T14:09:13.000Z"
            }
          }
        },
        {
          "timestamp": "2021-07-23T14:14:08.000Z",
          "quote": {
            "BTC": {
              "price": 0.06372453768196841,
              "volume_24h": 503184.31892236834,
              "market_cap": 7443649.549774187,
              "timestamp": "2021-07-23T14:14:23.000Z"
            }
          }
        },
        {
          "timestamp": "2021-07-23T14:19:06.000Z",
          "quote": {
            "BTC": {
              "price": 0.06367490340039632,
              "volume_24h": 503087.4919427468,
              "market_cap": 7437851.780012068,
              "timestamp": "2021-07-23T14:19:12.000Z"
            }
          }
        },
        {
          "timestamp": "2021-07-23T14:24:05.000Z",
          "quote": {
            "BTC": {
              "price": 0.06362402824508358,
              "volume_24h": 501663.79642084066,
              "market_cap": 7431909.064055017,
              "timestamp": "2021-07-23T14:24:09.000Z"
            }
          }
        },
        {
          "timestamp": "2021-07-23T14:29:06.000Z",
          "quote": {
            "BTC": {
              "price": 0.06362223765893496,
              "volume_24h": 499637.90000928735,
              "market_cap": 7431699.906071862,
              "timestamp": "2021-07-23T14:29:13.000Z"
            }
          }
        },
        {
          "timestamp": "2021-07-23T14:34:04.000Z",
          "quote": {
            "BTC": {
              "price": 0.06355415525274345,
              "volume_24h": 497509.87502596335,
              "market_cap": 7423747.214838163,
              "timestamp": "2021-07-23T14:34:15.000Z"
            }
          }
        },
        {
          "timestamp": "2021-07-23T14:39:07.000Z",
          "quote": {
            "BTC": {
              "price": 0.06355962091247133,
              "volume_24h": 497304.8331171168,
              "market_cap": 7424385.657376196,
              "timestamp": "2021-07-23T14:39:19.000Z"
            }
          }
        },
        {
          "timestamp": "2021-07-23T14:44:04.000Z",
          "quote": {
            "BTC": {
              "price": 0.06363986524132226,
              "volume_24h": 496738.91156870575,
              "market_cap": 7433758.980181678,
              "timestamp": "2021-07-23T14:44:07.000Z"
            }
          }
        },
        {
          "timestamp": "2021-07-23T14:49:03.000Z",
          "quote": {
            "BTC": {
              "price": 0.06359201049147004,
              "volume_24h": 495928.26554275176,
              "market_cap": 7428169.077137268,
              "timestamp": "2021-07-23T14:49:09.000Z"
            }
          }
        }
      ],
      "id": 1027,
      "name": "Ethereum",
      "symbol": "ETH",
      "is_active": 1,
      "is_fiat": 0
    }
  },
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
