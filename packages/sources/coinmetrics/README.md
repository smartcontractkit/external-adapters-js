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

| Required? |   Name   |     Description     |                       Options                        | Defaults to |
| :-------: | :------: | :-----------------: | :--------------------------------------------------: | :---------: |
|           | endpoint | The endpoint to use | [price](#Price-Endpoint), [burned](#Burned-Endpoint) |    price    |

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

Endpoint to calculate the number of burned coins/tokens for an asset.

### Input Params

| Required? |    Name     |                           Description                            | Options | Defaults to |
| :-------: | :---------: | :--------------------------------------------------------------: | :-----: | :---------: |
|    ✅     |   `asset`   |               The symbol of the currency to query                |         |             |
|           | `frequency` | At which interval to calculate the number of coins/tokens burned |  `1d`   |             |
|           | `pageSize`  |                Number of results to get per page                 |   `1`   |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "endpoint": "burned",
    "asset": "ETH"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": "6917.088698410536166313",
  "statusCode": 200,
  "data": {
    "data": [
      {
        "asset": "eth",
        "time": "2021-09-13T00:00:00.000000000Z",
        "FeeTotNtv": "8811.061704931293693587",
        "IssTotNtv": "13388.1875",
        "RevNtv": "15282.160506520757527274"
      }
    ],
    "next_page_token": "0.MjAyMS0wOS0xM1QwMDowMDowMFo",
    "next_page_url": "https://api.coinmetrics.io/v4/timeseries/asset-metrics?assets=eth&metrics=FeeTotNtv,RevNtv,IssTotNtv&frequency=1d&page_size=1&next_page_token=0.MjAyMS0wOS0xM1QwMDowMDowMFo",
    "result": "6917.088698410536166313"
  }
}
```
