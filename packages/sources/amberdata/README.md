# Chainlink External Adapter for Amberdata

![1.8.20](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/amberdata/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Base URL wss://ws.web3api.io

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |  Description   |  Type  | Options |        Default        |
| :-------: | :-------------: | :------------: | :----: | :-----: | :-------------------: |
|           |  API_ENDPOINT   |                | string |         | `https://web3api.io`  |
|    ✅     |     API_KEY     | API key to use | string |         |                       |
|           | WS_API_ENDPOINT |                | string |         | `wss://ws.web3api.io` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                                                                                 Options                                                                                                 | Default |
| :-------: | :------: | :-----------------: | :----: | :-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [balance](#balance-endpoint), [crypto](#crypto-endpoint), [gasprice](#gasprice-endpoint), [marketcap](#token-endpoint), [price](#crypto-endpoint), [token](#token-endpoint), [volume](#volume-endpoint) |         |

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

There are no examples for this endpoint.

---

## Crypto Endpoint

Gets the [latest spot VWAP price](https://docs.amberdata.io/reference#spot-price-pair-latest) from Amberdata.

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

## Token Endpoint

Gets the asset USD Market Cap from Amberdata.

Supported names for this endpoint are: `marketcap`, `token`.

### Input Params

| Required? | Name |    Aliases     |             Description             |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :------------: | :---------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `coin`, `from` | The symbol of the currency to query | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Gasprice Endpoint

`gasprice` is the only supported name for this endpoint.

### Input Params

| Required? |    Name    | Aliases |               Description                |  Type  |                 Options                 |      Default       | Depends On | Not Valid With |
| :-------: | :--------: | :-----: | :--------------------------------------: | :----: | :-------------------------------------: | :----------------: | :--------: | :------------: |
|           |   speed    |         |            The desired speed             | string | `average`, `fast`, `fastest`, `safeLow` |     `average`      |            |                |
|           | blockchain |         | The blockchain id to get gas prices from | string |                                         | `ethereum-mainnet` |            |                |

### Example

There are no examples for this endpoint.

---

## Volume Endpoint

Gets the [24h-volume for historical of a pair](https://docs.amberdata.io/reference#spot-price-pair-historical) from Amberdata.

`volume` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |    Aliases     |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` |   The symbol of the currency to query    | string |         |         |            |                |
|    ✅     | quote | `market`, `to` | The symbol of the currency to convert to | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
