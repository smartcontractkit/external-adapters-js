# LO_TECH

![1.0.1](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/lo-tech/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |            Name            |                                   Description                                    |  Type  | Options | Default |
| :-------: | :------------------------: | :------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     |     ${REGION}\_API_KEY     |      Lo-Tech API key for the given ${REGION}. Region can be "US" or "ASIA"       | string |         |         |
|    ✅     | ${REGION}\_WS_API_ENDPOINT | Lo-Tech websocket endpoint for the given ${REGION}. Region can be "US" or "ASIA" | string |         |         |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                Options                 |    Default     |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------: | :------------: |
|           | endpoint | The endpoint to use | string | [stock_quotes](#stock_quotes-endpoint) | `stock_quotes` |

## Stock_quotes Endpoint

`stock_quotes` is the only supported name for this endpoint.

### Input Params

| Required? | Name |                   Aliases                   |        Description        |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :-----------------------------------------: | :-----------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `asset`, `coin`, `from`, `symbol`, `ticker` | The stock ticker to query | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "stock_quotes",
    "base": "9988-HKD:SPOT"
  }
}
```

---

MIT License
