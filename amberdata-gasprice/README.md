# Chainlink External Adapter for Amberdata gas price

### Environment Variables

| Required? |  Name   |                              Description                               | Options | Defaults to |
| :-------: | :-----: | :--------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | API_KEY | An API key that can be made [here](https://amberdata.io/user/api-keys) |         |             |

---

## Gas Price Endpoint

### Input Params

| Required? |    Name    |               Description                |               Options                |    Defaults to     |
| :-------: | :--------: | :--------------------------------------: | :----------------------------------: | :----------------: |
|    🟡     |  `speed`   |            The desired speed             | `safeLow`,`average`,`fast`,`fastest` |     `average`      |
|    🟡     | `endpoint` | The blockchain id to get gas prices from |                                      | `ethereum-mainnet` |

## Output

```json
{
  "jobRunID": "1",
  "data": {
    "status": 200,
    "title": "OK",
    "description": "Successful request",
    "payload": {
      "average": {
        "gasPrice": 8600000000,
        "numBlocks": 15,
        "wait": 3.5
      },
      "fast": {
        "gasPrice": 14000000000,
        "numBlocks": 3,
        "wait": 0.5
      },
      "fastest": {
        "gasPrice": 15000000000,
        "numBlocks": 3,
        "wait": 0.5
      },
      "safeLow": {
        "gasPrice": 7800000000,
        "numBlocks": 59,
        "wait": 14.1
      }
    },
    "result": 14000000000
  },
  "result": 14000000000,
  "statusCode": 200
}
```
