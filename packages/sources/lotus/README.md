# Chainlink Lotus Composite Adapter

Version: 2.1.17

An external adapter to interact with the Lotus node API

This README was generated automatically. Please see [scripts](../../scripts) for more info.

## Environment Variables

| Required? |  Name   |                                            Description                                             |  Type  | Options | Default |
| :-------: | :-----: | :------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     | API_KEY | Your Lotus node [API key/token](https://docs.filecoin.io/build/lotus/api-tokens/#obtaining-tokens) | string |         |         |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                  Options                                  |  Default  |
| :-------: | :------: | :-----------------: | :----: | :-----------------------------------------------------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [Filecoin.WalletBalance](#balance-endpoint), [balance](#balance-endpoint) | `balance` |

---

## Balance Endpoint

The balance endpoint will fetch the balance of each address in the query and the total sum.

Supported names for this endpoint are: `Filecoin.WalletBalance`, `balance`.

### Input Params

| Required? |   Name    | Aliases  |                 Description                  | Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-------: | :------: | :------------------------------------------: | :---: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | addresses | `result` | An array of addresses to get the balances of | array |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "balance",
    "addresses": [
      {
        "address": "f2eaaj6w4evrdscw4s4o5c3df7ph725tbs3yvg6gi"
      }
    ]
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "balances": [
      {
        "address": "f2eaaj6w4evrdscw4s4o5c3df7ph725tbs3yvg6gi",
        "result": "33426744125000000000000"
      }
    ],
    "result": "33426744125000000000000"
  },
  "result": "33426744125000000000000",
  "statusCode": 200,
  "providerStatusCode": 200
}
```

<details>
<summary>Additional Examples</summary>

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "balance",
    "addresses": [
      {
        "address": "f2eaaj6w4evrdscw4s4o5c3df7ph725tbs3yvg6gi"
      },
      {
        "address": "f225ey7bq53ur6sgrkxgf74hl2ftxkajupatwnmay"
      }
    ]
  }
}
```

Response:

```json
{
  "jobRunID": "1",
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
  },
  "result": "33427594125000000000000",
  "statusCode": 200,
  "providerStatusCode": 200
}
```

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "balance",
    "addresses": [
      {
        "address": "f2eaaj6w4evrdscw4s4o5c3df7ph725tbs3yvg6gi"
      },
      {
        "address": "f225ey7bq53ur6sgrkxgf74hl2ftxkajupatwnmay"
      }
    ]
  }
}
```

Response:

```json
{
  "jobRunID": "1",
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
  },
  "result": "33427594125000000000000",
  "statusCode": 200,
  "providerStatusCode": 200
}
```

</details>

---
