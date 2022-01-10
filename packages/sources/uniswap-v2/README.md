# Chainlink External Adapter for Uniswap V2

Version: 1.1.1

This adapter allows querying Uniswap V2 contracts

## Environment Variables

| Required? |        Name        |                                                Description                                                |  Type  | Options |                   Default                    |
| :-------: | :----------------: | :-------------------------------------------------------------------------------------------------------: | :----: | :-----: | :------------------------------------------: |
|    ✅     |  ETHEREUM_RPC_URL  |               An http(s) RPC URL to a blockchain node that can read the UniswapV2 contracts               | string |         |                                              |
|           |  ROUTER_CONTRACT   |    The uniswap router address to get price from. NOTE: THIS SHOULD NOT BE CHANGED ON ETHEREUM MAINNET     | string |         | `0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D` |
|           | BLOCKCHAIN_NETWORK | The network to get pre-defined token addresses from. NOTE: THIS SHOULD NOT BE CHANGED ON ETHEREUM MAINNET | string |         |                  `ethereum`                  |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |          Options           | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint) | `crypto` |

---

## Crypto Endpoint

`crypto` is the only supported name for this endpoint.

### Input Params

| Required? |     Name     |      Aliases      |                                                     Description                                                      |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----------: | :---------------: | :------------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |     from     |  `base`, `coin`   |                                    The symbol or address of the currency to query                                    | string |         |         |            |                |
|           | fromAddress  |                   |          Optional param to pre-define the address to convert from. If set, it takes precedence over `from`           | string |         |         |            |                |
|           | fromDecimals |                   | Optional param to pre-define the number of decimals in the `from` token. Setting this will make the query run faster | number |         |         |            |                |
|    ✅     |      to      | `quote`, `market` |                                 The symbol or address of the currency to convert to                                  | string |         |         |            |                |
|           |  toAddress   |                   |            Optional param to pre-define the address to convert to. If set, it takes precedence over `to`             | string |         |         |            |                |
|           |  toDecimals  |                   |  Optional param to pre-define the number of decimals in the `to` token. Setting this will make the query run faster  | number |         |         |            |                |
|           |    amount    |                   |               The exchange amount to get the rate of. The amount is in full units, e.g. 1 USDC, 1 ETH                | number |         |   `1`   |            |                |
|           |  resultPath  |                   |                                                 The result to fetch                                                  | string |         | `rate`  |            |                |

There are no examples for this endpoint.
