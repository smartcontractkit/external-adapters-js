# Chainlink External Adapter for Bitex

### Environment Variables

The adapter takes the following environment variables:

| Required? |   Name    |     Description      | Options | Defaults to |
| :-------: | :-------: | :------------------: | :-----: | :---------: |
|           | `API_KEY` | Bitex API key to use |         |             |

### Input Parameters

| Required? |   Name   |     Description     |           Options            | Defaults to |
| :-------: | :------: | :-----------------: | :--------------------------: | :---------: |
|           | endpoint | The endpoint to use | [crypto](#Crypto-Endpoint) |   crypto   |

---

## Crypto Endpoint
##### NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.
### Input Params

| Required? |            Name            |                               Description                               | Options | Defaults to |
| :-------: | :------------------------: | :---------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, or `coin`  |                   The symbol of the currency to query                   |         |             |
|    ✅     | `quote`, `to`, or `market` |                The symbol of the currency to convert to                 |         |             |
|           |          `field`           | The object path to access the value that will be returned as the result |         |   `vwap`    |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "base": "ETH",
    "quote": "ARS"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "data": {
      "id": "btc_ars",
      "type": "tickers",
      "attributes": {
        "last": 1625000,
        "open": 1592499,
        "high": 1637900,
        "low": 1572000,
        "vwap": 1613873.6183712287,
        "volume": 2.51892688,
        "bid": 1585000,
        "ask": 1631800,
        "price_before_last": 1605000
      }
    },
    "result": 1625000
  },
  "result": 1625000,
  "statusCode": 200
}
```
