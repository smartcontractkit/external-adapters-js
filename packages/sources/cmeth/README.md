# CMETH

![2.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/cmeth/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name          |                                        Description                                        |  Type  | Options | Default |
| :-------: | :-------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     |   ETHEREUM_RPC_URL    |                                 RPC url of Ethereum node                                  | string |         |         |
|           | ETHEREUM_RPC_CHAIN_ID |                                     Ethereum chain id                                     | number |         |   `1`   |
|           | BACKGROUND_EXECUTE_MS | The amount of time the background execute should sleep before performing the next request | number |         | `10000` |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |         Options          | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [price](#price-endpoint) | `price` |

## Price Endpoint

`price` is the only supported name for this endpoint.

### Input Params

| Required? |          Name           | Aliases |                            Description                            |   Type   | Options | Default | Depends On | Not Valid With |
| :-------: | :---------------------: | :-----: | :---------------------------------------------------------------: | :------: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |        addresses        |         |     Map names to token or position manager contract addresses     | object[] |         |         |            |                |
|    ✅     |     addresses.name      |         |  Name of the address to use in balanceOf and getTotalLPT queries  |  string  |         |         |            |                |
|    ✅     |    addresses.address    |         | Address of token or position manager contract referred to by name |  string  |         |         |            |                |
|    ✅     |        balanceOf        |         |                     Balances to query to sum                      | object[] |         |         |            |                |
|    ✅     | balanceOf.tokenContract |         |       Name of address of token contract to query balanceOf        |  string  |         |         |            |                |
|    ✅     |    balanceOf.account    |         |              Name of address to query balanceOf for               |  string  |         |         |            |                |
|    ✅     |       getTotalLPT       |         |         Names of addresses to sum getTotalLPT results for         | string[] |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "price",
    "addresses": [
      {
        "name": "cmETH",
        "address": "0xE6829d9a7eE3040e1276Fa75293Bde931859e8fA"
      },
      {
        "name": "mETH",
        "address": "0xd5F7838F5C461fefF7FE49ea5ebaF7728bB0ADfa"
      },
      {
        "name": "BoringVault",
        "address": "0x33272D40b247c4cd9C646582C9bbAD44e85D4fE4"
      },
      {
        "name": "PositionManager-Karak",
        "address": "0x52EA8E95378d01B0aaD3B034Ca0656b0F0cc21A2"
      },
      {
        "name": "V1:PositionManager-Symbiotic",
        "address": "0x919531146f9a25dfc161d5ab23b117feae2c1d36"
      },
      {
        "name": "V1:SymbioticRestakingPool",
        "address": "0x475d3eb031d250070b63fa145f0fcfc5d97c304a"
      }
    ],
    "balanceOf": [
      {
        "tokenContract": "mETH",
        "account": "BoringVault"
      },
      {
        "tokenContract": "mETH",
        "account": "PositionManager-Karak"
      },
      {
        "tokenContract": "V1:SymbioticRestakingPool",
        "account": "V1:PositionManager-Symbiotic"
      }
    ],
    "getTotalLPT": ["PositionManager-Karak"]
  }
}
```

---

MIT License
