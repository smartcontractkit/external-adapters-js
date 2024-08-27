# SYNTHETIX_FEEDS

![1.1.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/synthetix-feeds/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name          |                                        Description                                        |  Type  | Options | Default |
| :-------: | :-------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     |        RPC_URL        |                          The RPC URL to connect to the EVM chain                          | string |         |         |
|    ✅     |       CHAIN_ID        |                                The chain id to connect to                                 | number |         |   `1`   |
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

| Required? |    Name    |                                  Aliases                                   | Description | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :--------: | :------------------------------------------------------------------------: | :---------: | :--: | :-----: | :-----: | :--------: | :------------: |
|           | definition |                                                                            |             |      |         |         |            |                |
|    ✅     |  examples  |                             `[object Object]`                              |             |      |         |         |            |                |
|    ✅     |   params   | `[object Object]`, `[object Object]`, `[object Object]`, `[object Object]` |             |      |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "price",
    "base": "sUSDe",
    "quote": "USD",
    "base_address": "0x0000000000000000000000000000000000000000",
    "quote_address": "0x0000000000000000000000000000000000000000"
  }
}
```

---

MIT License
