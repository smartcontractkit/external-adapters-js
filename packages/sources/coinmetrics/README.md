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

Endpoint to calculate the number of burned ETH since the EIP-1559 proposal.

### Input Params

| Required? |    Name     |              Description               |   Options    | Defaults to  |
| :-------: | :---------: | :------------------------------------: | :----------: | :----------: |
|           | `startDate` | The start date for the queried period. | `YYYY-MM-DD` | `2021-08-05` |
|           |  `endDate`  |  The end date for the queried period.  | `YYYY-MM-DD` | today's date |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "endpoint": "burned",
    "startDate": "2021-09-20",
    "endDate": "2021-09-26"
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
    "result": "46662.986943652840879674"
  }
}
```
