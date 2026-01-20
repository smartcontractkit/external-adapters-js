# GMX_TOKENS

![1.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/composites/gmx-tokens/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |                 Name                  |                                        Description                                        |  Type  | Options |                   Default                    |
| :-------: | :-----------------------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :------------------------------------------: |
|    ✅     |        DATA_ENGINE_ADAPTER_URL        |                                   URL of Data Engine EA                                   | string |         |                                              |
|           |           ARBITRUM_RPC_URL            |                                 RPC url of Arbitrum node                                  | string |         |                                              |
|           |           ARBITRUM_CHAIN_ID           |                          The chain id to connect to for Arbitrum                          | number |         |                   `42161`                    |
|           |            BOTANIX_RPC_URL            |                                  RPC url of Botanix node                                  | string |         |                                              |
|           |           BOTANIX_CHAIN_ID            |                          The chain id to connect to for Botanix                           | number |         |                    `3637`                    |
|           |           AVALANCHE_RPC_URL           |                                 RPC url of Avalanche node                                 | string |         |                                              |
|           |          AVALANCHE_CHAIN_ID           |                         The chain id to connect to for Avalanche                          | number |         |                   `43114`                    |
|           |  ARBITRUM_DATASTORE_CONTRACT_ADDRESS  |                        Address of Data Store contract on Arbitrum                         | string |         | `0xFD70de6b91282D8017aA4E741e9Ae325CAb992d8` |
|           |  BOTANIX_DATASTORE_CONTRACT_ADDRESS   |                         Address of Data Store contract on Botanix                         | string |         | `0xA23B81a89Ab9D7D89fF8fc1b5d8508fB75Cc094d` |
|           | AVALANCHE_DATASTORE_CONTRACT_ADDRESS  |                        Address of Data Store contract on Avalanche                        | string |         | `0x2F0b22339414ADeD7D5F06f9D604c7fF5b2fe3f6` |
|           |  ARBITRUM_GM_READER_CONTRACT_ADDRESS  |                         Address of GM Reader contract on Arbitrum                         | string |         | `0x470fbC46bcC0f16532691Df360A07d8Bf5ee0789` |
|           |  BOTANIX_GM_READER_CONTRACT_ADDRESS   |                         Address of GM Reader contract on Botanix                          | string |         | `0x922766ca6234cD49A483b5ee8D86cA3590D0Fb0E` |
|           | AVALANCHE_GM_READER_CONTRACT_ADDRESS  |                        Address of GM Reader contract on Avalanche                         | string |         | `0x62Cb8740E6986B29dC671B2EB596676f60590A5B` |
|           | ARBITRUM_GLV_READER_CONTRACT_ADDRESS  |                        Address of GLV Reader contract on Arbitrum                         | string |         | `0x2C670A23f1E798184647288072e84054938B5497` |
|           |  BOTANIX_GLV_READER_CONTRACT_ADDRESS  |                         Address of GLV Reader contract on Botanix                         | string |         | `0x955Aa50d2ecCeffa59084BE5e875eb676FfAFa98` |
|           | AVALANCHE_GLV_READER_CONTRACT_ADDRESS |                        Address of GLV Reader contract on Avalanche                        | string |         | `0x5C6905A3002f989E1625910ba1793d40a031f947` |
|    ✅     |       ARBITRUM_TOKENS_INFO_URL        |                    URL to token metadata supported by GMX on Arbitrum                     | string |         |  `https://arbitrum-api.gmxinfra.io/tokens`   |
|           |        BOTANIX_TOKENS_INFO_URL        |                     URL to token metadata supported by GMX on Botanix                     | string |         |   `https://botanix-api.gmxinfra.io/tokens`   |
|           |       AVALANCHE_TOKENS_INFO_URL       |                    URL to token metadata supported by GMX on Avalanche                    | string |         |  `https://avalanche-api.gmxinfra.io/tokens`  |
|           |       ARBITRUM_MARKETS_INFO_URL       |                    URL to market metadata supported by GMX on Arbitrum                    | string |         |  `https://arbitrum-api.gmxinfra.io/markets`  |
|           |       BOTANIX_MARKETS_INFO_URL        |                    URL to market metadata supported by GMX on Botanix                     | string |         |  `https://botanix-api.gmxinfra.io/markets`   |
|           |      AVALANCHE_MARKETS_INFO_URL       |                   URL to market metadata supported by GMX on Avalanche                    | string |         | `https://avalanche-api.gmxinfra.io/markets`  |
|           |        GLV_INFO_API_TIMEOUT_MS        | Timeout for metadata API requests. Distinct from API_TIMEOUT used for provider requests.  | number |         |                   `10000`                    |
|           |     METADATA_REFRESH_INTERVAL_MS      |                   How often metadata should be refreshed from GMX APIs                    | number |         |                  `10800000`                  |
|    ✅     |            PNL_FACTOR_TYPE            |     PnL factor type. See https://github.com/gmx-io/gmx-synthetics#market-token-price      | string |         |         `MAX_PNL_FACTOR_FOR_TRADERS`         |
|           |         BACKGROUND_EXECUTE_MS         | The amount of time the background execute should sleep before performing the next request | number |         |                   `10000`                    |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                 Options                                                  |  Default   |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------------------------------------------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [glv-crypto-lwba](#glv-price-endpoint), [glv-price](#glv-price-endpoint), [gm-price](#gm-price-endpoint) | `gm-price` |

## Gm-price Endpoint

`gm-price` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  | Aliases |                                     Description                                      |  Type  |              Options               |  Default   | Depends On | Not Valid With |
| :-------: | :----: | :-----: | :----------------------------------------------------------------------------------: | :----: | :--------------------------------: | :--------: | :--------: | :------------: |
|    ✅     | index  |         | Index token. Long and short tokens will be opened / closed based on this price feed. | string |                                    |            |            |                |
|    ✅     |  long  |         |             Long token. This is the token that will back long positions.             | string |                                    |            |            |                |
|    ✅     | short  |         |            Short token. This is the token that will back short positions.            | string |                                    |            |            |                |
|    ✅     | market |         |                          Market address of the market pool.                          | string |                                    |            |            |                |
|           | chain  |         |                              Target chain for GM market                              | string | `arbitrum`, `avalanche`, `botanix` | `arbitrum` |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "gm-price",
    "index": "LINK",
    "long": "LINK",
    "short": "USDC",
    "market": "0x7f1fa204bb700853D36994DA19F830b6Ad18455C",
    "chain": "arbitrum"
  }
}
```

---

## Glv-price Endpoint

Supported names for this endpoint are: `glv-crypto-lwba`, `glv-price`.

### Input Params

| Required? | Name  | Aliases |         Description         |  Type  |              Options               |  Default   | Depends On | Not Valid With |
| :-------: | :---: | :-----: | :-------------------------: | :----: | :--------------------------------: | :--------: | :--------: | :------------: |
|    ✅     |  glv  |         |         Glv address         | string |                                    |            |            |                |
|           | chain |         | Target chain for GLV market | string | `arbitrum`, `avalanche`, `botanix` | `arbitrum` |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "glv-price",
    "glv": "0x528A5bac7E746C9A509A1f4F6dF58A03d44279F9",
    "chain": "arbitrum"
  }
}
```

---

MIT License
