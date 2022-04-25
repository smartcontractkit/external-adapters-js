# Galaxis Source Adapter

![2.5.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/galaxis/package.json)

The Galaxis EA currently fetches Sports Data from a given API and encodes a function call that can be passed on chain.

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |               Name                |                        Description                         |  Type  | Options |                   Default                    |
| :-------: | :-------------------------------: | :--------------------------------------------------------: | :----: | :-----: | :------------------------------------------: |
|    ✅     |          POLYGON_RPC_URL          |       The RPC URL to connect to the Polygon network        | string |         |                                              |
|    ✅     |           API_ENDPOINT            | The API endpoint to pull team and player achievements from | string |         |                                              |
|           |        EC_REGISTRY_ADDRESS        |         The ECRegistry contract address on Polygon         | string |         | `0x163883263274e8Ef6332cFa84F35B23c6C51dF72` |
|    ✅     |      EC_REGISTRY_MAP_ADDRESS      |       The ECRegistryMap contract address on Polygon        | string |         | `0x139B522955D54482E7662927653ABb0bFB6F19BA` |
|           | CHAIN_BATCH_WRITE_ADAPTER_ADDRESS |        The BatchWriter contract address on Polygon         | string |         | `0xB57fba975C89492B016e0215E819B4d489F0fbcD` |

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

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "nba",
    "date": "2021-05-22"
  },
  "debug": {
    "cacheKey": "0ceVVxFeYOUutCaqialcj/zna3A="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "result": "0x00020000000c00323032312d30352d32320000000000000000000000000000000000000000000000e4000000000000000000000000D8193087E51f7c7D42e0947290acf3dc41Ba22C566a57e970000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000200e4000000000000000000000000D8193087E51f7c7D42e0947290acf3dc41Ba22C566a57e97000000000000000000000000000000000000000000000000000000000000000f000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000",
  "statusCode": 200,
  "data": {
    "result": "0x00020000000c00323032312d30352d32320000000000000000000000000000000000000000000000e4000000000000000000000000D8193087E51f7c7D42e0947290acf3dc41Ba22C566a57e970000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000200e4000000000000000000000000D8193087E51f7c7D42e0947290acf3dc41Ba22C566a57e97000000000000000000000000000000000000000000000000000000000000000f000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000"
  }
}
```

---

MIT License
