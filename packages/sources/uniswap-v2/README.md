# Chainlink External Adapter for Uniswap V2

![2.0.11](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/uniswap-v2/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

This adapter allows querying Uniswap V2 contracts

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |        Name        |                                                Description                                                |  Type  | Options |                   Default                    |
| :-------: | :----------------: | :-------------------------------------------------------------------------------------------------------: | :----: | :-----: | :------------------------------------------: |
|    ✅     |  ETHEREUM_RPC_URL  |               An http(s) RPC URL to a blockchain node that can read the UniswapV2 contracts               | string |         |                                              |
|           |      RPC_URL       |       A fallback http(s) RPC URL to a backup blockchain node that can read the UniswapV2 contracts        | string |         |                                              |
|           | ETHEREUM_CHAIN_ID  |                                        The chain id to connect to                                         | string |         |                     `1`                      |
|           | BLOCKCHAIN_NETWORK | The network to get pre-defined token addresses from. NOTE: THIS SHOULD NOT BE CHANGED ON ETHEREUM MAINNET | string |         |                  `ethereum`                  |
|           |  ROUTER_CONTRACT   |    The Uniswap router address to get price from. NOTE: THIS SHOULD NOT BE CHANGED ON ETHEREUM MAINNET     | string |         | `0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |          Options           | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint) | `crypto` |

## Crypto Endpoint

Gets the exchange rate between two tokens

`crypto` is the only supported name for this endpoint.

### Input Params

| Required? |     Name     |      Aliases      |                                                     Description                                                      |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----------: | :---------------: | :------------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |     from     |  `base`, `coin`   |                                    The symbol or address of the currency to query                                    | string |         |         |            |                |
|           | fromAddress  |                   |          Optional param to pre-define the address to convert from. If set, it takes precedence over `from`           | string |         |         |            |                |
|           | fromDecimals |                   | Optional param to pre-define the number of decimals in the `from` token. Setting this will make the query run faster | number |         |         |            |                |
|    ✅     |      to      | `market`, `quote` |                                 The symbol or address of the currency to convert to                                  | string |         |         |            |                |
|           |  toAddress   |                   |            Optional param to pre-define the address to convert to. If set, it takes precedence over `to`             | string |         |         |            |                |
|           |  toDecimals  |                   |  Optional param to pre-define the number of decimals in the `to` token. Setting this will make the query run faster  | number |         |         |            |                |
|           |    amount    |                   |               The exchange amount to get the rate of. The amount is in full units, e.g. 1 USDC, 1 ETH                | number |         |   `1`   |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
