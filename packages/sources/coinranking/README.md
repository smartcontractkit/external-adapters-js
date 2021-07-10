# Chainlink External Adapter for Coinranking

### Configuration

The adapter takes the following environment variables:

| Required? |   Name    | Description | Options | Defaults to |
| :-------: | :-------: | :---------: | :-----: | :---------: |
|           | `API_KEY` |             |         |             |

### Input Parameters

| Required? |   Name   |     Description     |                          Options                           | Defaults to |
| :-------: | :------: | :-----------------: | :--------------------------------------------------------: | :---------: |
|           | endpoint | The endpoint to use | [price](#Price-Endpoint), [marketcap](#Marketcap-Endpoint) |   `price`   |

---

## Price Endpoint

https://api.coinranking.com/v2/coin/`{COIN_UUID}`

### Input Params

| Required? |          Name          |                   Description                    | Options | Defaults to |
| :-------: | :--------------------: | :----------------------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, `coin` |       The symbol of the currency to query        |         |             |
|    🟡     |        `coinid`        | The coin ID (optional to use in place of `base`) |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "base": "ETH"
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

https://api.coinranking.com/v2/coin/`{COIN_UUID}`

### Input Params

| Required? |          Name          |                   Description                    | Options | Defaults to |
| :-------: | :--------------------: | :----------------------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, `coin` |       The symbol of the currency to query        |         |             |
|    🟡     |        `coinid`        | The coin ID (optional to use in place of `base`) |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "endpoint": "marketcap",
    "base": "ETH"
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
