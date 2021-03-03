# Chainlink External Adapter for Trading Economics

### Environment Variables

| Required? |       Name        |                       Description                       | Options | Defaults to |
| :-------: | :---------------: | :-----------------------------------------------------: | :-----: | :---------: |
|    ✅     |  API_CLIENT_KEY   |                                                         |         |             |
|    ✅     | API_CLIENT_SECRET |                                                         |         |             |
|           |    WS_TIMEOUT     | The timeout for waiting for a response in the WS stream |         |   `5000`    |

---

### Input Parameters

| Required? |   Name   |     Description     |           Options            | Defaults to |
| :-------: | :------: | :-----------------: | :--------------------------: | :---------: |
|           | endpoint | The endpoint to use | [markets](#Markets-Endpoint) |   markets   |

---

## Markets Endpoint

Returns the price of a currency

### Input Params

| Required? |          Name           |             Description             | Options | Defaults to |
| :-------: | :---------------------: | :---------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, `asset` | The symbol of the currency to query |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": { "base": "FTSE" }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "s": "UKX:IND",
    "i": "UKX",
    "pch": -0.28,
    "nch": -17.37,
    "bid": 6106.32,
    "ask": 6106.32,
    "price": 6106.32,
    "dt": 1593080344361,
    "state": "open",
    "type": "index",
    "dhigh": 6320.12,
    "dlow": 6068.87,
    "o": 6320.12,
    "prev": 6123.69,
    "topic": "UKX",
    "result": 6106.32
  },
  "result": 6106.32,
  "statusCode": 200
}
```
