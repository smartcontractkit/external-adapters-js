# TICKERLAYER

![1.1.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/tickerlayer/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |          Description          |  Type  | Options |             Default             |
| :-------: | :-------------: | :---------------------------: | :----: | :-----: | :-----------------------------: |
|    ✅     |     API_KEY     | An API key for Data Provider  | string |         |                                 |
|           | WS_API_ENDPOINT | WS endpoint for Data Provider | string |         | `wss://stream.tickerlayer.com/` |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                           Options                                                            | Default |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------------------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [price](#stock-endpoint), [quotes](#stock_quotes-endpoint), [stock](#stock-endpoint), [stock_quotes](#stock_quotes-endpoint) | `stock` |

## Stock Endpoint

Supported names for this endpoint are: `price`, `stock`.

### Input Params

| Required? |   Name    |                   Aliases                   |                                                                            Description                                                                            |  Type  | Options | Default  | Depends On | Not Valid With |
| :-------: | :-------: | :-----------------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :------: | :--------: | :------------: |
|    ✅     |   base    | `asset`, `coin`, `from`, `symbol`, `ticker` |                                                                     The stock ticker to query                                                                     | string |         |          |            |                |
|           | assetType |                                             | The asset type is used to determine what channel to subscribe to. The Tickerlayer API supports "stocks", "fores", "crypto", "indices", "etfs", and "commodities". | string |         | `stocks` |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "stock",
    "base": "US:AAPL",
    "assetType": "stocks"
  }
}
```

---

## Stock_quotes Endpoint

Supported names for this endpoint are: `quotes`, `stock_quotes`.

### Input Params

| Required? |   Name    |                   Aliases                   |                                                                            Description                                                                            |  Type  | Options | Default  | Depends On | Not Valid With |
| :-------: | :-------: | :-----------------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :------: | :--------: | :------------: |
|    ✅     |   base    | `asset`, `coin`, `from`, `symbol`, `ticker` |                                                                     The stock ticker to query                                                                     | string |         |          |            |                |
|           | assetType |                                             | The asset type is used to determine what channel to subscribe to. The Tickerlayer API supports "stocks", "fores", "crypto", "indices", "etfs", and "commodities". | string |         | `stocks` |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "stock_quotes",
    "base": "US:AAPL",
    "assetType": "stocks"
  }
}
```

---

MIT License
