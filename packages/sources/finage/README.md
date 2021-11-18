# Chainlink External Adapter for Finage

### Input Parameters

| Required? |   Name   |     Description     |                    Options                     | Defaults to |
| :-------: | :------: | :-----------------: | :--------------------------------------------: | :---------: |
|           | endpoint | The endpoint to use | [eod](#EOD-endpoint), [stock](#Stock-endpoint) |   `stock`   |

### Configuration

The adapter takes the following environment variables:

| Required? |          Name           |                     Description                     | Options |            Defaults to            |
| :-------: | :---------------------: | :-------------------------------------------------: | :-----: | :-------------------------------: |
|    ✅     |        `API_KEY`        |                                                     |         |                                   |
|           | `STOCK_WS_API_ENDPOINT` | The Websocket endpoint to connect to for stock data |         | `wss://e4s39ar3mr.finage.ws:7002` |
|           | `FOREX_WS_API_ENDPOINT` | The Websocket endpoint to connect to for forex data |         | `wss://w29hxx2ndd.finage.ws:8001` |

---

## EOD endpoint

https://finage.co.uk/docs/api/stock-market-previous-close

### Input Params

| Required? |            Name             |             Description             |       Options       | Defaults to |
| :-------: | :-------------------------: | :---------------------------------: | :-----------------: | :---------: |
|    ✅     | `base`, `from`, or `symbol` | The symbol of the currency to query | `BTC`, `ETH`, `USD` |             |

### Sample Input

### Sample Output

---

## Stock endpoint

https://finage.co.uk/docs/api/stock-last-quote

The result will be calculated as the midpoint between the ask and the bid.

### Input Params

| Required? |            Name             |             Description             | Options | Defaults to |
| :-------: | :-------------------------: | :---------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, or `symbol` | The symbol of the currency to query |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "from": "UK100"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "currencies": [
      {
        "name": "UK100",
        "value": 6395.5,
        "change": 61,
        "difference": 0.96
      }
    ],
    "lastUpdate": "2020-11-27T17:07:02",
    "lastUpdate_Timestamp": "1606496822",
    "result": 6395.5
  },
  "result": 6395.5,
  "statusCode": 200
}
```

---

## Forex endpoint

https://finage.co.uk/docs/api/forex-last-quote

The result will be calculated as the midpoint between the ask and the bid.

### Input Params

| Required? |            Name             |               Description                | Options | Defaults to |
| :-------: | :-------------------------: | :--------------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, or `symbol` |   The symbol of the currency to query    |         |             |
|    ✅     | `quote`, `to`, or `market`  | The symbol of the currency to convert to |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "from": "GBP",
    "to": "USD"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "currencies": [
      {
        "name": "UK100",
        "value": 6395.5,
        "change": 61,
        "difference": 0.96
      }
    ],
    "lastUpdate": "2020-11-27T17:07:02",
    "lastUpdate_Timestamp": "1606496822",
    "result": 6395.5
  },
  "result": 6395.5,
  "statusCode": 200
}
```
