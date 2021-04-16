# Chainlink External Adapter for Twelvedata

### Environment Variables

| Required? |     Name     |           Description            | Options |          Defaults to          |
| :-------: | :----------: | :------------------------------: | :-----: | :---------------------------: |
|    ✅     |   API_KEY    |      API key for Twelvedata      |         |                               |
|           | API_ENDPOINT | The endpoint for your Twelvedata |         | `https://api.twelvedata.com/` |

---

### Input Parameters

| Required? |   Name   |     Description     |                        Options                        | Defaults to |
| :-------: | :------: | :-----------------: | :---------------------------------------------------: | :---------: |
|           | endpoint | The endpoint to use | [closing](#Closing-Endpoint), [price](#Price-Endpoint) |    `closing`    |

---

## Closing Endpoint

This `closing` endpoint provides the closing price of the previous day as detailed in [Twelvedata documentation](https://twelvedata.com/docs#end-of-day-price).

### Input Params

| Required? |               Name               |             Description             | Options | Defaults to |
| :-------: | :------------------------------: | :---------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, `coin`, `market` | The symbol of the currency to query |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "base": "VXX"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": 9.975,
  "statusCode": 200,
  "data": {
    "symbol": "VXX",
    "exchange": "CBOE",
    "currency": "USD",
    "datetime": "2021-04-14",
    "close": "9.97500",
    "result": 9.975
  }
}
```

## Price Endpoint

This `price` endpoint provides the real-time price as detailed in [Twelvedata documentation](https://twelvedata.com/docs#real-time-price).

### Input Params

| Required? |               Name               |             Description             | Options | Defaults to |
| :-------: | :------------------------------: | :---------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, `coin`, `market` | The symbol of the currency to query |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "base": "VXX",
    "endpoint": "price"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": 10.0756,
  "statusCode": 200,
  "data": {
    "price": "10.07560",
    "result": 10.0756
  }
}
```
