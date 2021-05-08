# Chainlink Tiingo External Adapter

### Environment Variables

| Required? |  Name   |                                            Description                                             | Options | Defaults to |
| :-------: | :-----: | :------------------------------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | API_KEY | An API key that can be obtained from [here](https://api.tiingo.com/documentation/general/overview) |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |                                            Options                                            | Defaults to |
| :-------: | :------: | :-----------------: | :-------------------------------------------------------------------------------------------: | :---------: |
|           | endpoint | The endpoint to use | [`eod`](#EOD-Endpoint), [`iex` or `stock`](#IEX-Endpoint), [`top` or `crypto`](#Top-Endpoint) |  `crypto`   |

---

## EOD Endpoint

https://api.tiingo.com/documentation/end-of-day

### Input Params

| Required? |                Name                 |        Description        | Options | Defaults to |
| :-------: | :---------------------------------: | :-----------------------: | :-----: | :---------: |
|    ✅     | `ticker`, `base`, `from`, or `coin` | The stock ticker to query |         |             |
|           |               `field`               |    The value to return    |         |   `close`   |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "ticker": "aapl",
    "field": "close"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "result": 130.27
  },
  "result": 130.27,
  "statusCode": 200
}
```

---

## IEX Endpoint

https://api.tiingo.com/documentation/iex

### Input Params

| Required? |                Name                 |        Description        | Options | Defaults to |
| :-------: | :---------------------------------: | :-----------------------: | :-----: | :---------: |
|    ✅     | `ticker`, `base`, `from`, or `coin` | The stock ticker to query |         |             |
|           |               `field`               |    The value to return    |         | `tngoLast`  |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "ticker": "aapl"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": 130.125,
  "statusCode": 200,
  "data": {
    "result": 130.125
  }
}
```

---

## Top Endpoint

The top of order book endpoint from:

https://api.tiingo.com/documentation/crypto

### Input Params

| Required? |            Name            |                Description                 | Options | Defaults to |
| :-------: | :------------------------: | :----------------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, or `coin`  |     The cryptocurrency symbol to query     |         |             |
|    ✅     | `quote`, `to`, or `market` | The output currency to return the price in |         |             |
|           |          `field`           |            The value to return             |         | `lastPrice` |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "base": "btc",
    "quote": "usd"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "result": 130.27
  },
  "result": 130.27,
  "statusCode": 200
}
```
