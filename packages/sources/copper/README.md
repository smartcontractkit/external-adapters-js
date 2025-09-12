# COPPER

![0.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/copper/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name          |                                                                                            Description                                                                                             |  Type  | Options |         Default         |
| :-------: | :-------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :---------------------: |
|    ✅     |        API_KEY        |                                                                               An API key for Data Provider - Copper                                                                                | string |         |                         |
|    ✅     |      API_SECRET       |                                                                              An API secret for Data Provider - Copper                                                                              | string |         |                         |
|           |     API_ENDPOINT      |                                                                             An API endpoint for Data Provider - Copper                                                                             | string |         | `https://api.copper.co` |
|           |   ETHEREUM_RPC_URL    |                                                                                      RPC url of Ethereum node                                                                                      | string |         |           ``            |
|           | ETHEREUM_RPC_CHAIN_ID |                                                                                         Ethereum chain id                                                                                          | number |         |           `1`           |
|           |   ARBITRUM_RPC_URL    |                                                                                      RPC url of Arbitrum node                                                                                      | string |         |           ``            |
|           | ARBITRUM_RPC_CHAIN_ID |                                                                                         Arbitrum chain id                                                                                          | number |         |         `42161`         |
|           | BACKGROUND_EXECUTE_MS |                                                                              Background execute time in milliseconds                                                                               | number |         |         `1000`          |
|           |      GROUP_SIZE       | Number of requests to execute asynchronously before the adapter waits to execute the next group of requests. Setting this lower than the default may result in lower performance from the adapter. | number |         |          `25`           |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |           Options            | Default |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [wallets](#wallets-endpoint) |         |

## Wallets Endpoint

`wallets` is the only supported name for this endpoint.

### Input Params

| Required? |             Name             | Aliases |                                     Description                                      |   Type   | Options | Default | Depends On | Not Valid With |
| :-------: | :--------------------------: | :-----: | :----------------------------------------------------------------------------------: | :------: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |         priceOracles         |         | Configuration of the on-chain price oracle that provides real-time token valuations. | object[] |         |         |            |                |
|    ✅     |      priceOracles.token      |         |            Symbol of the token to fetch price data for (e.g., ETH, SOL).             |  string  |         |         |            |                |
|    ✅     | priceOracles.contractAddress |         |         Contract address of the price oracle used to fetch token price data.         |  string  |         |         |            |                |
|    ✅     |     priceOracles.chainId     |         |    Blockchain network Id of the price oracle contract (e.g., ETHEREUM, ARBITRUM).    |  string  |         |         |            |                |
|           |         portfolioId          |         |                              The portfolio ID to query.                              |  string  |         |         |            |                |
|           |          currencies          |         |                        The list of currency symbols to query.                        | string[] |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "wallets",
    "priceOracles": [
      {
        "token": "ETH",
        "contractAddress": "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
        "chainId": "1"
      },
      {
        "token": "SOL",
        "contractAddress": "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612",
        "chainId": "42161"
      }
    ],
    "portfolioId": "cme14144g001y3b6k5x9gljwp",
    "currencies": ["ETH", "SOL", "USDC", "USDT", "USTB", "ETH", "SOL"]
  }
}
```

---

MIT License
