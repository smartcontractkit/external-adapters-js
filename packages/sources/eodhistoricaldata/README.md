# Chainlink EOD Historical Data External Adapter

### Environment Variables

| Required? |  Name   | Description | Options | Defaults to |
| :-------: | :-----: | :---------: | :-----: | :---------: |
|    ✅     | API_KEY |             |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |         Options          | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------: | :---------: |
|           | endpoint | The endpoint to use | [stock](#Stock-Endpoint) |   `stock`   |

---

## Stock Endpoint
##### NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `stock` endpoint instead.
### Input Params

| Required? |               Name                |             Description             |                                  Options                                  | Defaults to |
| :-------: | :-------------------------------: | :---------------------------------: | :-----------------------------------------------------------------------: | :---------: |
|    ✅     | `base`, `asset`, `from`, `symbol` | The symbol of the currency to query | [list](https://eodhistoricaldata.com/financial-apis/category/data-feeds/) |             |

### Output

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {
    "code": "CL.COMM",
    "timestamp": 1585167540,
    "gmtoffset": 0,
    "open": 24.37,
    "high": 25.24,
    "low": 22.91,
    "close": 24.3,
    "volume": 590048,
    "previousClose": 24.01,
    "change": 0.29,
    "change_p": 1.208,
    "result": 24.3
  },
  "result": 24.3,
  "statusCode": 200
}
```
