# CMETH

![1.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/cmeth/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

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
        "name": "KmETH",
        "address": "0x7c22725d1e0871f0043397c9761ad99a86ffd498"
      },
      {
        "name": "BoringVault",
        "address": "0x33272D40b247c4cd9C646582C9bbAD44e85D4fE4"
      },
      {
        "name": "DelayedWithdraw",
        "address": "0x12Be34bE067Ebd201f6eAf78a861D90b2a66B113"
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
        "name": "V1:PositionManager-Eigen_A41",
        "address": "0x6DfbE3A1a0e835C125EEBb7712Fffc36c4D93b25"
      },
      {
        "name": "V1:PositionManager-Eigen_P2P",
        "address": "0x021180A06Aa65A7B5fF891b5C146FbDaFC06e2DA"
      },
      {
        "name": "V1:SymbioticRestakingPool",
        "address": "0x475d3eb031d250070b63fa145f0fcfc5d97c304a"
      },
      {
        "name": "V2:PositionManager-Symbiotic",
        "address": "0x5bb8e5e8602b71b182e0Efe256896a931489A135"
      },
      {
        "name": "V2:PositionManager-Eigen_A41",
        "address": "0xCaC15044a1F67238D761Aa4C7650DaB59cEF849D"
      },
      {
        "name": "V2:PositionManager-Eigen_P2P",
        "address": "0x0b5d15445b715bf117ba0482b7a9f772af46d93a"
      }
    ],
    "balanceOf": [
      {
        "tokenContract": "cmETH",
        "account": "BoringVault"
      },
      {
        "tokenContract": "cmETH",
        "account": "PositionManager-Karak"
      },
      {
        "tokenContract": "cmETH",
        "account": "V1:PositionManager-Symbiotic"
      },
      {
        "tokenContract": "cmETH",
        "account": "V1:PositionManager-Eigen_A41"
      },
      {
        "tokenContract": "cmETH",
        "account": "V1:PositionManager-Eigen_P2P"
      },
      {
        "tokenContract": "cmETH",
        "account": "V2:PositionManager-Symbiotic"
      },
      {
        "tokenContract": "cmETH",
        "account": "V2:PositionManager-Eigen_A41"
      },
      {
        "tokenContract": "cmETH",
        "account": "V2:PositionManager-Eigen_P2P"
      },
      {
        "tokenContract": "V1:SymbioticRestakingPool",
        "account": "V1:PositionManager-Symbiotic"
      },
      {
        "tokenContract": "cmETH",
        "account": "DelayedWithdraw"
      }
    ],
    "getTotalLPT": [
      "PositionManager-Karak",
      "V1:PositionManager-Eigen_A41",
      "V1:PositionManager-Eigen_P2P",
      "V2:PositionManager-Symbiotic",
      "V2:PositionManager-Eigen_A41",
      "V2:PositionManager-Eigen_P2P"
    ]
  }
}
```

---

MIT License
