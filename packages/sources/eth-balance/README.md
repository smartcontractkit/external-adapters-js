# Chainlink External Adapter for Eth-balance

External adapter for fetching balances for ETH addresses

### Environment Variables

The adapter takes the following environment variables:

| Required? |  Name   |     Description     | Options | Defaults to |
| :-------: | :-----: | :-----------------: | :-----: | :---------: |
|    ✅     | RPC_URL | RPC URL of ETH node |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |           Options            | Defaults to |
| :-------: | :------: | :-----------------: | :--------------------------: | :---------: |
|           | endpoint | The endpoint to use | [balance](#Balance-Endpoint) |   balance   |

---

## Balance Endpoint

The balance endpoint will fetch the balance of each address in the query.

### Input Params

| Required? |    Name     |                                         Description                                          | Options | Defaults to |
| :-------: | :---------: | :------------------------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | `addresses` | An array of addresses to get the balances of (this may also be under the 'result' parameter) |         |             |

`addresses` or `result` is an array of objects that contain the following information:

| Required? |   Name    |   Description    | Options | Defaults to |
| :-------: | :-------: | :--------------: | :-----: | :---------: |
|    ✅     | `address` | Address to query |         |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "addresses": [
      { "address": "0xfF1BE3171A16FE431E31d874E4De14814362E588" },
      { "address": "0xbef7bcbDFbE321e1f407282a9caFcA41A4984a4d" }
    ]
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": [
    {
      "address": "0xfF1BE3171A16FE431E31d874E4De14814362E588",
      "balance": "0.0"
    },
    {
      "address": "0xbef7bcbDFbE321e1f407282a9caFcA41A4984a4d",
      "balance": "0.046572563850192871"
    }
  ],
  "statusCode": 200,
  "data": {
    "result": [
      {
        "address": "0xfF1BE3171A16FE431E31d874E4De14814362E588",
        "balance": "0.0"
      },
      {
        "address": "0xbef7bcbDFbE321e1f407282a9caFcA41A4984a4d",
        "balance": "0.046572563850192871"
      }
    ]
  }
}
```
