# Chainlink External Adapter for Uniswap V3

This adapter allows querying Uniswap V3 contracts

### Environment Variables

| Required? |        Name        |                                                 Description                                                 | Options |                 Defaults to                  |
| :-------: | :----------------: | :---------------------------------------------------------------------------------------------------------: | :-----: | :------------------------------------------: |
|    ✅     |      RPC_URL       |               An http(s) RPC URL to a blockchain node that can read the Uniswap V3 contracts                |         |                                              |
|           |  QUOTER_CONTRACT   | The address of the Uniswap V3 address quoter contract. NOTE: THIS SHOULD NOT BE CHANGED ON ETHEREUM MAINNET |         | `0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6` |
|           | DEFAULT_FEE_TIERS  |                                       The Uniswap V3 fee tiers amount                                       |         |              `[500,3000,10000]`              |
|           | BLOCKCHAIN_NETWORK |  The network to get pre-defined token addresses from. NOTE: THIS SHOULD NOT BE CHANGED ON ETHEREUM MAINNET  |         |                  `ethereum`                  |

---

### Input Parameters

| Required? |   Name   |     Description     |          Options           | Defaults to |
| :-------: | :------: | :-----------------: | :------------------------: | :---------: |
|           | endpoint | The endpoint to use | [crypto](#Crypto-Endpoint) |   crypto    |

---

## Crypto Endpoint

Gets the exchange rate between two tokens

### Input Params

| Required? |            Name            |                                                     Description                                                      | Options |    Defaults to     |
| :-------: | :------------------------: | :------------------------------------------------------------------------------------------------------------------: | :-----: | :----------------: |
|    ✅     | `base`, `from`, or `coin`  |                                    The symbol or address of the currency to query                                    |         |                    |
|           |       `fromAddress`        |          Optional param to pre-define the address to convert from. If set, it takes precedence over `from`           |         |                    |
|           |       `fromDecimals`       | Optional param to pre-define the number of decimals in the `from` token. Setting this will make the query run faster |         |                    |
|    ✅     | `quote`, `to`, or `market` |                                 The symbol or address of the currency to convert to                                  |         |                    |
|           |        `toAddress`         |            Optional param to pre-define the address to convert to. If set, it takes precedence over `to`             |         |                    |
|           |        `toDecimals`        |  Optional param to pre-define the number of decimals in the `to` token. Setting this will make the query run faster  |         |                    |
|           |          `amount`          |               The exchange amount to get the rate of. The amount is in full units, e.g. 1 USDC, 1 ETH                |         |        `1`         |
|           |        `resultPath`        |                                                 The result to fetch                                                  |         |       `rate`       |
|           |         `feeTiers`         |                    Optional param of fee tiers to iterate through when quoting a pairs swap price                    |         | `[500,3000,10000]` |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "from": "USDC",
    "to": "USDT"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": 0.999465,
  "statusCode": 200,
  "data": {
    "input": "1000000",
    "inputToken": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "inputDecimals": 6,
    "output": "999465",
    "outputToken": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    "outputDecimals": 6,
    "rate": 0.999465,
    "result": 0.999465
  }
}
```
