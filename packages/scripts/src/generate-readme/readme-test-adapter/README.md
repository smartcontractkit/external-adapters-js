# @chainlink/readme-test-adapter

Version: 1.2.3

### Environment Variables

| Required? |     Name     |  Type  |       Options       |            Default             |
| :-------: | :----------: | :----: | :-----------------: | :----------------------------: |
|           | API_ENDPOINT | string |                     | https://test.api.endpoint.link |
|           |   CHAIN_ID   | number |                     |               1                |
|           |     MODE     | string | live, sandbox, test |            sandbox             |
|    ✅     | PRIVATE_KEY  | string |                     |                                |
|    ✅     |   RPC_URL    | string |                     |                                |

---

### Input Parameters

| Required? |   Name   |     Description     |           Options            | Defaults to |
| :-------: | :------: | :-----------------: | :--------------------------: | :---------: |
|           | endpoint | The endpoint to use | [example](#Example-Endpoint) |   example   |

---

## Example Endpoint

An example endpoint description

### Input Params

| Required? |            Name            |               Description                |       Options       | Defaults to |
| :-------: | :------------------------: | :--------------------------------------: | :-----------------: | :---------: |
|    ✅     | `base`, `from`, or `coin`  |   The symbol of the currency to query    | `BTC`, `ETH`, `USD` |             |
|    ✅     | `quote`, `to`, or `market` | The symbol of the currency to convert to | `BTC`, `ETH`, `USD` |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "base": "ETH",
    "quote": "USD"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {
    "price": 77777.77,
    "result": 77777.77
  },
  "statusCode": 200
}
```
