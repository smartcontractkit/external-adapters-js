# Chainlink External Adapters for BTC.com

![1.2.30](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/btc.com/package.json)

Base URL https://chain.api.btc.com

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |           Default           |
| :-------: | :----------: | :---------: | :----: | :-----: | :-------------------------: |
|           | API_ENDPOINT |             | string |         | `https://chain.api.btc.com` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                        Options                                         |  Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------------------------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [balance](#balance-endpoint), [difficulty](#block-endpoint), [height](#block-endpoint) | `balance` |

## Balance Endpoint

[Address](https://btc.com/api-doc#Address)

`balance` is the only supported name for this endpoint.

### Input Params

| Required? |     Name      | Aliases |                        Description                         |  Type  | Options | Default  | Depends On | Not Valid With |
| :-------: | :-----------: | :-----: | :--------------------------------------------------------: | :----: | :-----: | :------: | :--------: | :------------: |
|    ✅     |   addresses   |         | Array of objects with address information as defined below | array  |         |          |            |                |
|           | confirmations |         |                  Confirmations parameter                   | number |         |   `6`    |            |                |
|           |   dataPath    |         |           Path where to find the addresses array           | string |         | `result` |            |                |

Address objects within `addresses` have the following properties:

| Required? |  Name   |                 Description                  |  Type  |                    Options                    |  Default  |
| :-------: | :-----: | :------------------------------------------: | :----: | :-------------------------------------------: | :-------: |
|    ✅     | address |               Address to query               | string |                                               |           |
|           |  chain  | Chain to query (Ethereum testnet is Rinkeby) | string |             `mainnet`, `testnet`              | `mainnet` |
|           |  coin   |              Currency to query               | string | Ex. `bch`, `btc`, `btsv`, `eth`, `ltc`, `zec` |   `btc`   |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "balance",
    "dataPath": "addresses",
    "addresses": [
      {
        "address": "3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1",
        "coin": "btc"
      }
    ]
  },
  "debug": {
    "cacheKey": "Cb2Iad6Ved2MBSrLzAhVjL4uDSY="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "statusCode": 200,
  "data": {
    "responses": [
      {
        "data": {
          "address": "3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1",
          "received": 357176196514,
          "sent": 357176196514,
          "balance": 0,
          "tx_count": 63,
          "unconfirmed_tx_count": 0,
          "unconfirmed_received": 0,
          "unconfirmed_sent": 0,
          "unspent_tx_count": 0,
          "first_tx": "d542926e85a98302a1b3af88a88ae55364696f230ea909e45fe20ce0fefe33d1",
          "last_tx": "4df75d3ef0f0e13cfd00625ded80b278e76475d4a73884d245edcb42c2814556"
        },
        "err_code": 0,
        "err_no": 0,
        "message": "success",
        "status": "success"
      }
    ],
    "result": [
      {
        "address": "3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1",
        "coin": "btc",
        "chain": "mainnet",
        "balance": "0"
      }
    ]
  },
  "result": [
    {
      "address": "3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1",
      "coin": "btc",
      "chain": "mainnet",
      "balance": "0"
    }
  ]
}
```

---

## Block Endpoint

[Block](https://btc.com/api-doc#Block)

Supported names for this endpoint are: `difficulty`, `height`.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "difficulty",
    "resultPath": "difficulty"
  },
  "debug": {
    "cacheKey": "6W28xrdH7o4fj8edEEzQUhcwOLw="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "data": {
      "height": 709857,
      "version": 671080448,
      "mrkl_root": "a5b2db5e74c9f1866e3a62eae4bc645471b8ecc6fea8c452dace91d63e3836b9",
      "timestamp": 1636991861,
      "bits": 386689514,
      "nonce": 1647131200,
      "hash": "0000000000000000000964f8c9ae099170b0b1dfe6b3bf1a82edf15db1d2a847",
      "prev_block_hash": "00000000000000000000a750aef6a001b1b4f2202d46990700412f5fb59bf32f",
      "next_block_hash": "0000000000000000000000000000000000000000000000000000000000000000",
      "size": 1218365,
      "pool_difficulty": 29961509697911,
      "difficulty": 22674148233453,
      "difficulty_double": 22674148233453.105,
      "tx_count": 1771,
      "reward_block": 625000000,
      "reward_fees": 4006745,
      "confirmations": 1,
      "is_orphan": false,
      "curr_max_timestamp": 1636991861,
      "is_sw_block": true,
      "stripped_size": 716583,
      "sigops": 10655,
      "weight": 3368114,
      "extras": {
        "pool_name": "Binance Pool",
        "pool_link": "https://pool.binance.com/"
      }
    },
    "err_code": 0,
    "err_no": 0,
    "message": "success",
    "status": "success",
    "result": 22674148233453
  },
  "result": 22674148233453,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
