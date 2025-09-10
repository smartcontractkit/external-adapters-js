# SOLANA_FUNCTIONS

![1.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/solana-functions/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name          |                                        Description                                        |  Type  | Options | Default |
| :-------: | :-------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     |        RPC_URL        |                            The RPC URL for the Solana cluster                             | string |         |         |
|           | BACKGROUND_EXECUTE_MS | The amount of time the background execute should sleep before performing the next request | number |         | `1000`  |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |              Options               |   Default    |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------: | :----------: |
|           | endpoint | The endpoint to use | string | [eusx-price](#eusx-price-endpoint) | `eusx-price` |

## Eusx-price Endpoint

`eusx-price` is the only supported name for this endpoint.

### Input Params

| Required? |  Name   | Aliases |          Description          |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-----: | :-----: | :---------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | address |         | Program address to fetch from | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "eusx-price",
    "address": "eUSXyKoZ6aGejYVbnp3wtWQ1E8zuokLAJPecPxxtgG3"
  }
}
```

---

MIT License
