# Chainlink External Adapter for Finage

### Input Parameters

| Required? |   Name   |     Description     |                    Options                     | Defaults to |
| :-------: | :------: | :-----------------: | :--------------------------------------------: | :---------: |
|           | endpoint | The endpoint to use | [eod](#EOD-endpoint), [stock](#Stock-endpoint) |   `stock`   |

### Configuration

The adapter takes the following environment variables:

| Required? |   Name    | Description | Options | Defaults to |
| :-------: | :-------: | :---------: | :-----: | :---------: |
|    ✅     | `API_KEY` |             |         |             |

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
