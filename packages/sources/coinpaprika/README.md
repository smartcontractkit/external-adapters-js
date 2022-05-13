# Chainlink External Adapter for CoinPaprika

![1.8.5](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/coinpaprika/package.json)

_Note: the `-single` endpoints have the same functionality as their original endpoint, except they will only fetch data for the single asset being queried._

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description | Type | Options | Default |
| :-------: | :----------: | :---------: | :--: | :-----: | :-----: |
|           |   API_KEY    |             |      |         |         |
|           | IS_TEST_MODE |             |      |         |         |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                                                                                                                                          Options                                                                                                                                                           | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [coins](#coins-endpoint), [crypto-single](#cryptosingle-endpoint), [crypto-vwap](#vwap-endpoint), [crypto](#crypto-endpoint), [dominance](#dominance-endpoint), [globalmarketcap](#globalmarketcap-endpoint), [marketcap](#crypto-endpoint), [price](#crypto-endpoint), [volume](#crypto-endpoint), [vwap](#vwap-endpoint) | `crypto` |

## Crypto Endpoint

The `marketcap` endpoint fetches market cap of assets, the `volume` endpoint fetches 24-hour volume of assets, and the `crypto`/`price` endpoint fetches current price of asset pairs (https://api.coinpaprika.com/v1/tickers/`{COIN}`).

**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.**

Supported names for this endpoint are: `crypto`, `marketcap`, `price`, `volume`.

### Input Params

| Required? |  Name  |    Aliases     |                   Description                    |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :------------: | :----------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  base  | `coin`, `from` |       The symbol of the currency to query        |        |         |         |            |                |
|    ✅     | quote  | `market`, `to` |     The symbol of the currency to convert to     |        |         |         |            |                |
|           | coinid |                | The coin ID (optional to use in place of `base`) | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "crypto",
    "resultPath": "price",
    "base": "AAAA",
    "quote": "USD",
    "coinid": "eth-ethereum"
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
            "endpoint": "crypto",
            "resultPath": "price",
            "base": "AAAA",
            "quote": "USD",
            "coinid": "eth-ethereum"
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

## CryptoSingle Endpoint

`crypto-single` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  |    Aliases     |                   Description                    |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :------------: | :----------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  base  | `coin`, `from` |       The symbol of the currency to query        | string |         |         |            |                |
|    ✅     | quote  | `market`, `to` |     The symbol of the currency to convert to     | string |         |         |            |                |
|           | coinid |                | The coin ID (optional to use in place of `base`) | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "crypto-single",
    "resultPath": "quotes.USD.price",
    "overrides": {
      "coinpaprika": {
        "AMPL": "eth-ethereum"
      }
    },
    "base": "AMPL",
    "quote": "USD"
  },
  "debug": {
    "cacheKey": "/qwtSQkI+hFL1XyVcMlcZ5qYWwE="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
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
    },
    "cost": 2,
    "result": 3949.2425813062
  },
  "result": 3949.2425813062,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

## Dominance Endpoint

Returns Bitcoin's dominance from the [global endpoint](https://api.coinpaprika.com/v1/global)

`dominance` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  |    Aliases    |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | market | `quote`, `to` | The symbol of the currency to convert to | string |         |         |            |                |

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
    "market_cap_usd": 2559344984924,
    "volume_24h_usd": 217605673763,
    "bitcoin_dominance_percentage": 44.68,
    "cryptocurrencies_number": 5438,
    "market_cap_ath_value": 2729904005915,
    "market_cap_ath_date": "2021-10-21T09:45:00Z",
    "volume_24h_ath_value": 33401557439370,
    "volume_24h_ath_date": "2021-10-22T12:50:00Z",
    "volume_24h_percent_from_ath": -99.35,
    "volume_24h_percent_to_ath": 9999.99,
    "market_cap_change_24h": -1.86,
    "volume_24h_change_24h": -18.21,
    "last_updated": 1634927806,
    "result": 44.68
  },
  "result": 44.68,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

## GlobalMarketcap Endpoint

Returns the global market capitilization from the [global endpoint](https://api.coinpaprika.com/v1/global)

`globalmarketcap` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  |    Aliases    |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | market | `quote`, `to` | The symbol of the currency to convert to | string |         |         |            |                |

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
    "market_cap_usd": 2559344984924,
    "volume_24h_usd": 217605673763,
    "bitcoin_dominance_percentage": 44.68,
    "cryptocurrencies_number": 5438,
    "market_cap_ath_value": 2729904005915,
    "market_cap_ath_date": "2021-10-21T09:45:00Z",
    "volume_24h_ath_value": 33401557439370,
    "volume_24h_ath_date": "2021-10-22T12:50:00Z",
    "volume_24h_percent_from_ath": -99.35,
    "volume_24h_percent_to_ath": 9999.99,
    "market_cap_change_24h": -1.86,
    "volume_24h_change_24h": -18.21,
    "last_updated": 1634927806,
    "result": 2559344984924
  },
  "result": 2559344984924,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

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
    "maxAge": 3600000
  },
  "method": "post",
  "id": "1",
  "debug": {
    "cacheKey": "16607850245678131884eaa9434d0887e296f93d"
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
    "maxAge": 3600000
  },
  "method": "post",
  "id": "1",
  "debug": {
    "cacheKey": "16607850245678131884eaa9434d0887e296f93d"
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
    "maxAge": 3600000
  },
  "method": "post",
  "id": "1",
  "debug": {
    "cacheKey": "16607850245678131884eaa9434d0887e296f93d"
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
    "maxAge": 3600000
  },
  "method": "post",
  "id": "1",
  "debug": {
    "cacheKey": "16607850245678131884eaa9434d0887e296f93d"
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
    "maxAge": 3600000
  },
  "method": "post",
  "id": "1",
  "debug": {
    "cacheKey": "16607850245678131884eaa9434d0887e296f93d"
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
    "maxAge": 3600000
  },
  "method": "post",
  "id": "1",
  "debug": {
    "cacheKey": "16607850245678131884eaa9434d0887e296f93d"
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
    "maxAge": 3600000
  },
  "method": "post",
  "id": "1",
  "debug": {
    "cacheKey": "16607850245678131884eaa9434d0887e296f93d"
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
    "maxAge": 3600000
  },
  "method": "post",
  "id": "1",
  "debug": {
    "cacheKey": "16607850245678131884eaa9434d0887e296f93d"
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
|    ✅     |  base  | `coin`, `from` |                                                  | string |         |         |            |                |
|           | hours  |                |         Number of hours to get VWAP for          | number |         |  `24`   |            |                |
|           | coinid |                | The coin ID (optional to use in place of `base`) | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "vwap",
    "resultPath": "0.price",
    "overrides": {
      "coinpaprika": {
        "AAAA": "ampl-ampleforth"
      }
    },
    "base": "AAAA",
    "hours": 24
  },
  "debug": {
    "cacheKey": "I7txxQfwZOs1CsZp7ftEXG3XiXk="
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
