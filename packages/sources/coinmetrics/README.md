# Chainlink External Adapter for Coinmetrics

#### Websocket support

This adapter supports Websockets. Due to the design of the API, each unique pair will be opened as a separate connection
on the WS API. This may cause unexpected behaviour for a large number of unique pairs.

### Environment Variables

| Required? |  Name   |                            Description                             | Options | Defaults to |
| :-------: | :-----: | :----------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | API_KEY | An API key that can be obtained from the data provider's dashboard |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |                                           Options                                            | Defaults to |
| :-------: | :------: | :-----------------: | :------------------------------------------------------------------------------------------: | :---------: |
|           | endpoint | The endpoint to use | [price](#price-endpoint), [burned](#burned-endpoint), [total-burned](#total-burned-endpoint) |    price    |

---

## Price Endpoint

Endpoint to get the reference price of the asset.

### Input Params

| Required? |            Name            |               Description                |   Options    | Defaults to |
| :-------: | :------------------------: | :--------------------------------------: | :----------: | :---------: |
|    ✅     | `base`, `from`, or `coin`  |   The symbol of the currency to query    |              |             |
|    ✅     | `quote`, `to`, or `market` | The symbol of the currency to convert to | `USD`, `EUR` |             |

### Sample Input

```json
{
  "id": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {
    "base": "BTC",
    "quote": "USD"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "result": 29689.476,
  "statusCode": 200,
  "data": {
    "result": 29689.476
  }
}
```

## Burned Endpoint

Endpoint to calculate the number of burned coins/tokens for an asset either on the previous day or on the previous block.

This endpoint requires that the asset has the following metrics available: `FeeTotNtv`, `RevNtv` and `IssTotNtv`.

### Input Params

| Required? |    Name     |                           Description                            |                              Options                               | Defaults to |
| :-------: | :---------: | :--------------------------------------------------------------: | :----------------------------------------------------------------: | :---------: |
|    ✅     |   `asset`   |               The symbol of the currency to query                | See [Coin Metrics Assets](https://docs.coinmetrics.io/info/assets) |             |
|           | `frequency` | At which interval to calculate the number of coins/tokens burned |                             `1d`, `1b`                             |    `1d`     |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "endpoint": "burned",
    "asset": "eth",
    "frequency": "1d"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": "12753.030080222637382759",
  "statusCode": 200,
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
    "next_page_token": "0.MjAyMS0xMS0wNFQwMDowMDowMFo",
    "next_page_url": "https://api.coinmetrics.io/v4/timeseries/asset-metrics?assets=eth&metrics=FeeTotNtv,RevNtv,IssTotNtv&frequency=1d&page_size=1&api_key=test_api_key&next_page_token=0.MjAyMS0xMS0wNFQwMDowMDowMFo",
    "result": "12753.030080222637382759"
  }
}
```

## Total Burned Endpoint

Endpoint to calculate the total number of burned coins/tokens for an asset.

This endpoint requires that the asset has the following metrics available: `FeeTotNtv`, `RevNtv` and `IssTotNtv`.

### Input Params

| Required? |    Name     |                           Description                            |                              Options                               | Defaults to |
| :-------: | :---------: | :--------------------------------------------------------------: | :----------------------------------------------------------------: | :---------: |
|    ✅     |   `asset`   |               The symbol of the currency to query                | See [Coin Metrics Assets](https://docs.coinmetrics.io/info/assets) |             |
|           | `frequency` | At which interval to calculate the number of coins/tokens burned |                             `1d`, `1b`                             |    `1d`     |
|           | `pageSize`  |                Number of results to get per page                 |                        From `1` to `10000`                         |   `10000`   |
|           | `startTime` |              The start time for the queried period.              |   See [Supported DateTime Formats](#supported-datetime-formats)    |             |
|           |  `endTime`  |               The end time for the queried period.               |   See [Supported DateTime Formats](#supported-datetime-formats)    |             |

#### Supported DateTime formats

`yyyy-MM-dd`, `yyyyMMdd`, `yyyy-MM-ddTHH:mm:ss`, `yyyy-MM-ddTHHmmss`, `yyyy-MM-ddTHH:mm:ss.SSS`, `yyyy-MM-ddTHHmmss.SSS`, `yyyy-MM-ddTHH:mm:ss.SSSSSS`, `yyyy-MM-ddTHHmmss.SSSSSS`, `yyyy-MM-ddTHH:mm:ss.SSSSSSSSS`, `yyyy-MM-ddTHHmmss.SSSSSSSSS`

### Sample Input

```json
{
  "id": "1",
  "data": {
    "endpoint": "total-burned",
    "asset": "eth",
    "startTime": "2021-09-20",
    "endTime": "2021-09-26"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": "46662.986943652840879674",
  "statusCode": 200,
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
      },
      {
        "asset": "eth",
        "time": "2021-09-26T00:00:00.000000000Z",
        "FeeTotNtv": "7482.458487566975247409",
        "IssTotNtv": "13348.875",
        "RevNtv": "14909.534687300804994846"
      }
    ],
    "result": "46662.986943652840879674"
  }
}
```
