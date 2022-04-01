# Chainlink External Adapter for Eth-balance

Version: 1.1.23

External adapter for fetching balances for ETH addresses

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |       Name       |             Description             |  Type  | Options | Default |
| :-------: | :--------------: | :---------------------------------: | :----: | :-----: | :-----: |
|    ✅     | ETHEREUM_RPC_URL | RPC URL of an Ethereum Mainnet node | string |         |         |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [balance](#balance-endpoint) | `balance` |

---

## Balance Endpoint

The balance endpoint will fetch the balance of each address in the query.

`balance` is the only supported name for this endpoint.

### Input Params

| Required? |   Name    | Aliases  |                                            Description                                            | Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-------: | :------: | :-----------------------------------------------------------------------------------------------: | :---: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | addresses | `result` | An array of addresses to get the balances of (as an object with string `address` as an attribute) | array |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "balance",
    "addresses": [
      {
        "address": "0xEF9FFcFbeCB6213E5903529c8457b6F61141140d"
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
    "result": [
      {
        "address": "0xEF9FFcFbeCB6213E5903529c8457b6F61141140d",
        "balance": "842796652117371"
      }
    ]
  },
  "result": [
    {
      "address": "0xEF9FFcFbeCB6213E5903529c8457b6F61141140d",
      "balance": "842796652117371"
    }
  ],
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
        "address": "0xEF9FFcFbeCB6213E5903529c8457b6F61141140d"
      },
      {
        "address": "0x6a1544F72A2A275715e8d5924e6D8A017F0e41ed"
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
    "result": [
      {
        "address": "0xEF9FFcFbeCB6213E5903529c8457b6F61141140d",
        "balance": "842796652117371"
      },
      {
        "address": "0x6a1544F72A2A275715e8d5924e6D8A017F0e41ed",
        "balance": "1604497408893139674"
      }
    ]
  },
  "result": [
    {
      "address": "0xEF9FFcFbeCB6213E5903529c8457b6F61141140d",
      "balance": "842796652117371"
    },
    {
      "address": "0x6a1544F72A2A275715e8d5924e6D8A017F0e41ed",
      "balance": "1604497408893139674"
    }
  ],
  "statusCode": 200,
  "providerStatusCode": 200
}
```

</details>

---
