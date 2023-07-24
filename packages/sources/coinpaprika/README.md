# COINPAPRIKA

![2.0.4](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/coinpaprika/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |            Description             |  Type  | Options | Default |
| :-------: | :----------: | :--------------------------------: | :----: | :-----: | :-----: |
|           | API_ENDPOINT | The HTTP URL to retrieve data from | string |         |         |
|           |   API_KEY    |     An API key for Coinpaprika     | string |         |         |

---

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  |                                                                                                                                         Options                                                                                                                                         | Default  |
| :-------: | :------: | :-----------------: | :----: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [coins](#coins-endpoint), [crypto-vwap](#vwap-endpoint), [crypto](#crypto-endpoint), [dominance](#globalmarketcap-endpoint), [globalmarketcap](#globalmarketcap-endpoint), [marketcap](#crypto-endpoint), [price](#crypto-endpoint), [volume](#crypto-endpoint), [vwap](#vwap-endpoint) | `crypto` |

## Crypto Endpoint

Supported names for this endpoint are: `crypto`, `marketcap`, `price`, `volume`.

### Input Params

| Required? |    Name    |    Aliases     |                              Description                               |  Type  |               Options               | Default | Depends On | Not Valid With |
| :-------: | :--------: | :------------: | :--------------------------------------------------------------------: | :----: | :---------------------------------: | :-----: | :--------: | :------------: |
|    ✅     |    base    | `coin`, `from` |             The symbol of symbols of the currency to query             | string |                                     |         |            |                |
|    ✅     |   quote    | `market`, `to` |                The symbol of the currency to convert to                | string |                                     |         |            |                |
|           |   coinid   |                |            The coin ID (optional to use in place of `base`)            | string |                                     |         |            |                |
|           | resultPath |                | The path to the result within the asset quote in the provider response | string | `market_cap`, `price`, `volume_24h` |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "base": "AAAA",
    "quote": "USD",
    "coinid": "eth-ethereum",
    "endpoint": "crypto",
    "resultPath": "price"
  },
  "debug": {
    "cacheKey": "gWjRcmQpTpE8K87sUfwnuD8ExbQ=",
    "batchCacheKey": "lHEnqy20ZxpTIz2ArGwx40Q8Tyk=",
    "batchChildrenCacheKeys": [
      [
        "gWjRcmQpTpE8K87sUfwnuD8ExbQ=",
        {
          "id": "1",
          "data": {
            "base": "AAAA",
            "quote": "USD",
            "coinid": "eth-ethereum",
            "endpoint": "crypto",
            "resultPath": "price"
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
    "payload": [
      {
        "id": "eth-ethereum",
        "name": "Ethereum",
        "symbol": "ETH",
        "rank": 2,
        "circulating_supply": 118033526,
        "total_supply": 118033574,
        "max_supply": 0,
        "beta_value": 1.08967,
        "first_data_at": "2015-08-07T00:00:00Z",
        "last_updated": "2021-10-22T18:11:05Z",
        "quotes": {
          "USD": {
            "price": 3949.2425813062,
            "volume_24h": 24136641726.138,
            "volume_24h_change_24h": -35.07,
            "market_cap": 466143026900,
            "market_cap_change_24h": -3.44,
            "percent_change_15m": 0.14,
            "percent_change_30m": -0.18,
            "percent_change_1h": -0.64,
            "percent_change_6h": -4.09,
            "percent_change_12h": -4.65,
            "percent_change_24h": -3.45,
            "percent_change_7d": 2.23,
            "percent_change_30d": 28.11,
            "percent_change_1y": 844.08,
            "ath_price": 4365.2053035,
            "ath_date": "2021-05-12T06:06:20Z",
            "percent_from_price_ath": -9.53
          }
        }
      },
      {
        "id": "btc-bitcoin",
        "name": "Bitcoin",
        "symbol": "BTC",
        "rank": 2,
        "circulating_supply": 118033526,
        "total_supply": 118033574,
        "max_supply": 0,
        "beta_value": 1.08967,
        "first_data_at": "2015-08-07T00:00:00Z",
        "last_updated": "2021-10-22T18:11:05Z",
        "quotes": {
          "USD": {
            "price": 40000.2425813062,
            "volume_24h": 24136641726.138,
            "volume_24h_change_24h": -35.07,
            "market_cap": 466143026900,
            "market_cap_change_24h": -3.44,
            "percent_change_15m": 0.14,
            "percent_change_30m": -0.18,
            "percent_change_1h": -0.64,
            "percent_change_6h": -4.09,
            "percent_change_12h": -4.65,
            "percent_change_24h": -3.45,
            "percent_change_7d": 2.23,
            "percent_change_30d": 28.11,
            "percent_change_1y": 844.08,
            "ath_price": 40000.2053035,
            "ath_date": "2021-05-12T06:06:20Z",
            "percent_from_price_ath": -9.53
          }
        }
      },
      {
        "id": "fake-btc-bitcoin",
        "name": "Fakecoin",
        "symbol": "BTC",
        "rank": 2,
        "circulating_supply": 118033526,
        "total_supply": 118033574,
        "max_supply": 0,
        "beta_value": 1.08967,
        "first_data_at": "2015-08-07T00:00:00Z",
        "last_updated": "2021-10-22T18:11:05Z",
        "quotes": {
          "USD": {
            "price": 0.11,
            "volume_24h": 24136641726.138,
            "volume_24h_change_24h": -35.07,
            "market_cap": 466143026900,
            "market_cap_change_24h": -3.44,
            "percent_change_15m": 0.14,
            "percent_change_30m": -0.18,
            "percent_change_1h": -0.64,
            "percent_change_6h": -4.09,
            "percent_change_12h": -4.65,
            "percent_change_24h": -3.45,
            "percent_change_7d": 2.23,
            "percent_change_30d": 28.11,
            "percent_change_1y": 844.08,
            "ath_price": 40000.2053035,
            "ath_date": "2021-05-12T06:06:20Z",
            "percent_from_price_ath": -9.53
          }
        }
      }
    ],
    "result": 3949.2425813062
  },
  "result": 3949.2425813062,
  "statusCode": 200,
  "debug": {
    "batchablePropertyPath": [
      {
        "name": "base"
      }
    ]
  },
  "providerStatusCode": 200
}
```

---

## Globalmarketcap Endpoint

Supported names for this endpoint are: `dominance`, `globalmarketcap`.

### Input Params

| Required? |    Name    |    Aliases    |                              Description                               |  Type  |                Options                 | Default | Depends On | Not Valid With |
| :-------: | :--------: | :-----------: | :--------------------------------------------------------------------: | :----: | :------------------------------------: | :-----: | :--------: | :------------: |
|    ✅     |   market   | `quote`, `to` |                The symbol of the currency to convert to                | string |                                        |         |            |                |
|           | resultPath |               | The path to the result within the asset quote in the provider response | string | `_dominance_percentage`, `market_cap_` |         |            |                |

### Example

There are no examples for this endpoint.

---

## Coins Endpoint

`coins` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "data": {
    "endpoint": "coins",
    "maxAge": 3600000,
    "market": ""
  },
  "method": "post",
  "id": "1",
  "debug": {
    "cacheKey": "d9e5d2b2ba68a638fe75b76bff2e1331f5b2dea9"
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": [
    {
      "id": "eth-ethereum",
      "name": "Ethereum",
      "symbol": "ETH",
      "rank": 2,
      "is_new": false,
      "is_active": true,
      "type": "token"
    },
    {
      "id": "ampl-ampleforth",
      "name": "Ampleforth",
      "symbol": "AMPL",
      "rank": 289,
      "is_new": false,
      "is_active": true,
      "type": "token"
    },
    {
      "id": "fake-btc-bitcoin",
      "name": "Fakecoin",
      "symbol": "BTC",
      "rank": 1000,
      "is_new": false,
      "is_active": true,
      "type": "token"
    },
    {
      "id": "btc-bitcoin",
      "name": "Bitcoin",
      "symbol": "BTC",
      "rank": 1,
      "is_new": false,
      "is_active": true,
      "type": "token"
    }
  ],
  "statusCode": 200,
  "providerStatusCode": 200
}
```

<details>
<summary>Additional Examples</summary>

Request:

```json
{
  "data": {
    "endpoint": "coins",
    "maxAge": 3600000,
    "market": ""
  },
  "method": "post",
  "id": "1",
  "debug": {
    "cacheKey": "d9e5d2b2ba68a638fe75b76bff2e1331f5b2dea9"
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": [
    {
      "id": "eth-ethereum",
      "name": "Ethereum",
      "symbol": "ETH",
      "rank": 2,
      "is_new": false,
      "is_active": true,
      "type": "token"
    },
    {
      "id": "ampl-ampleforth",
      "name": "Ampleforth",
      "symbol": "AMPL",
      "rank": 289,
      "is_new": false,
      "is_active": true,
      "type": "token"
    },
    {
      "id": "fake-btc-bitcoin",
      "name": "Fakecoin",
      "symbol": "BTC",
      "rank": 1000,
      "is_new": false,
      "is_active": true,
      "type": "token"
    },
    {
      "id": "btc-bitcoin",
      "name": "Bitcoin",
      "symbol": "BTC",
      "rank": 1,
      "is_new": false,
      "is_active": true,
      "type": "token"
    }
  ],
  "statusCode": 200,
  "providerStatusCode": 200
}
```

Request:

```json
{
  "data": {
    "endpoint": "coins",
    "maxAge": 3600000,
    "market": ""
  },
  "method": "post",
  "id": "1",
  "debug": {
    "cacheKey": "d9e5d2b2ba68a638fe75b76bff2e1331f5b2dea9"
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": [
    {
      "id": "eth-ethereum",
      "name": "Ethereum",
      "symbol": "ETH",
      "rank": 2,
      "is_new": false,
      "is_active": true,
      "type": "token"
    },
    {
      "id": "ampl-ampleforth",
      "name": "Ampleforth",
      "symbol": "AMPL",
      "rank": 289,
      "is_new": false,
      "is_active": true,
      "type": "token"
    },
    {
      "id": "fake-btc-bitcoin",
      "name": "Fakecoin",
      "symbol": "BTC",
      "rank": 1000,
      "is_new": false,
      "is_active": true,
      "type": "token"
    },
    {
      "id": "btc-bitcoin",
      "name": "Bitcoin",
      "symbol": "BTC",
      "rank": 1,
      "is_new": false,
      "is_active": true,
      "type": "token"
    }
  ],
  "statusCode": 200,
  "providerStatusCode": 200
}
```

Request:

```json
{
  "data": {
    "endpoint": "coins",
    "maxAge": 3600000,
    "market": ""
  },
  "method": "post",
  "id": "1",
  "debug": {
    "cacheKey": "d9e5d2b2ba68a638fe75b76bff2e1331f5b2dea9"
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": [
    {
      "id": "eth-ethereum",
      "name": "Ethereum",
      "symbol": "ETH",
      "rank": 2,
      "is_new": false,
      "is_active": true,
      "type": "token"
    },
    {
      "id": "ampl-ampleforth",
      "name": "Ampleforth",
      "symbol": "AMPL",
      "rank": 289,
      "is_new": false,
      "is_active": true,
      "type": "token"
    },
    {
      "id": "fake-btc-bitcoin",
      "name": "Fakecoin",
      "symbol": "BTC",
      "rank": 1000,
      "is_new": false,
      "is_active": true,
      "type": "token"
    },
    {
      "id": "btc-bitcoin",
      "name": "Bitcoin",
      "symbol": "BTC",
      "rank": 1,
      "is_new": false,
      "is_active": true,
      "type": "token"
    }
  ],
  "statusCode": 200,
  "providerStatusCode": 200
}
```

Request:

```json
{
  "data": {
    "endpoint": "coins",
    "maxAge": 3600000,
    "market": ""
  },
  "method": "post",
  "id": "1",
  "debug": {
    "cacheKey": "d9e5d2b2ba68a638fe75b76bff2e1331f5b2dea9"
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": [
    {
      "id": "eth-ethereum",
      "name": "Ethereum",
      "symbol": "ETH",
      "rank": 2,
      "is_new": false,
      "is_active": true,
      "type": "token"
    },
    {
      "id": "ampl-ampleforth",
      "name": "Ampleforth",
      "symbol": "AMPL",
      "rank": 289,
      "is_new": false,
      "is_active": true,
      "type": "token"
    },
    {
      "id": "fake-btc-bitcoin",
      "name": "Fakecoin",
      "symbol": "BTC",
      "rank": 1000,
      "is_new": false,
      "is_active": true,
      "type": "token"
    },
    {
      "id": "btc-bitcoin",
      "name": "Bitcoin",
      "symbol": "BTC",
      "rank": 1,
      "is_new": false,
      "is_active": true,
      "type": "token"
    }
  ],
  "statusCode": 200,
  "providerStatusCode": 200
}
```

Request:

```json
{
  "data": {
    "endpoint": "coins",
    "maxAge": 3600000,
    "market": ""
  },
  "method": "post",
  "id": "1",
  "debug": {
    "cacheKey": "d9e5d2b2ba68a638fe75b76bff2e1331f5b2dea9"
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": [
    {
      "id": "eth-ethereum",
      "name": "Ethereum",
      "symbol": "ETH",
      "rank": 2,
      "is_new": false,
      "is_active": true,
      "type": "token"
    },
    {
      "id": "ampl-ampleforth",
      "name": "Ampleforth",
      "symbol": "AMPL",
      "rank": 289,
      "is_new": false,
      "is_active": true,
      "type": "token"
    },
    {
      "id": "fake-btc-bitcoin",
      "name": "Fakecoin",
      "symbol": "BTC",
      "rank": 1000,
      "is_new": false,
      "is_active": true,
      "type": "token"
    },
    {
      "id": "btc-bitcoin",
      "name": "Bitcoin",
      "symbol": "BTC",
      "rank": 1,
      "is_new": false,
      "is_active": true,
      "type": "token"
    }
  ],
  "statusCode": 200,
  "providerStatusCode": 200
}
```

Request:

```json
{
  "data": {
    "endpoint": "coins",
    "maxAge": 3600000,
    "market": ""
  },
  "method": "post",
  "id": "1",
  "debug": {
    "cacheKey": "d9e5d2b2ba68a638fe75b76bff2e1331f5b2dea9"
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": [
    {
      "id": "eth-ethereum",
      "name": "Ethereum",
      "symbol": "ETH",
      "rank": 2,
      "is_new": false,
      "is_active": true,
      "type": "token"
    },
    {
      "id": "ampl-ampleforth",
      "name": "Ampleforth",
      "symbol": "AMPL",
      "rank": 289,
      "is_new": false,
      "is_active": true,
      "type": "token"
    },
    {
      "id": "fake-btc-bitcoin",
      "name": "Fakecoin",
      "symbol": "BTC",
      "rank": 1000,
      "is_new": false,
      "is_active": true,
      "type": "token"
    },
    {
      "id": "btc-bitcoin",
      "name": "Bitcoin",
      "symbol": "BTC",
      "rank": 1,
      "is_new": false,
      "is_active": true,
      "type": "token"
    }
  ],
  "statusCode": 200,
  "providerStatusCode": 200
}
```

Request:

```json
{
  "data": {
    "endpoint": "coins",
    "maxAge": 3600000,
    "market": ""
  },
  "method": "post",
  "id": "1",
  "debug": {
    "cacheKey": "d9e5d2b2ba68a638fe75b76bff2e1331f5b2dea9"
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": [
    {
      "id": "eth-ethereum",
      "name": "Ethereum",
      "symbol": "ETH",
      "rank": 2,
      "is_new": false,
      "is_active": true,
      "type": "token"
    },
    {
      "id": "ampl-ampleforth",
      "name": "Ampleforth",
      "symbol": "AMPL",
      "rank": 289,
      "is_new": false,
      "is_active": true,
      "type": "token"
    },
    {
      "id": "fake-btc-bitcoin",
      "name": "Fakecoin",
      "symbol": "BTC",
      "rank": 1000,
      "is_new": false,
      "is_active": true,
      "type": "token"
    },
    {
      "id": "btc-bitcoin",
      "name": "Bitcoin",
      "symbol": "BTC",
      "rank": 1,
      "is_new": false,
      "is_active": true,
      "type": "token"
    }
  ],
  "statusCode": 200,
  "providerStatusCode": 200
}
```

</details>

---

## Vwap Endpoint

Supported names for this endpoint are: `crypto-vwap`, `vwap`.

### Input Params

| Required? |  Name  |    Aliases     |                   Description                    |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :------------: | :----------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  base  | `coin`, `from` |  The symbol of symbols of the currency to query  | string |         |         |            |                |
|           | hours  |                |         Number of hours to get VWAP for          | number |         |  `24`   |            |                |
|           | coinid |                | The coin ID (optional to use in place of `base`) | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "base": "AAAA",
    "hours": 24,
    "endpoint": "vwap",
    "resultPath": "price",
    "overrides": {
      "coinpaprika": {
        "AAAA": "ampl-ampleforth"
      }
    }
  },
  "debug": {
    "cacheKey": "DvcmCsFPINIx6W1M7OBaRK0sTOw="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "0": {
      "timestamp": "2022-01-30T00:00:00Z",
      "price": 0.949723,
      "volume_24h": 1354916,
      "market_cap": 106686649
    },
    "cost": 2,
    "result": 0.949723
  },
  "result": 0.949723,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
