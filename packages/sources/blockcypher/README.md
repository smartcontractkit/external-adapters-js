# Chainlink External Adapter for Blockcypher

![1.4.36](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/blockcypher/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Queries BTC address balance from blockcypher.com

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Known Issues

### MAX_PAYLOAD_SIZE_LIMIT configuration

The `MAX_PAYLOAD_SIZE_LIMIT` environment variable is used for controlling the maximum size of the incoming request body that the EA can handle. If you decide to customize this value it's essential to ensure that any reverse proxy or web server in front of the EA, such as Nginx, is also configured with a corresponding limit. This alignment prevents scenarios where Nginx rejects a request for exceeding its payload size limit before it reaches the EA.

## Environment Variables

| Required? |  Name   |          Description           |  Type  | Options | Default |
| :-------: | :-----: | :----------------------------: | :----: | :-----: | :-----: |
|    ✅     | API_KEY | blockcypher.com API key to use | string |         |         |

---

## Data Provider Rate Limits

|    Name     | Requests/credits per second | Requests/credits per minute | Requests/credits per hour | Note |
| :---------: | :-------------------------: | :-------------------------: | :-----------------------: | :--: |
|    free     |              3              |                             |            200            |      |
|  prototype  |              5              |                             |          208.33           |      |
|    beta     |              8              |                             |          458.33           |      |
| production  |             12              |                             |           1000            |      |
|  business   |             15              |                             |          2083.33          |      |
|   leader    |             22              |                             |           5000            |      |
| babyunicorn |             25              |                             |         10416.66          |      |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [balance](#balance-endpoint) | `balance` |

## Balance Endpoint

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
    "dataPath": "addresses",
    "addresses": [
      {
        "address": "3ANaBZ6odMrzdg9xifgRNxAUFUxnReesws",
        "coin": "btc"
      }
    ],
    "endpoint": "balance"
  },
  "debug": {
    "cacheKey": "MHxB7oFt1/IGrY026AfawQ3I9ok="
  },
  "rateLimitMaxAge": 20000
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
        "address": "3ANaBZ6odMrzdg9xifgRNxAUFUxnReesws",
        "total_received": 2111956338035,
        "total_sent": 2111956337488,
        "balance": 547,
        "unconfirmed_balance": 0,
        "final_balance": 547,
        "n_tx": 19,
        "unconfirmed_n_tx": 0,
        "final_n_tx": 19,
        "txrefs": [
          {
            "address": "3ANaBZ6odMrzdg9xifgRNxAUFUxnReesws",
            "tx_hash": "37fcec0a27e2a8fc52a34fb2768b2b5b7218452d1e7a099bb0f67c7e87056564",
            "tx_input_n": 0,
            "tx_output_n": 0,
            "value": 649142878298,
            "ref_balance": 547,
            "confirmations": 0,
            "double_spend": false
          }
        ],
        "tx_url": "https://api.blockcypher.com/v1/btc/main/txs/"
      }
    ],
    "result": [
      {
        "address": "3ANaBZ6odMrzdg9xifgRNxAUFUxnReesws",
        "coin": "btc",
        "chain": "mainnet",
        "balance": "547"
      }
    ]
  },
  "result": [
    {
      "address": "3ANaBZ6odMrzdg9xifgRNxAUFUxnReesws",
      "coin": "btc",
      "chain": "mainnet",
      "balance": "547"
    }
  ]
}
```

---

MIT License
