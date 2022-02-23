# Chainlink CoinMarketCap Pro External Adapter

Version: 1.3.17

This README was generated automatically. Please see [scripts](../../scripts) for more info.

## Environment Variables

| Required? |  Name   |                                 Description                                 |  Type  | Options | Default |
| :-------: | :-----: | :-------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     | API_KEY | An API key that can be obtained from [here](https://coinmarketcap.com/api/) | string |         |         |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                                                                               Options                                                                                                                | Default  |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint), [dominance](#dominance-endpoint), [globalmarketcap](#globalmarketcap-endpoint), [historical](#historical-endpoint), [marketcap](#crypto-endpoint), [price](#crypto-endpoint), [volume](#crypto-endpoint) | `crypto` |

---

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
  }
}
```

Response:

```json
{
  "result": 44.897494474523
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
  }
}
```

Response:

```json
{
  "result": 6602.60701122
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
  }
}
```

Response:

```json
{
  "result": 6602.60701122
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
  }
}
```

Response:

```json
{
  "result": 6602.60701122
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
  }
}
```

Response:

```json
{
  "result": 6602.60701122
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
  }
}
```

Response:

```json
{
  "result": 1939416192105.152
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
  }
}
```

Response:

```json
{
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
}
```

---
