# Galaxis Source Adapter

![4.0.4](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/galaxis/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

The Galaxis EA currently fetches Sports Data from a given API and encodes a function call that can be passed on chain.

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |               Name                |                        Description                         |  Type  | Options |                   Default                    |
| :-------: | :-------------------------------: | :--------------------------------------------------------: | :----: | :-----: | :------------------------------------------: |
|    ✅     |         ETHEREUM_RPC_URL          |       The RPC URL to connect to the Ethereum network       | string |         |                                              |
|           |         ETHEREUM_CHAIN_ID         |                 The chain id to connect to                 | string |         |                     `1`                      |
|    ✅     |           API_ENDPOINT            | The API endpoint to pull team and player achievements from | string |         |                                              |
|           |        EC_REGISTRY_ADDRESS        |        The ECRegistry contract address on Ethereum         | string |         | `0x163883263274e8Ef6332cFa84F35B23c6C51dF72` |
|    ✅     |      EC_REGISTRY_MAP_ADDRESS      |       The ECRegistryMap contract address on Ethereum       | string |         | `0x139B522955D54482E7662927653ABb0bFB6F19BA` |
|           | CHAIN_BATCH_WRITE_ADAPTER_ADDRESS |        The BatchWriter contract address on Ethereum        | string |         | `0xB57fba975C89492B016e0215E819B4d489F0fbcD` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |       Options        | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [nba](#nba-endpoint) |  `nba`  |

## Nba Endpoint

This endpoint fetches a list of achievements for NBA teams and players and returns them as an encoded value

`nba` is the only supported name for this endpoint.

### Input Params

| Required? | Name | Aliases | Description |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :-----: | :---------: | :----: | :-----: | :-----: | :--------: | :------------: |
|           | date |         |             | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
