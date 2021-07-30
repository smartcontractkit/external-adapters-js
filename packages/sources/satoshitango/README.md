# Chainlink External Adapter for SatoshiTango

### Input Parameters

| Required? |   Name   |     Description     |          Options           | Defaults to |
| :-------: | :------: | :-----------------: | :------------------------: | :---------: |
|           | endpoint | The endpoint to use | [crypto](#Crypto-Endpoint) |   crypto    |

---

## Crypto Endpoint
##### NOTE: the `ticker` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.
### Input Params

| Required? |          Name           |                               Description                                | Options | Defaults to |
| :-------: | :---------------------: | :----------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, `coin`  |                   The symbol of the currency to query                    |         |             |
|    ✅     | `quote`, `to`, `market` |                 The symbol of the currency to convert to                 |
|           |         `field`         | The object path to access the value that will be returned as the result. |         |    `bid`    |

### Sample Input

```json
{
  "id": "1",
  "data": { "base": "BTC", "quote": "ARS" }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "data": {
      "ticker": {
        "BTC": {
          "date": "2020-10-06 10:46:03",
          "timestamp": 1601981163,
          "bid": 1480212.48,
          "ask": 1560168.95,
          "high": 0,
          "low": 0,
          "volume": 0
        },
        "ETH": {
          "date": "2020-10-06 10:46:03",
          "timestamp": 1601981163,
          "bid": 48425.72,
          "ask": 51062.97,
          "high": 0,
          "low": 0,
          "volume": 0
        },
        "LTC": {
          "date": "2020-10-06 10:46:03",
          "timestamp": 1601981163,
          "bid": 6397.68,
          "ask": 6747.77,
          "high": 0,
          "low": 0,
          "volume": 0
        },
        "XRP": {
          "date": "2020-10-06 10:46:03",
          "timestamp": 1601981163,
          "bid": 35.13,
          "ask": 37.07,
          "high": 0,
          "low": 0,
          "volume": 0
        },
        "BCH": {
          "date": "2020-10-06 10:46:03",
          "timestamp": 1601981163,
          "bid": 30381.7,
          "ask": 32059.34,
          "high": 0,
          "low": 0,
          "volume": 0
        },
        "DAI": {
          "date": "2020-10-06 10:46:03",
          "timestamp": 1601981163,
          "bid": 139,
          "ask": 147.68,
          "high": 0,
          "low": 0,
          "volume": 0
        },
        "USDC": {
          "date": "2020-10-06 10:46:03",
          "timestamp": 1601981163,
          "bid": 138.32,
          "ask": 145.55,
          "high": 0,
          "low": 0,
          "volume": 0
        }
      },
      "code": "success"
    },
    "result": 1480212.48
  },
  "result": 1480212.48,
  "statusCode": 200
}
```
