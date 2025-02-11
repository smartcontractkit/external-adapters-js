# TOKEN_BALANCE

![1.0.7](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/token-balance/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Usage Notes

### evm endpoint network vs chainId input param

At least one of [`chainId` and `network`] must be present when using the `evm` endpoint.

The result is scaled to 18 decimals.

Additional env vars in the form `${NETWORK}_RPC_URL` and `${NETWORK}_RPC_CHAIN_ID` are required for each supported network.

## Environment Variables

| Required? |         Name          |                                        Description                                        |  Type  | Options |   Default   |
| :-------: | :-------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :---------: |
|           |   ARBITRUM_RPC_URL    |                                 RPC url of Arbitrum node                                  | string |         |     ``      |
|           | ARBITRUM_RPC_CHAIN_ID |                                     Arbitrum chain id                                     | number |         |   `42161`   |
|           |    SOLANA_RPC_URL     |                                      Solana Rpc Url                                       | string |         |     ``      |
|           |   SOLANA_COMMITMENT   |                            Solana transaction commitment level                            | string |         | `finalized` |
|           | BACKGROUND_EXECUTE_MS | The amount of time the background execute should sleep before performing the next request | number |         |   `10000`   |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                  Options                                   | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [erc20](#evm-endpoint), [evm](#evm-endpoint), [solvjlp](#solvjlp-endpoint) |  `evm`  |

## Evm Endpoint

Supported names for this endpoint are: `erc20`, `evm`.

### Input Params

| Required? |             Name             | Aliases |                                                                         Description                                                                         |   Type   | Options |                                Default                                | Depends On | Not Valid With |
| :-------: | :--------------------------: | :-----: | :---------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: | :-----: | :-------------------------------------------------------------------: | :--------: | :------------: |
|    ✅     |          addresses           |         |                                                                  List of addresses to read                                                                  | object[] |         |                                                                       |            |                |
|           |      addresses.network       | `chain` |                                                                   Network of the contract                                                                   |  string  |         |                                                                       |            |                |
|           |      addresses.chainId       |         |                                                                   Chain ID of the network                                                                   |  string  |         |                                                                       |            |                |
|    ✅     |  addresses.contractAddress   |         |                                                                  Address of token contract                                                                  |  string  |         |                                                                       |            |                |
|    ✅     |      addresses.wallets       |         |                                                              Array of wallets to sum balances                                                               | string[] |         |                                                                       |            |                |
|           | addresses.balanceOfSignature |         | Function signature. Should be formatted as [human readable ABI](https://docs.ethers.io/v5/single-page/#/v5/getting-started/-%23-getting-started--contracts) |  string  |         | `function balanceOf(address account) external view returns (uint256)` |            |                |
|           | addresses.decimalsSignature  |         | Function signature. Should be formatted as [human readable ABI](https://docs.ethers.io/v5/single-page/#/v5/getting-started/-%23-getting-started--contracts) |  string  |         |          `function decimals() external pure returns (uint8)`          |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "evm",
    "addresses": [
      {
        "network": "ethereum",
        "chainId": "1",
        "contractAddress": "0x514910771af9ca656af840dff83e8264ecf986ca",
        "wallets": [
          "0xBc10f2E862ED4502144c7d632a3459F49DFCDB5e",
          "0xF977814e90dA44bFA03b6295A0616a897441aceC"
        ],
        "balanceOfSignature": "function balanceOf(address account) external view returns (uint256)",
        "decimalsSignature": "function decimals() external pure returns (uint8)"
      }
    ]
  }
}
```

---

## Solvjlp Endpoint

`solvjlp` is the only supported name for this endpoint.

### Input Params

| Required? |           Name            | Aliases |           Description            |   Type   | Options |                   Default                    | Depends On | Not Valid With |
| :-------: | :-----------------------: | :-----: | :------------------------------: | :------: | :-----: | :------------------------------------------: | :--------: | :------------: |
|    ✅     |         addresses         |         |    List of addresses to read     | object[] |         |                                              |            |                |
|           |      addresses.token      |         |    only JLP will be processed    |  string  |         |                                              |            |                |
|    ✅     | addresses.contractAddress |         |    Address of token contract     |  string  |         |                                              |            |                |
|    ✅     |     addresses.wallets     |         | Array of wallets to sum balances | string[] |         |                                              |            |                |
|           |      jlpUsdContract       |         |  JLP/USD price feed on arbitrum  |  string  |         | `0x702609AFaDda5b357bc7b0C5174645a4438A99F3` |            |                |
|           |      btcUsdContract       |         |  BTC/USD price feed on arbitrum  |  string  |         | `0x6ce185860a4963106506C203335A2910413708e9` |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "solvjlp",
    "addresses": [
      {
        "token": "JLP",
        "contractAddress": "27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4",
        "wallets": ["9P9MwtNknCNZkWLqgkuofM2b8FEDE8jNJxhnuSkHnhrf"]
      }
    ],
    "jlpUsdContract": "0x702609AFaDda5b357bc7b0C5174645a4438A99F3",
    "btcUsdContract": "0x6ce185860a4963106506C203335A2910413708e9"
  }
}
```

---

MIT License
