# Chainlink External Adapter for BOB

![2.0.18](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/bob/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

The adapter provides an interface for retrieving data from the source blockchain.

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |   Name   |        Description         |  Type  | Options | Default |
| :-------: | :------: | :------------------------: | :----: | :-----: | :-----: |
|    ✅     | RPC_URL  |  Blockchain RPC endpoint   | string |         |         |
|           | CHAIN_ID | The chain id to connect to | string |         |   `1`   |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |          Options           | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [format](#format-endpoint) | `format` |

## Format Endpoint

The format endpoint encodes the chainId, block hash, and block receiptsRoot as bytes and returns that without a 0x prefix.

`format` is the only supported name for this endpoint.

### Input Params

| Required? |    Name     | Aliases |                       Description                        | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :---------: | :-----: | :------------------------------------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|           |   chainId   |         | An identifier for which network of the blockchain to use |      |         |         |            |                |
|    ✅     | blockNumber |         |                Block number to query for                 |      |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "chainId": 1,
    "blockNumber": 1500000,
    "endpoint": "format"
  },
  "debug": {
    "cacheKey": "Q9Q+thx4ZKpxST2OPGKjPF9selY="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "result": "000000000000000000000000000000000000000000000000000000000000000183952d392f9b0059eea94b10d1a095eefb1943ea91595a16c6698757127d4e1c371086374dcad57dab3a0774e9877152e0c5b4a75815a50ea568d649f0e80077"
  },
  "result": "000000000000000000000000000000000000000000000000000000000000000183952d392f9b0059eea94b10d1a095eefb1943ea91595a16c6698757127d4e1c371086374dcad57dab3a0774e9877152e0c5b4a75815a50ea568d649f0e80077",
  "statusCode": 200
}
```

---

MIT License
