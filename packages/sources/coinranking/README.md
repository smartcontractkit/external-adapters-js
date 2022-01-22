# Chainlink External Adapter for Coinranking

### Configuration

The adapter takes the following environment variables:

| Required? |   Name    | Description | Options | Defaults to |
| :-------: | :-------: | :---------: | :-----: | :---------: |
|           | `API_KEY` |             |         |             |

### Input Parameters

| Required? |   Name   |     Description     |                           Options                            | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------------------------------------------: | :---------: |
|           | endpoint | The endpoint to use | [crypto](#Crypto-Endpoint), [marketcap](#Marketcap-Endpoint) |  `crypto`   |

---

## Price Endpoint

https://api.coinranking.com/v2/coins

### Input Params

| Required? |          Name           |                                  Description                                  | Options | Defaults to |
| :-------: | :---------------------: | :---------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, `coin`  |                      The symbol of the currency to query                      |         |             |
|    ✅     | `quote`, `to`, `market` |                   The symbol of the currency to convert to                    |         |             |
|    🟡     |        `coinid`         | The coin ID to select the specific coin (in case of duplicate `from` symbols) |         |             |
|    🟡     | `referenceCurrencyUuid` |                      Optional UUID of the `to` currency                       |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "from": "ETH",
    "to": "USD"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "result": 2110.2357344391503
  },
  "result": 2110.2357344391503,
  "statusCode": 200
}
```

---

## Marketcap Endpoint

### Input Params

| Required? |          Name           |                                  Description                                  | Options | Defaults to |
| :-------: | :---------------------: | :---------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, `coin`  |                      The symbol of the currency to query                      |         |             |
|    ✅     | `quote`, `to`, `market` |                   The symbol of the currency to convert to                    |         |             |
|    🟡     |        `coinid`         | The coin ID to select the specific coin (in case of duplicate `from` symbols) |         |             |
|    🟡     | `referenceCurrencyUuid` |                      Optional UUID of the `to` currency                       |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "endpoint": "marketcap",
    "base": "ETH",
    "quote": "USD"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "result": 245013696787.35812
  },
  "result": 245013696787.35812,
  "statusCode": 200
}
```
