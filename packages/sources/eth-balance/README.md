# Chainlink External Adapter for Eth-balance

![2.0.20](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/eth-balance/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

External adapter for fetching balances for ETH addresses

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Known Issues

### MAX_PAYLOAD_SIZE_LIMIT configuration

The `MAX_PAYLOAD_SIZE_LIMIT` environment variable is used for controlling the maximum size of the incoming request body that the EA can handle. If you decide to customize this value it's essential to ensure that any reverse proxy or web server in front of the EA, such as Nginx, is also configured with a corresponding limit. This alignment prevents scenarios where Nginx rejects a request for exceeding its payload size limit before it reaches the EA.

## Environment Variables

| Required? |       Name        |         Description         |  Type  | Options | Default |
| :-------: | :---------------: | :-------------------------: | :----: | :-----: | :-----: |
|    ✅     | ETHEREUM_RPC_URL  | RPC URL of an Ethereum node | string |         |         |
|           | ETHEREUM_CHAIN_ID | The chain id to connect to  | string |         |   `1`   |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [balance](#balance-endpoint) | `balance` |

## Balance Endpoint

The balance endpoint will fetch the balance of each address in the query.

`balance` is the only supported name for this endpoint.

### Input Params

| Required? |       Name       |     Aliases     |                                                                                              Description                                                                                               |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--------------: | :-------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |    addresses     |    `result`     |                                                   An array of addresses to get the balances of (as an object with string `address` as an attribute)                                                    | array  |         |         |            |                |
|           | minConfirmations | `confirmations` | Number (integer, min 0, max 64) of blocks that must have been confirmed after the point against which the balance is checked (i.e. balance will be sourced from {latestBlockNumber - minConfirmations} | number |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "addresses": [
      {
        "address": "0xEF9FFcFbeCB6213E5903529c8457b6F61141140d"
      }
    ],
    "minConfirmations": 0,
    "endpoint": "balance"
  },
  "debug": {
    "cacheKey": "BZf6sDQqNncsolxn6HYNEOjtIBI="
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
    "addresses": [
      {
        "address": "0xEF9FFcFbeCB6213E5903529c8457b6F61141140d"
      },
      {
        "address": "0x6a1544F72A2A275715e8d5924e6D8A017F0e41ed"
      }
    ],
    "minConfirmations": 0,
    "endpoint": "balance"
  },
  "debug": {
    "cacheKey": "4/IH2wCsKWE3t/W0N/+01/qy/uw="
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

Request:

```json
{
  "id": "1",
  "data": {
    "addresses": [
      {
        "address": "0x6a1544F72A2A275715e8d5924e6D8A017F0e41ed"
      }
    ],
    "minConfirmations": 20,
    "endpoint": "balance"
  },
  "debug": {
    "cacheKey": "j4E0Rj65/LUMA0SuUweFMQj+iMI="
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
        "address": "0x6a1544F72A2A275715e8d5924e6D8A017F0e41ed",
        "balance": "15671674977708000"
      }
    ]
  },
  "result": [
    {
      "address": "0x6a1544F72A2A275715e8d5924e6D8A017F0e41ed",
      "balance": "15671674977708000"
    }
  ],
  "statusCode": 200,
  "providerStatusCode": 200
}
```

</details>

---

MIT License
