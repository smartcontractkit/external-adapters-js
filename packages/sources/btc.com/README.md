# Chainlink External Adapters for BTC.com

![1.3.45](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/btc.com/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Base URL https://chain.api.btc.com

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Known Issues

### MAX_PAYLOAD_SIZE_LIMIT configuration

The `MAX_PAYLOAD_SIZE_LIMIT` environment variable is used for controlling the maximum size of the incoming request body that the EA can handle. If you decide to customize this value it's essential to ensure that any reverse proxy or web server in front of the EA, such as Nginx, is also configured with a corresponding limit. This alignment prevents scenarios where Nginx rejects a request for exceeding its payload size limit before it reaches the EA.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |           Default           |
| :-------: | :----------: | :---------: | :----: | :-----: | :-------------------------: |
|           | API_ENDPOINT |             | string |         | `https://chain.api.btc.com` |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour | Note |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :--: |
| default |                             |              1              |                           |      |

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

There are no examples for this endpoint.

---

## Block Endpoint

[Block](https://btc.com/api-doc#Block)

Supported names for this endpoint are: `difficulty`, `height`.

### Input Params

There are no input parameters for this endpoint.

### Example

There are no examples for this endpoint.

---

MIT License
