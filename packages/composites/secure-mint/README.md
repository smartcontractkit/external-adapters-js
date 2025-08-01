# SECURE_MINT

![1.0.2](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/composites/secure-mint/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |          Name           |                                        Description                                        |  Type  | Options | Default |
| :-------: | :---------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     | SECURE_MINT_INDEXER_URL |                                Url to secure-mint-indexer                                 | string |         |         |
|           |  BITGO_RESERVES_EA_URL  |                                 Url to Bitgo Reserves EA                                  | string |         |   ``    |
|           |  BACKGROUND_EXECUTE_MS  | The amount of time the background execute should sleep before performing the next request | number |         | `1000`  |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |            Options             |  Default   |
| :-------: | :------: | :-----------------: | :----: | :----------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [mintable](#mintable-endpoint) | `mintable` |

## Mintable Endpoint

`mintable` is the only supported name for this endpoint.

### Input Params

| Required? |       Name        | Aliases |                        Description                        |   Type   | Options | Default | Depends On | Not Valid With |
| :-------: | :---------------: | :-----: | :-------------------------------------------------------: | :------: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |       token       |         |                     Name of the token                     |  string  |         |         |            |                |
|    ✅     |     reserves      |         |             Name of the reserve data provider             |  string  | `Bitgo` |         |            |                |
|    ✅     |   supplyChains    |         |              List of chains the token is on               | string[] |         |         |            |                |
|    ✅     | supplyChainBlocks |         | The target block correspond to each chain in supplyChains | number[] |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "mintable",
    "token": "token1",
    "reserves": "Bitgo",
    "supplyChains": ["1", "56"],
    "supplyChainBlocks": [100, 400]
  }
}
```

---

MIT License
