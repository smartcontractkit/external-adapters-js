# TIINGO

![2.6.6](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/tiingo/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Known Issues

### CACHE_MAX_AGE interaction with Heartbeat messages

If `CACHE_MAX_AGE` is set below a current heartbeat interval (120000ms), the extended cache TTL feature for out-of-market-hours in IEX endpoint that relies on heartbeats will not work.

### CACHE_MAX_AGE interaction with WS_SUBSCRIPTION_TTL

If the value of `WS_SUBSCRIPTION_TTL` is less than the value of `CACHE_MAX_AGE`, there will be stale values in the cache.

## Environment Variables

| Required? |      Name       |          Description          |  Type  | Options |          Default          |
| :-------: | :-------------: | :---------------------------: | :----: | :-----: | :-----------------------: |
|           |  API_ENDPOINT   |    API endpoint for tiingo    | string |         | `https://api.tiingo.com/` |
|    ✅     |     API_KEY     |      API key for tiingo       | string |         |                           |
|           | WS_API_ENDPOINT | websocket endpoint for tiingo | string |         |  `wss://api.tiingo.com`   |

---

## Data Provider Rate Limits

|    Name    | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |                                                             Note                                                             |
| :--------: | :-------------------------: | :-------------------------: | :-----------------------: | :--------------------------------------------------------------------------------------------------------------------------: |
|  starter   |                             |                             |            41             |     Starter tier, 50 requests per hour. With a maximum of 1,000 requests per day (https://api.tiingo.com/about/pricing)      |
|   power    |                             |                             |           2080            |    Power tier, 5,000 requests per hour. With a maximum of 50,000 requests per day (https://api.tiingo.com/about/pricing)     |
| commercial |                             |                             |           6250            | Commercial tier, 20,000 requests per hour. With a maximum of 150,000 requests per day (https://api.tiingo.com/about/pricing) |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                                                                                                                                                                                                                                                                                             Options                                                                                                                                                                                                                                                                                                                             | Default  |
| :-------: | :------: | :-----------------: | :----: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [commodities](#forex-endpoint), [crypto-lwba](#crypto-lwba-endpoint), [crypto-synth](#crypto-endpoint), [crypto-vwap](#vwap-endpoint), [crypto](#crypto-endpoint), [crypto_lwba](#crypto-lwba-endpoint), [cryptolwba](#crypto-lwba-endpoint), [cryptoyield](#cryptoyield-endpoint), [eod](#eod-endpoint), [forex](#forex-endpoint), [fx](#forex-endpoint), [iex](#iex-endpoint), [price](#crypto-endpoint), [prices](#crypto-endpoint), [realized-vol](#realized-vol-endpoint), [realized-volatility](#realized-vol-endpoint), [stock](#iex-endpoint), [top](#top-endpoint), [volume](#volume-endpoint), [vwap](#vwap-endpoint), [yield](#cryptoyield-endpoint) | `crypto` |

## Crypto Endpoint

Supported names for this endpoint are: `crypto`, `crypto-synth`, `price`, `prices`.

### Input Params

| Required? | Name  |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "crypto",
    "base": "ETH",
    "quote": "USD"
  }
}
```

---

## Volume Endpoint

`volume` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "volume",
    "base": "ETH",
    "quote": "USD"
  }
}
```

---

## Top Endpoint

`top` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "top",
    "base": "ETH",
    "quote": "USD"
  }
}
```

---

## Eod Endpoint

`eod` is the only supported name for this endpoint.

### Input Params

| Required? | Name |                   Aliases                   |        Description        |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :-----------------------------------------: | :-----------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `asset`, `coin`, `from`, `symbol`, `ticker` | The stock ticker to query | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "eod",
    "base": "USD"
  }
}
```

---

## Iex Endpoint

Supported names for this endpoint are: `iex`, `stock`.

### Input Params

| Required? | Name |                   Aliases                   |        Description        |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :-----------------------------------------: | :-----------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `asset`, `coin`, `from`, `symbol`, `ticker` | The stock ticker to query | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "iex",
    "base": "aapl"
  }
}
```

---

## Forex Endpoint

Supported names for this endpoint are: `commodities`, `forex`, `fx`.

### Input Params

| Required? | Name  |          Aliases          |       Description       |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :-----------------------: | :---------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `asset`, `from`, `market` |   The asset to query    | string |         |         |            |                |
|    ✅     | quote |           `to`            | The quote to convert to | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "forex",
    "base": "GBP",
    "quote": "USD"
  }
}
```

---

## Vwap Endpoint

Supported names for this endpoint are: `crypto-vwap`, `vwap`.

### Input Params

| Required? | Name  |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "vwap",
    "base": "ETH",
    "quote": "USD"
  }
}
```

---

## Crypto-lwba Endpoint

Supported names for this endpoint are: `crypto-lwba`, `crypto_lwba`, `cryptolwba`.

### Input Params

| Required? | Name  |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Cryptoyield Endpoint

Supported names for this endpoint are: `cryptoyield`, `yield`.

### Input Params

| Required? |  Name   | Aliases |  Description   |  Type  |     Options      | Default | Depends On | Not Valid With |
| :-------: | :-----: | :-----: | :------------: | :----: | :--------------: | :-----: | :--------: | :------------: |
|    ✅     | aprTerm |         | Yield apr term | string | `30Day`, `90Day` |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "cryptoyield",
    "aprTerm": "30Day"
  }
}
```

---

## Realized-vol Endpoint

Supported names for this endpoint are: `realized-vol`, `realized-volatility`.

### Input Params

| Required? |    Name    |    Aliases     |                       Description                        |  Type  | Options |    Default     | Depends On | Not Valid With |
| :-------: | :--------: | :------------: | :------------------------------------------------------: | :----: | :-----: | :------------: | :--------: | :------------: |
|    ✅     |    base    | `coin`, `from` |  The base currency to query the realized volatility for  | string |         |                |            |                |
|           |  convert   | `quote`, `to`  | The quote currency to convert the realized volatility to | string |         |     `USD`      |            |                |
|           | resultPath |                |        The field to return within the result path        | string |         | `realVol30Day` |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "realized-vol",
    "base": "ETH",
    "convert": "USD",
    "resultPath": "realVol30Day"
  }
}
```

---

MIT License
