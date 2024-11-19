# LIDO_POR

![1.1.1](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/lido-por/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |          Name           |                                        Description                                        |  Type  | Options | Default |
| :-------: | :---------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     |         RPC_URL         |                          The RPC URL to connect to the EVM chain                          | string |         |         |
|    ✅     |        CHAIN_ID         |                                The chain id to connect to                                 | number |         |   `1`   |
|    ✅     | ETHEREUM_CL_INDEXER_URL |                        Url to ethereum-cl-indexer balance endpoint                        | string |         |         |
|           |  BACKGROUND_EXECUTE_MS  | The amount of time the background execute should sleep before performing the next request | number |         | `10000` |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [reserve](#reserve-endpoint) | `reserve` |

## Reserve Endpoint

`reserve` is the only supported name for this endpoint.

### Input Params

| Required? |     Name     | Aliases |             Description              |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----------: | :-----: | :----------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | lidoContract |         | The address of the lido POR contract | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "reserve",
    "lidoContract": "0xae7ab96520de3a18e5e111b5eaab095312d7fe84"
  }
}
```

---

MIT License
