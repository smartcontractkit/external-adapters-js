# Chainlink Tiingo External Adapter

### Environment Variables

| Required? |  Name   |                                            Description                                             | Options | Defaults to |
| :-------: | :-----: | :------------------------------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | API_KEY | An API key that can be obtained from [here](https://api.tiingo.com/documentation/general/overview) |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |       Options        | Defaults to |
| :-------: | :------: | :-----------------: | :------------------: | :---------: |
|           | endpoint | The endpoint to use | [eod](#EOD-Endpoint) |    `eod`    |

---

## EOD Endpoint

https://api.tiingo.com/documentation/end-of-day

### Input Params

| Required? |                     Name                      |        Description        | Options | Defaults to |
| :-------: | :-------------------------------------------: | :-----------------------: | :-----: | :---------: |
|    ✅     | `ticker`, `base`, `from`, or `coin` | The stock ticker to query |         |             |
|           |                    `field`                    |    The value to return    |         |   `close`   |

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
