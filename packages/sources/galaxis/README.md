# Example Source Adapter

Version: 1.0.33

Example Source Adapter (this title and description were pulled from source/schemas/env.json)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |               Name                |                        Description                         |  Type  | Options |                   Default                    |
| :-------: | :-------------------------------: | :--------------------------------------------------------: | :----: | :-----: | :------------------------------------------: |
|    ✅     |          POLYGON_RPC_URL          |       The RPC URL to connect to the Polygon network        | string |         |                                              |
|    ✅     |           API_ENDPOINT            | The API endpoint to pull team and player achievements from | string |         |                                              |
|           |               LIMIT               |   The maximum number of bytes for the calls data result    | string |         |                    `700`                     |
|           |        EC_REGISTRY_ADDRESS        |         The ECRegistry contract address on Polygon         | string |         | `0x163883263274e8Ef6332cFa84F35B23c6C51dF72` |
|           | CHAIN_BATCH_WRITE_ADAPTER_ADDRESS |        The BatchWriter contract address on Polygon         | string |         | `0xB57fba975C89492B016e0215E819B4d489F0fbcD` |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |       Options        | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [nba](#nba-endpoint) |  `nba`  |

---

## Nba Endpoint

This endpoint fetches a list of achievements for NBA teams and players and returns them as an encoded value

`nba` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

There are no examples for this endpoint.

---
