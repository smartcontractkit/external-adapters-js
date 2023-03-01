# Chainlink External Adapter for CryptoAPIs

![1.2.27](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/cryptoapis/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |    Name     |                             Description                             |  Type  | Options | Default |
| :-------: | :---------: | :-----------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     |   API_KEY   | An API key that can be obtained from [here](https://cryptoapis.io/) | string |         |         |
|           | API_TIMEOUT |                          Timeout parameter                          | number |         | `30000` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                                                      Options                                                                      | Default  |
| :-------: | :------: | :-----------------: | :----: | :-----------------------------------------------------------------------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [balance](#balance-endpoint), [crypto](#crypto-endpoint), [difficulty](#bc_info-endpoint), [height](#bc_info-endpoint), [price](#crypto-endpoint) | `crypto` |

## Balance Endpoint

https://docs.cryptoapis.io/rest-apis/blockchain-as-a-service-apis/btc/index#btc-address-info-endpoint

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

## Crypto Endpoint

**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.**

Supported names for this endpoint are: `crypto`, `price`.

### Input Params

| Required? | Name  |    Aliases     |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` |   The symbol of the currency to query    | string |         |         |            |                |
|    ✅     | quote | `market`, `to` | The symbol of the currency to convert to | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Bc_info Endpoint

https://docs.cryptoapis.io/rest-apis/blockchain-as-a-service-apis/common/index#common

Supported names for this endpoint are: `difficulty`, `height`.

### Input Params

| Required? |    Name    |     Aliases      |             Description             |  Type  |                      Options                      |  Default  | Depends On | Not Valid With |
| :-------: | :--------: | :--------------: | :---------------------------------: | :----: | :-----------------------------------------------: | :-------: | :--------: | :------------: |
|    ✅     | blockchain | `coin`, `market` | The blockchain to retrieve info for | string | `BCH`, `BTC`, `DASH`, `DOGE`, `ETC`, `ETH`, `LTC` |           |            |                |
|    ✅     |  network   |                  |     The blockchain network name     | string |                                                   | `mainnet` |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
