# IEXCLOUD

![2.0.8](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/iex-cloud/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |                                       Description                                       |  Type  | Options |              Default               |
| :-------: | :----------: | :-------------------------------------------------------------------------------------: | :----: | :-----: | :--------------------------------: |
|           | API_ENDPOINT |                               API endpoint for iex-cloud                                | string |         | `https://cloud.iexapis.com/stable` |
|    ✅     |   API_KEY    | An API key that can be obtained from [here](https://iexcloud.io/cloud-login#/register/) | string |         |                                    |

---

## Data Provider Rate Limits

|    Name    | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |            Note             |
| :--------: | :-------------------------: | :-------------------------: | :-----------------------: | :-------------------------: |
| individual |                             |                             |       6944.44444444       | only mentions monthly limit |
|  business  |                             |                             |       208333.333333       | only mentions monthly limit |

---

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  |                                                              Options                                                              | Default |
| :-------: | :------: | :-----------------: | :----: | :-------------------------------------------------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint), [eod-close](#eod-endpoint), [eod](#eod-endpoint), [price](#crypto-endpoint), [stock](#stock-endpoint) | `stock` |

## Crypto Endpoint

Supported names for this endpoint are: `crypto`, `price`.

### Input Params

| Required? | Name  |              Aliases              |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :-------------------------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `asset`, `coin`, `from`, `symbol` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote |          `market`, `to`           |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "base": "ETH",
    "quote": "USD",
    "endpoint": "crypto"
  },
  "debug": {
    "cacheKey": "QNtSfU2ZYHGMNgEwRtz4Tw9qb/U="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "symbol": "ETHUSD",
    "primaryExchange": "",
    "sector": "cryptocurrency",
    "calculationPrice": "realtime",
    "high": null,
    "low": null,
    "latestPrice": "4539.44",
    "latestSource": "Real time price",
    "latestUpdate": 1636104293805,
    "latestVolume": "0.413756",
    "previousClose": null,
    "result": 4539.44
  },
  "result": 4539.44,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

## Stock Endpoint

`stock` is the only supported name for this endpoint.

### Input Params

| Required? | Name |                   Aliases                   |        Description        |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :-----------------------------------------: | :-----------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `asset`, `coin`, `from`, `symbol`, `ticker` | The stock ticker to query | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "base": "USD",
    "endpoint": "stock"
  },
  "debug": {
    "cacheKey": "vUFTdjiClK4fJKdPdN1wirkMJdk="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "avgTotalVolume": 142295,
    "calculationPrice": "close",
    "change": 4.7,
    "changePercent": 0.10665,
    "close": 48.77,
    "closeSource": "official",
    "closeTime": 1636056000195,
    "companyName": "ProShares Trust - ProShares Ultra Semiconductors",
    "currency": "USD",
    "delayedPrice": 48.74,
    "delayedPriceTime": 1636055923441,
    "extendedChange": 0,
    "extendedChangePercent": 0,
    "extendedPrice": 48.77,
    "extendedPriceTime": 1636070400048,
    "high": 50.02,
    "highSource": "15 minute delayed price",
    "highTime": 1636055981354,
    "iexAskPrice": 0,
    "iexAskSize": 0,
    "iexBidPrice": 0,
    "iexBidSize": 0,
    "iexClose": 48.74,
    "iexCloseTime": 1636053229277,
    "iexLastUpdated": 1636053229277,
    "iexMarketPercent": 0.001523796023955491,
    "iexOpen": 48.74,
    "iexOpenTime": 1636053229277,
    "iexRealtimePrice": 48.74,
    "iexRealtimeSize": 100,
    "iexVolume": 387,
    "lastTradeTime": 1636055923441,
    "latestPrice": 48.77,
    "latestSource": "Close",
    "latestTime": "November 4, 2021",
    "latestUpdate": 1636056000195,
    "latestVolume": 253971,
    "low": 45.3,
    "lowSource": "15 minute delayed price",
    "lowTime": 1636032600126,
    "marketCap": 443807000,
    "oddLotDelayedPrice": 48.72,
    "oddLotDelayedPriceTime": 1636055981353,
    "open": 45.3,
    "openTime": 1636032600126,
    "openSource": "official",
    "peRatio": null,
    "previousClose": 44.07,
    "previousVolume": 288407,
    "primaryExchange": "NYSE ARCA",
    "symbol": "USD",
    "volume": 0,
    "week52High": 50.02,
    "week52Low": 20.26,
    "ytdChange": 0.810991100261046,
    "isUSMarketOpen": false,
    "result": 48.77
  },
  "result": 48.77,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

## Eod Endpoint

Supported names for this endpoint are: `eod`, `eod-close`.

### Input Params

| Required? | Name |                   Aliases                   |        Description        |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :-----------------------------------------: | :-----------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `asset`, `coin`, `from`, `symbol`, `ticker` | The stock ticker to query | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "base": "USD",
    "endpoint": "eod"
  },
  "debug": {
    "cacheKey": "ltjBvntfHXGAo/NFw8mBiRHcbMU="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "avgTotalVolume": 142295,
    "calculationPrice": "close",
    "change": 4.7,
    "changePercent": 0.10665,
    "close": 48.77,
    "closeSource": "official",
    "closeTime": 1636056000195,
    "companyName": "ProShares Trust - ProShares Ultra Semiconductors",
    "currency": "USD",
    "delayedPrice": 48.74,
    "delayedPriceTime": 1636055923441,
    "extendedChange": 0,
    "extendedChangePercent": 0,
    "extendedPrice": 48.77,
    "extendedPriceTime": 1636070400048,
    "high": 50.02,
    "highSource": "15 minute delayed price",
    "highTime": 1636055981354,
    "iexAskPrice": 0,
    "iexAskSize": 0,
    "iexBidPrice": 0,
    "iexBidSize": 0,
    "iexClose": 48.74,
    "iexCloseTime": 1636053229277,
    "iexLastUpdated": 1636053229277,
    "iexMarketPercent": 0.001523796023955491,
    "iexOpen": 48.74,
    "iexOpenTime": 1636053229277,
    "iexRealtimePrice": 48.74,
    "iexRealtimeSize": 100,
    "iexVolume": 387,
    "lastTradeTime": 1636055923441,
    "latestPrice": 48.77,
    "latestSource": "Close",
    "latestTime": "November 4, 2021",
    "latestUpdate": 1636056000195,
    "latestVolume": 253971,
    "low": 45.3,
    "lowSource": "15 minute delayed price",
    "lowTime": 1636032600126,
    "marketCap": 443807000,
    "oddLotDelayedPrice": 48.72,
    "oddLotDelayedPriceTime": 1636055981353,
    "open": 45.3,
    "openTime": 1636032600126,
    "openSource": "official",
    "peRatio": null,
    "previousClose": 44.07,
    "previousVolume": 288407,
    "primaryExchange": "NYSE ARCA",
    "symbol": "USD",
    "volume": 0,
    "week52High": 50.02,
    "week52Low": 20.26,
    "ytdChange": 0.810991100261046,
    "isUSMarketOpen": false,
    "result": 48.77
  },
  "result": 48.77,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
