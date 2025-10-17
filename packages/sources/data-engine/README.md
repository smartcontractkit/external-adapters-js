# DATA_ENGINE

![1.0.2](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/data-engine/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |             Description             |  Type  | Options |               Default               |
| :-------: | :-------------: | :---------------------------------: | :----: | :-----: | :---------------------------------: |
|           |  API_ENDPOINT   |    The default REST API base url    | string |         | `https://api.dataengine.chain.link` |
|           | WS_API_ENDPOINT | The default WebSocket API base url  | string |         |  `wss://ws.dataengine.chain.link`   |
|    ✅     |  API_USERNAME   | Data Engine API key (Authorization) | string |         |                                     |
|    ✅     |  API_PASSWORD   |  Data Engine user secret for HMAC   | string |         |                                     |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                           Options                            |   Default   |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------------: | :---------: |
|           | endpoint | The endpoint to use | string | [crypto-v3](#crypto-v3-endpoint), [rwa-v8](#rwa-v8-endpoint) | `crypto-v3` |

## Crypto-v3 Endpoint

`crypto-v3` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  | Aliases |                Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----: | :---------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | feedId |         | The feedId for crypto feed with v3 schema | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "crypto-v3",
    "feedId": "0x000362205e10b3a147d02792eccee483dca6c7b44ecce7012cb8c6e0b68b3ae9"
  }
}
```

---

## Rwa-v8 Endpoint

`rwa-v8` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  | Aliases |              Description               |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----: | :------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | feedId |         | The feedId for RWA feed with v8 schema | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "rwa-v8",
    "feedId": "0x0008707410e2c111fb0e80cab2fa004b215eea2d95b106e700243f9ebcc8fbd9"
  }
}
```

---

MIT License
