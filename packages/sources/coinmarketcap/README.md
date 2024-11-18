# COINMARKETCAP

![2.0.34](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/coinmarketcap/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |                             Description                             |  Type  | Options |                 Default                 |
| :-------: | :----------: | :-----------------------------------------------------------------: | :----: | :-----: | :-------------------------------------: |
|    ✅     |   API_KEY    | An API key that can be obtained from https://coinmarketcap.com/api/ | string |         |                                         |
|           | API_ENDPOINT |                  An API endpoint for coinmarketcap                  | string |         | `https://pro-api.coinmarketcap.com/v1/` |

---

## Data Provider Rate Limits

|     Name     | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |                                       Note                                        |
| :----------: | :-------------------------: | :-------------------------: | :-----------------------: | :-------------------------------------------------------------------------------: |
|     free     |                             |             30              |            13             | 10k credits/month, 730h in a month, ignoring daily limits since they're soft caps |
|   hobbyist   |                             |             30              |            54             |                                                                                   |
|   startup    |                             |             30              |            164            |                                                                                   |
|   standard   |                             |             60              |            684            |                                                                                   |
| professional |                             |             90              |           4108            |                                                                                   |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                                                                               Options                                                                                                                | Default  |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint), [dominance](#dominance-endpoint), [globalmarketcap](#globalmarketcap-endpoint), [historical](#historical-endpoint), [marketcap](#crypto-endpoint), [price](#crypto-endpoint), [volume](#crypto-endpoint) | `crypto` |

## Globalmarketcap Endpoint

`globalmarketcap` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  |    Aliases    |             Description             |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----------: | :---------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | market | `quote`, `to` | The symbol of the currency to query | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "globalmarketcap",
    "market": "BTC"
  }
}
```

---

## Dominance Endpoint

`dominance` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  |    Aliases    |             Description             |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----------: | :---------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | market | `quote`, `to` | The symbol of the currency to query | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "dominance",
    "market": "BTC"
  }
}
```

---

## Historical Endpoint

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
  "data": {
    "endpoint": "historical",
    "base": "ETH",
    "convert": "BTC",
    "count": 10,
    "interval": "5m",
    "start": "2021-07-23T14"
  }
}
```

---

## Crypto Endpoint

Supported names for this endpoint are: `crypto`, `marketcap`, `price`, `volume`.

### Input Params

| Required? |    Name    |             Aliases             |                              Description                               |  Type  |               Options               | Default | Depends On | Not Valid With |
| :-------: | :--------: | :-----------------------------: | :--------------------------------------------------------------------: | :----: | :---------------------------------: | :-----: | :--------: | :------------: |
|    ✅     |    base    | `coin`, `from`, `sym`, `symbol` |             The symbol of symbols of the currency to query             | string |                                     |         |            |                |
|    ✅     |   quote    |    `convert`, `market`, `to`    |                The symbol of the currency to convert to                | string |                                     |         |            |                |
|           |    cid     |                                 |           The CMC coin ID (optional to use in place of base)           | string |                                     |         |            |                |
|           |    slug    |                                 |           The CMC coin ID (optional to use in place of base)           | string |                                     |         |            |                |
|           | resultPath |                                 | The path to the result within the asset quote in the provider response | string | `market_cap`, `price`, `volume_24h` |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "crypto",
    "base": "BTC",
    "quote": "USD",
    "resultPath": "price"
  }
}
```

---

MIT License
