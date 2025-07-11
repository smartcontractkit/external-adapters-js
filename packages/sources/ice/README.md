# ICE

![1.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/ice/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |          Name           |                Description                 |  Type  | Options |   Default    |
| :-------: | :---------------------: | :----------------------------------------: | :----: | :-----: | :----------: |
|           |       USER_GROUP        |             User group for ICE             | string |         | `chain.link` |
|    ✅     |    NETDANIA_PASSWORD    |              Password for ICE              | string |         |              |
|    ✅     |      API_ENDPOINT       |     streaming server endpoint for ICE      | string |         |              |
|           | API_ENDPOINT_FAILOVER_1 |         failover endpoint for ICE          | string |         |      ``      |
|           | API_ENDPOINT_FAILOVER_2 |         failover endpoint for ICE          | string |         |      ``      |
|           | API_ENDPOINT_FAILOVER_3 |         failover endpoint for ICE          | string |         |      ``      |
|           |    POLLING_INTERVAL     |          Polling interval for ICE          | number |         |    `2000`    |
|           |  CONNECTING_TIMEOUT_MS  | Connecting timeout in milliseconds for ICE | number |         |    `4000`    |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                                                                          Options                                                                                                           | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [crypto-lwba](#price-endpoint), [crypto_lwba](#price-endpoint), [cryptolwba](#price-endpoint), [data-price](#price-endpoint), [getreqobjprice](#price-endpoint), [latest-price](#price-endpoint), [price](#price-endpoint) | `price` |

## Price Endpoint

Supported names for this endpoint are: `crypto-lwba`, `crypto_lwba`, `cryptolwba`, `data-price`, `getreqobjprice`, `latest-price`, `price`.

### Input Params

| Required? | Name  |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "price",
    "base": "EUR",
    "quote": "USD"
  }
}
```

---

MIT License
