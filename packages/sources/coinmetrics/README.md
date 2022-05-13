# Chainlink External Adapter for Coinmetrics

![1.2.35](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/coinmetrics/package.json)

### Websocket support

This adapter supports Websockets. Due to the design of the API, each unique pair will be opened as a separate connection on the WS API. This may cause unexpected behaviour for a large number of unique pairs.

Supported DateTime formats: `yyyy-MM-dd`, `yyyyMMdd`, `yyyy-MM-ddTHH:mm:ss`, `yyyy-MM-ddTHHmmss`, `yyyy-MM-ddTHH:mm:ss.SSS`, `yyyy-MM-ddTHHmmss.SSS`, `yyyy-MM-ddTHH:mm:ss.SSSSSS`, `yyyy-MM-ddTHHmmss.SSSSSS`, `yyyy-MM-ddTHH:mm:ss.SSSSSSSSS`, `yyyy-MM-ddTHHmmss.SSSSSSSSS`

Base URL https://api.coinmetrics.io/v4

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |  Name   |                            Description                             |  Type  | Options | Default |
| :-------: | :-----: | :----------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     | API_KEY | An API key that can be obtained from the data provider's dashboard | string |         |         |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                           Options                                           | Default |
| :-------: | :------: | :-----------------: | :----: | :-----------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [burned](#burned-endpoint), [price](#price-endpoint), [total-burned](#totalburned-endpoint) | `price` |

## Price Endpoint

Endpoint to get the reference price of the asset.

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
    "base": "ETH",
    "quote": "USD"
  },
  "debug": {
    "cacheKey": "XTlxaPrvbw+XqgAa5P+iBEPG3CY="
  },
  "rateLimitMaxAge": 2666
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "data": [
      {
        "asset": "eth",
        "time": "2022-03-02T16:52:24.000000000Z",
        "ReferenceRateUSD": "2969.5"
      }
    ],
    "next_page_token": "0.MjAyMi0wMy0wMlQxNjo1MjoyNFo",
    "result": 2969.5
  },
  "result": 2969.5,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

## Burned Endpoint

Endpoint to calculate the number of burned coins/tokens for an asset either on the previous day or on the previous block.
This endpoint requires that the asset has the following metrics available: `FeeTotNtv`, `RevNtv` and `IssTotNtv`.

`burned` is the only supported name for this endpoint.

### Input Params

| Required? |   Name    | Aliases |                                               Description                                               |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-------: | :-----: | :-----------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |   asset   |         | The symbol of the currency to query. See [Coin Metrics Assets](https://docs.coinmetrics.io/info/assets) | string |         |         |            |                |
|           | frequency |         |                    At which interval to calculate the number of coins/tokens burned                     | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "burned",
    "asset": "eth"
  },
  "debug": {
    "cacheKey": "0l65yC+9msDIdJG9kTwGuYMO7GY="
  },
  "rateLimitMaxAge": 2000
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "data": [
      {
        "asset": "eth",
        "time": "2021-11-04T00:00:00.000000000Z",
        "FeeTotNtv": "14465.059425601977193289",
        "IssTotNtv": "13175.1875",
        "RevNtv": "14887.21684537933981053"
      }
    ],
    "next_page_token": "0.MjAyMS0wOC0wNlQwMDowMDowMFo",
    "result": "12753.030080222637382759"
  },
  "result": "12753.030080222637382759",
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

## TotalBurned Endpoint

Endpoint to calculate the total number of burned coins/tokens for an asset.
This endpoint requires that the asset has the following metrics available: `FeeTotNtv`, `RevNtv` and `IssTotNtv`.

`total-burned` is the only supported name for this endpoint.

### Input Params

| Required? |   Name    | Aliases |                                               Description                                               |  Type  |  Options   | Default | Depends On | Not Valid With |
| :-------: | :-------: | :-----: | :-----------------------------------------------------------------------------------------------------: | :----: | :--------: | :-----: | :--------: | :------------: |
|    ✅     |   asset   |         | The symbol of the currency to query. See [Coin Metrics Assets](https://docs.coinmetrics.io/info/assets) | string |            |         |            |                |
|           | frequency |         |                    At which interval to calculate the number of coins/tokens burned                     | string | `1b`, `1d` |  `1d`   |            |                |
|           | pageSize  |         |                           Number of results to get per page. From 1 to 10000                            | number |            | `10000` |            |                |
|           | startTime |         |  The start time for the queried period. See [Supported DateTime Formats](#supported-datetime-formats)   | string |            |         |            |                |
|           |  endTime  |         |   The end time for the queried period. See [Supported DateTime Formats](#supported-datetime-formats)    | string |            |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "total-burned",
    "asset": "eth",
    "frequency": "1d",
    "pageSize": 10000,
    "startTime": "2021-09-20",
    "endTime": "2021-09-25"
  },
  "debug": {
    "cacheKey": "kX/YnNossBD0tbjiRHbpGhW6s+4="
  },
  "rateLimitMaxAge": 666
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "data": [
      {
        "asset": "eth",
        "time": "2021-09-20T00:00:00.000000000Z",
        "FeeTotNtv": "9331.617399578292365165",
        "IssTotNtv": "13465.375",
        "RevNtv": "14903.076551063217245019"
      },
      {
        "asset": "eth",
        "time": "2021-09-21T00:00:00.000000000Z",
        "FeeTotNtv": "10725.893521006011986668",
        "IssTotNtv": "13569.625",
        "RevNtv": "15125.559184739053811959"
      },
      {
        "asset": "eth",
        "time": "2021-09-22T00:00:00.000000000Z",
        "FeeTotNtv": "7241.077830167154483706",
        "IssTotNtv": "13445.875",
        "RevNtv": "14506.07882008361914748"
      },
      {
        "asset": "eth",
        "time": "2021-09-23T00:00:00.000000000Z",
        "FeeTotNtv": "9503.848309834219302852",
        "IssTotNtv": "13372.8125",
        "RevNtv": "16274.553315636682282599"
      },
      {
        "asset": "eth",
        "time": "2021-09-24T00:00:00.000000000Z",
        "FeeTotNtv": "7640.784022848909291801",
        "IssTotNtv": "13449.25",
        "RevNtv": "14517.956543257905308913"
      },
      {
        "asset": "eth",
        "time": "2021-09-25T00:00:00.000000000Z",
        "FeeTotNtv": "5019.537962541415576967",
        "IssTotNtv": "13721.25",
        "RevNtv": "14418.533987808854584078"
      }
    ],
    "result": "40741.188143386670627111"
  },
  "result": "40741.188143386670627111",
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
    "endpoint": "total-burned",
    "asset": "eth",
    "frequency": "1d",
    "pageSize": 2,
    "startTime": "2021-08-05",
    "endTime": "2021-08-07"
  },
  "debug": {
    "cacheKey": "3AkR3dG+M+8hhKKhp8VdyT8DVGQ="
  },
  "rateLimitMaxAge": 1333
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "data": [
      {
        "asset": "eth",
        "time": "2021-08-05T00:00:00.000000000Z",
        "FeeTotNtv": "3",
        "IssTotNtv": "5",
        "RevNtv": "4"
      }
    ],
    "result": "9.0"
  },
  "result": "9.0",
  "statusCode": 200,
  "providerStatusCode": 200
}
```

</details>

---

MIT License
