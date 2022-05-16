# Chainlink External Adapter for CurrencyLayer

![1.3.32](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/currencylayer/package.json)

Base URL https://api.currencylayer.com

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |                                  Description                                   |  Type  | Options |             Default             |
| :-------: | :----------: | :----------------------------------------------------------------------------: | :----: | :-----: | :-----------------------------: |
|    ✅     |   API_KEY    | An API key that can be obtained from [here](https://currencylayer.com/product) | string |         |                                 |
|           | API_ENDPOINT |                                                                                | string |         | `https://api.currencylayer.com` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                                Options                                                 |  Default  |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------------------------------------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [convert](#convert-endpoint), [forex](#live-endpoint), [live](#live-endpoint), [price](#live-endpoint) | `convert` |

## Convert Endpoint

`convert` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  |    Aliases     |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  base  | `coin`, `from` |   The symbol of the currency to query    | string |         |         |            |                |
|    ✅     | quote  | `market`, `to` | The symbol of the currency to convert to | string |         |         |            |                |
|           | amount |                |        An amount of the currency         | number |         |   `1`   |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "convert",
    "base": "BTC",
    "quote": "USD",
    "amount": 1
  },
  "debug": {
    "cacheKey": "fE+e01CMPOlT/0yVAcTGT32JAlQ="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "success": true,
    "terms": "https://currencylayer.com/terms",
    "privacy": "https://currencylayer.com/privacy",
    "query": {
      "from": "BTC",
      "to": "USD",
      "amount": 1
    },
    "info": {
      "timestamp": 1635800883,
      "quote": 60535.74
    },
    "result": 60535.74
  },
  "result": 60535.74,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

## Live Endpoint

Returns a batched price comparison from one currency to a list of other currencies.

Supported names for this endpoint are: `forex`, `live`, `price`.

### Input Params

| Required? |  Name  |         Aliases         | Description | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :---------------------: | :---------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  base  | `base`, `coin`, `from`  |             |      |         |         |            |                |
|    ✅     | quote  | `market`, `quote`, `to` |             |      |         |         |            |                |
|           | amount |                         |             |      |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
