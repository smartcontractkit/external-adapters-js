# Chainlink External Adapter for Uniswap V2

![1.1.30](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/uniswap-v2/package.json)

This adapter allows querying Uniswap V2 contracts

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |        Name        |                                                Description                                                |  Type  | Options |                   Default                    |
| :-------: | :----------------: | :-------------------------------------------------------------------------------------------------------: | :----: | :-----: | :------------------------------------------: |
|    ✅     |  ETHEREUM_RPC_URL  |               An http(s) RPC URL to a blockchain node that can read the UniswapV2 contracts               | string |         |                                              |
|           |      RPC_URL       |       A fallback http(s) RPC URL to a backup blockchain node that can read the UniswapV2 contracts        | string |         |                                              |
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

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "crypto",
    "resultPath": "rate",
    "from": "USDC",
    "to": "USDT",
    "amount": 1
  },
  "debug": {
    "cacheKey": "8+57VCexLY5xpa6wBMELqPDkP4w="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "input": "1000000",
    "inputToken": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "inputDecimals": 6,
    "output": "999856",
    "outputToken": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    "outputDecimals": 6,
    "rate": 0.999856,
    "result": 0.999856
  },
  "result": 0.999856,
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
    "endpoint": "crypto",
    "resultPath": "rate",
    "from": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    "fromDecimals": 18,
    "to": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    "toDecimals": 18,
    "amount": 10
  },
  "debug": {
    "cacheKey": "vDDkmKyrSIMCbdoztDdiWyIDYmQ="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "input": "10000000000000000000",
    "inputToken": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    "inputDecimals": 18,
    "output": "2108971134647913998340",
    "outputToken": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    "outputDecimals": 18,
    "rate": 210.8971134647914,
    "result": 210.8971134647914
  },
  "result": 210.8971134647914,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

</details>

---

MIT License
