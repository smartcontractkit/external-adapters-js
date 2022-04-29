# Chainlink External Adapter for Uniswap V3

![1.1.30](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/uniswap-v3/package.json)

This adapter allows querying Uniswap V3 contracts

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |        Name        |                                                 Description                                                 |  Type  | Options |                   Default                    |
| :-------: | :----------------: | :---------------------------------------------------------------------------------------------------------: | :----: | :-----: | :------------------------------------------: |
|    ✅     |  ETHEREUM_RPC_URL  |               An http(s) RPC URL to a blockchain node that can read the Uniswap V3 contracts                | string |         |                                              |
|           |      RPC_URL       |        A fallback http(s) RPC URL to a backup blockchain node that can read the UniswapV2 contracts         | string |         |                                              |
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

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "crypto",
    "resultPath": "rate",
    "from": "USDC",
    "to": "USDT",
    "amount": 1,
    "feeTiers": [500, 3000, 10000]
  },
  "debug": {
    "cacheKey": "RhKibLmo25iWe5ios1+5Oy7aAEI="
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
    "output": "999148",
    "outputToken": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    "outputDecimals": 6,
    "rate": 0.999148,
    "result": 0.999148
  },
  "result": 0.999148,
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
    "from": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    "fromDecimals": 18,
    "to": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    "toDecimals": 18,
    "amount": 10,
    "feeTiers": [500, 3000, 10000]
  },
  "debug": {
    "cacheKey": "8VpYvrdtdB65ZwdSYzEM0snM538="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "input": "10000000000000000000",
    "inputToken": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    "inputDecimals": 18,
    "output": "1454105298115974341987",
    "outputToken": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    "outputDecimals": 18,
    "rate": 145.41052981159743,
    "result": 145.41052981159743
  },
  "result": 145.41052981159743,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

</details>

---

MIT License
