# Chainlink Lotus Composite Adapter

An external adapter to interact with the Lotus node API

## Configuration

The adapter takes the following environment variables:

| Required? |   Name    |                                               Description                                                | Options | Defaults to |
| :-------: | :-------: | :------------------------------------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | `RPC_URL` | URL to the Lotus node's [HTTP RPC-API endpoint](https://docs.filecoin.io/reference/lotus-api/#endpoints) |         |             |
|    ✅     | `API_KEY` |    Your Lotus node [API key/token](https://docs.filecoin.io/build/lotus/api-tokens/#obtaining-tokens)    |         |             |

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

### Input Parameters

| Required? |   Name   |     Description     |           Options            | Defaults to |
| :-------: | :------: | :-----------------: | :--------------------------: | :---------: |
|           | endpoint | The endpoint to use | [balance](#Balance-Endpoint) |   balance   |

---

## Balance Endpoint

The balance endpoint will fetch the balance of each address in the query and the total sum.

### Input Params

| Required? |    Name     |                 Description                  | Options | Defaults to |
| :-------: | :---------: | :------------------------------------------: | :-----: | :---------: |
|    ✅     | `addresses` | An array of addresses to get the balances of |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "addresses": [
      "f2eaaj6w4evrdscw4s4o5c3df7ph725tbs3yvg6gi",
      "f225ey7bq53ur6sgrkxgf74hl2ftxkajupatwnmay"
    ]
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": "33427594125000000000000",
  "statusCode": 200,
  "data": {
    "balances": [
      {
        "address": "f2eaaj6w4evrdscw4s4o5c3df7ph725tbs3yvg6gi",
        "result": "33426744125000000000000"
      },
      {
        "address": "f225ey7bq53ur6sgrkxgf74hl2ftxkajupatwnmay",
        "result": "850000000000000000"
      }
    ],
    "result": "33427594125000000000000"
  }
}
```
