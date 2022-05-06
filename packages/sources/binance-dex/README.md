# Chainlink External Adapter for Binance DEX

![1.3.2](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/binance-dex/package.json)

The following `base` and `quote` pair must be taken from [this list](https://dex.binance.org/api/v1/markets)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |                     Description                      |  Type  |                                               Options                                                |      Default      |
| :-------: | :----------: | :--------------------------------------------------: | :----: | :--------------------------------------------------------------------------------------------------: | :---------------: |
|           | API_ENDPOINT | Environment variable to set the API endpoint to use. | string | `dex-asiapacific`, `dex-atlantic`, `dex-european`, `testnet-dex-asiapacific`, `testnet-dex-atlantic` | `dex-asiapacific` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |         Options          | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [price](#price-endpoint) | `price` |

## Price Endpoint

`price` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |    Aliases     |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` |   The symbol of the currency to query    | string |         |         |            |                |
|    ✅     | quote | `market`, `to` | The symbol of the currency to convert to | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "price",
    "base": "BUSD-BD1",
    "quote": "USDT-6D8"
  },
  "debug": {
    "cacheKey": "bwMQT+kLIUlCU6nr03vb2DSjlYc="
  },
  "rateLimitMaxAge": 222
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "payload": [
      {
        "symbol": "BUSD-BD1_USDT-6D8",
        "baseAssetName": "BUSD-BD1",
        "quoteAssetName": "USDT-6D8",
        "priceChange": "0.00050000",
        "priceChangePercent": "0.0500",
        "prevClosePrice": "0.99900000",
        "lastPrice": "1.00000000",
        "lastQuantity": "22.00000000",
        "openPrice": "0.99950000",
        "highPrice": "1.00980000",
        "lowPrice": "0.99700000",
        "openTime": 1636993579000,
        "closeTime": 1.637079979e35,
        "firstId": "202650439-0",
        "lastId": "202857405-0",
        "bidPrice": "0.99900000",
        "bidQuantity": "6766.00000000",
        "askPrice": "1.00000000",
        "askQuantity": "1515.00000000",
        "weightedAvgPrice": "1.00001116",
        "volume": "253006.00000000",
        "quoteVolume": "253008.82463200",
        "count": 337
      }
    ],
    "result": 1
  },
  "result": 1,
  "statusCode": 200,
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
    "endpoint": "price",
    "overrides": {
      "binance_dex": {
        "overridablevalue": "BUSD-BD1"
      }
    },
    "base": "overridablevalue",
    "quote": "USDT-6D8"
  },
  "debug": {
    "cacheKey": "nZP5JRLYRga+qXNMpjo4uhDgYtY="
  },
  "rateLimitMaxAge": 444
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "payload": [
      {
        "symbol": "BUSD-BD1_USDT-6D8",
        "baseAssetName": "BUSD-BD1",
        "quoteAssetName": "USDT-6D8",
        "priceChange": "0.00050000",
        "priceChangePercent": "0.0500",
        "prevClosePrice": "0.99900000",
        "lastPrice": "1.00000000",
        "lastQuantity": "22.00000000",
        "openPrice": "0.99950000",
        "highPrice": "1.00980000",
        "lowPrice": "0.99700000",
        "openTime": 1636993579000,
        "closeTime": 1.637079979e35,
        "firstId": "202650439-0",
        "lastId": "202857405-0",
        "bidPrice": "0.99900000",
        "bidQuantity": "6766.00000000",
        "askPrice": "1.00000000",
        "askQuantity": "1515.00000000",
        "weightedAvgPrice": "1.00001116",
        "volume": "253006.00000000",
        "quoteVolume": "253008.82463200",
        "count": 337
      }
    ],
    "result": 1
  },
  "result": 1,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

</details>

---

MIT License
