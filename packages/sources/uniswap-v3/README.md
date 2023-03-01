# Chainlink External Adapter for Uniswap V3

![2.0.11](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/uniswap-v3/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

This adapter allows querying Uniswap V3 contracts

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |        Name        |                                                 Description                                                 |  Type  | Options |                   Default                    |
| :-------: | :----------------: | :---------------------------------------------------------------------------------------------------------: | :----: | :-----: | :------------------------------------------: |
|    ✅     |  ETHEREUM_RPC_URL  |               An http(s) RPC URL to a blockchain node that can read the Uniswap V3 contracts                | string |         |                                              |
|           |      RPC_URL       |        A fallback http(s) RPC URL to a backup blockchain node that can read the UniswapV2 contracts         | string |         |                                              |
|           | ETHEREUM_CHAIN_ID  |                                         The chain id to connect to                                          | string |         |                     `1`                      |
|           | BLOCKCHAIN_NETWORK |  The network to get pre-defined token addresses from. NOTE: THIS SHOULD NOT BE CHANGED ON ETHEREUM MAINNET  | string |         |                  `ethereum`                  |
|           |  QUOTER_CONTRACT   | The address of the Uniswap V3 address quoter contract. NOTE: THIS SHOULD NOT BE CHANGED ON ETHEREUM MAINNET | string |         | `0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6` |
|           | DEFAULT_FEE_TIERS  |                                       The Uniswap V3 fee tiers amount                                       | number |         |              `[500,3000,10000]`              |

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

| Required? |     Name     |      Aliases      |                                                     Description                                                      |  Type  | Options |     Default      | Depends On | Not Valid With |
| :-------: | :----------: | :---------------: | :------------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :--------------: | :--------: | :------------: |
|    ✅     |     from     |  `base`, `coin`   |                                    The symbol or address of the currency to query                                    | string |         |                  |            |                |
|           | fromAddress  |                   |          Optional param to pre-define the address to convert from. If set, it takes precedence over `from`           | string |         |                  |            |                |
|           | fromDecimals |                   | Optional param to pre-define the number of decimals in the `from` token. Setting this will make the query run faster | number |         |                  |            |                |
|    ✅     |      to      | `market`, `quote` |                                 The symbol or address of the currency to convert to                                  | string |         |                  |            |                |
|           |  toAddress   |                   |            Optional param to pre-define the address to convert to. If set, it takes precedence over `to`             | string |         |                  |            |                |
|           |  toDecimals  |                   |  Optional param to pre-define the number of decimals in the `to` token. Setting this will make the query run faster  | number |         |                  |            |                |
|           |    amount    |                   |               The exchange amount to get the rate of. The amount is in full units, e.g. 1 USDC, 1 ETH                | number |         |       `1`        |            |                |
|           |   feeTiers   |                   |                    Optional param of fee tiers to iterate through when quoting a pairs swap price                    | array  |         | `500,3000,10000` |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
