# README_TEST_V3

![0.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/scripts/src/generate-readme/test/integration/readme-test-v3-adapter/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

This is a fake adapter for testing, and should not be used as a template for adapters.

## Environment Variables

| Required? |         Name         |            Description            |  Type  | Options |            Default            |
| :-------: | :------------------: | :-------------------------------: | :----: | :-----: | :---------------------------: |
|    ✅     |       API_KEY        |   An API key for Data Provider    | string |         |                               |
|           |     API_ENDPOINT     | An API endpoint for Data Provider | string |         | `https://dataproviderapi.com` |
|           |   WS_API_ENDPOINT    |   WS endpoint for Data Provider   | string |         |     `ws://localhost:9090`     |
|           | ${NETWORK}\_RPCL_URL | RPC URL for the given ${NETWORK}. | string |         |                               |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour | Note |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :--: |
| default |                             |              6              |                           |      |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |         Options          | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [price](#price-endpoint) | `price` |

## Price Endpoint

`price` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |              Aliases               |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :--------------------------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from`, `market`, `symbol` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote |          `convert`, `to`           |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "price",
    "base": "BTC",
    "quote": "USD"
  }
}
```

---

MIT License
