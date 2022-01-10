# Chainlink External Adapter for Uniswap V3

Version: 1.1.1

This adapter allows querying Uniswap V3 contracts

## Environment Variables

| Required? |        Name        |                                                 Description                                                 |  Type  | Options |                   Default                    |
| :-------: | :----------------: | :---------------------------------------------------------------------------------------------------------: | :----: | :-----: | :------------------------------------------: |
|    ✅     |  ETHEREUM_RPC_URL  |               An http(s) RPC URL to a blockchain node that can read the Uniswap V3 contracts                | string |         |                                              |
|           |  QUOTER_CONTRACT   | The address of the Uniswap V3 address quoter contract. NOTE: THIS SHOULD NOT BE CHANGED ON ETHEREUM MAINNET | string |         | `0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6` |
|           | DEFAULT_FEE_TIERS  |                                       The Uniswap V3 fee tiers amount                                       | number |         |              `[500,3000,10000]`              |
|           | BLOCKCHAIN_NETWORK |  The network to get pre-defined token addresses from. NOTE: THIS SHOULD NOT BE CHANGED ON ETHEREUM MAINNET  | string |         |                  `ethereum`                  |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |          Options           | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint) | `crypto` |

---

## Crypto Endpoint

`crypto` is the only supported name for this endpoint.

### Input Params

| Required? |     Name     |      Aliases      |                                                     Description                                                      |  Type  | Options |     Default      | Depends On | Not Valid With |
| :-------: | :----------: | :---------------: | :------------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :--------------: | :--------: | :------------: |
|    ✅     |     from     |  `base`, `coin`   |                                    The symbol or address of the currency to query                                    | string |         |                  |            |                |
|           | fromAddress  |                   |          Optional param to pre-define the address to convert from. If set, it takes precedence over `from`           | string |         |                  |            |                |
|           | fromDecimals |                   | Optional param to pre-define the number of decimals in the `from` token. Setting this will make the query run faster | number |         |                  |            |                |
|    ✅     |      to      | `quote`, `market` |                                 The symbol or address of the currency to convert to                                  | string |         |                  |            |                |
|           |  toAddress   |                   |            Optional param to pre-define the address to convert to. If set, it takes precedence over `to`             | string |         |                  |            |                |
|           |  toDecimals  |                   |  Optional param to pre-define the number of decimals in the `to` token. Setting this will make the query run faster  | number |         |                  |            |                |
|           |    amount    |                   |               The exchange amount to get the rate of. The amount is in full units, e.g. 1 USDC, 1 ETH                | number |         |       `1`        |            |                |
|           |  resultPath  |                   |                                                 The result to fetch                                                  | string |         |      `rate`      |            |                |
|           |   feeTiers   |                   |                    Optional param of fee tiers to iterate through when quoting a pairs swap price                    | array  |         | `500,3000,10000` |            |                |

There are no examples for this endpoint.
