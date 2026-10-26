# DATA_ENGINE

![1.7.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/data-engine/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |       Name        |             Description             |  Type  | Options |               Default               |
| :-------: | :---------------: | :---------------------------------: | :----: | :-----: | :---------------------------------: |
|           |  `API_ENDPOINT`   |    The default REST API base url    | string |         | `https://api.dataengine.chain.link` |
|           | `WS_API_ENDPOINT` | The default WebSocket API base url  | string |         |  `wss://ws.dataengine.chain.link`   |
|    ✅     |  `API_USERNAME`   | Data Engine API key (Authorization) | string |         |                                     |
|    ✅     |  `API_PASSWORD`   |  Data Engine user secret for HMAC   | string |         |                                     |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour | Note |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :--: |
| default |             200             |                             |                           |      |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                                                                                                                                                            Options                                                                                                                                                                                            |   Default   |
| :-------: | :------: | :-----------------: | :----: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :---------: |
|           | endpoint | The endpoint to use | string | [blended](#blended-endpoint), [crypto-v3](#crypto-v3-endpoint), [deutscheboerse-v11](#deutscheboerse-v11-endpoint), [exchangerate-v7](#exchangerate-v7-endpoint), [redemptionrate-v7](#exchangerate-v7-endpoint), [rwa-v8](#rwa-v8-endpoint), [twap](#twap-endpoint), [v11](#deutscheboerse-v11-endpoint), [v3](#crypto-v3-endpoint), [v7](#exchangerate-v7-endpoint), [v8](#rwa-v8-endpoint) | `crypto-v3` |

## Crypto-v3 Endpoint

Supported names for this endpoint are: `crypto-v3`, `v3`.

### Input Params

| Required? |      Name       | Aliases |                                                                             Description                                                                              |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-------------: | :-----: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |     feedId      |         |                                                                     The feed ID to subscribe to                                                                      | string |         |         |            |                |
|           |   resultPath    |         |                                                           The data field to populate the top-level result                                                            | string |         |         |            |                |
|           |    decimals     |         |                                                 Number of decimals to scale the resultPath value to (from native 18)                                                 | number |         |         |            |                |
|           | maxAgeInSeconds |         | Ignore report if the streams report is older than current time by more than this value in seconds. If not provided, all reports will be processed regardless of age. | number |         |         |            |                |

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

Supported names for this endpoint are: `rwa-v8`, `v8`.

### Input Params

| Required? |      Name       | Aliases |                                                                             Description                                                                              |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-------------: | :-----: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |     feedId      |         |                                                                     The feed ID to subscribe to                                                                      | string |         |         |            |                |
|           |   resultPath    |         |                                                           The data field to populate the top-level result                                                            | string |         |         |            |                |
|           |    decimals     |         |                                                 Number of decimals to scale the resultPath value to (from native 18)                                                 | number |         |         |            |                |
|           | maxAgeInSeconds |         | Ignore report if the streams report is older than current time by more than this value in seconds. If not provided, all reports will be processed regardless of age. | number |         |         |            |                |

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

## Deutscheboerse-v11 Endpoint

Supported names for this endpoint are: `deutscheboerse-v11`, `v11`.

### Input Params

| Required? |      Name       | Aliases |                                                                             Description                                                                              |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-------------: | :-----: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |     feedId      |         |                                                                     The feed ID to subscribe to                                                                      | string |         |         |            |                |
|           |   resultPath    |         |                                                           The data field to populate the top-level result                                                            | string |         |         |            |                |
|           |    decimals     |         |                                                 Number of decimals to scale the resultPath value to (from native 18)                                                 | number |         |         |            |                |
|           | maxAgeInSeconds |         | Ignore report if the streams report is older than current time by more than this value in seconds. If not provided, all reports will be processed regardless of age. | number |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "deutscheboerse-v11",
    "feedId": "0x0008707410e2c111fb0e80cab2fa004b215eea2d95b106e700243f9ebcc8fbd9"
  }
}
```

---

## Exchangerate-v7 Endpoint

Supported names for this endpoint are: `exchangerate-v7`, `redemptionrate-v7`, `v7`.

### Input Params

| Required? |      Name       | Aliases |                                                                             Description                                                                              |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-------------: | :-----: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |     feedId      |         |                                                                     The feed ID to subscribe to                                                                      | string |         |         |            |                |
|           |   resultPath    |         |                                                           The data field to populate the top-level result                                                            | string |         |         |            |                |
|           |    decimals     |         |                                                 Number of decimals to scale the resultPath value to (from native 18)                                                 | number |         |         |            |                |
|           | maxAgeInSeconds |         | Ignore report if the streams report is older than current time by more than this value in seconds. If not provided, all reports will be processed regardless of age. | number |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "exchangerate-v7",
    "feedId": "0x00070f4b71834a1b005b6c0f0ef3e3a2928aceaa51a1099f834e340e37ab498d",
    "decimals": 0
  }
}
```

---

## Twap Endpoint

`twap` is the only supported name for this endpoint.

### Input Params

| Required? |     Name      | Aliases |                      Description                      |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-----------: | :-----: | :---------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |    feedId     |         |             The feed ID to query TWAP for             | string |         |         |            |                |
|    ✅     | windowSeconds |         |    The time window in seconds to compute TWAP over    | number |         |         |            |                |
|           |     endTs     |         | The end timestamp (Unix seconds) for the TWAP window. | number |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "twap",
    "feedId": "0x000362205e10b3a147d02792eccee483dca6c7b44ecce7012cb8c6e0b68b3ae9",
    "windowSeconds": 30,
    "endTs": 1730000000
  }
}
```

---

## Blended Endpoint

`blended` is the only supported name for this endpoint.

### Input Params

| Required? |                 Name                 | Aliases |                                                     Description                                                      |  Type  |       Options        |     Default      | Depends On | Not Valid With |
| :-------: | :----------------------------------: | :-----: | :------------------------------------------------------------------------------------------------------------------: | :----: | :------------------: | :--------------: | :--------: | :------------: |
|    ✅     |                market                |         |             The market whose calendar routes between the feeds, e.g. `nyse`, `forex` (case-insensitive)              | string |                      |                  |            |                |
|    ✅     |                 open                 |         |                                   The feed ID for the open (regular hours) session                                   | string |                      |                  |            |                |
|    ✅     |                closed                |         |                                          The feed ID for the closed session                                          | string |                      |                  |            |                |
|           |              overnight               |         |          The feed ID for the overnight session. Must be provided together with `extended` (e.g. for `nyse`)          | string |                      |                  |            |                |
|           |               extended               |         | The feed ID for the extended (pre/post-market) session. Must be provided together with `overnight` (e.g. for `nyse`) | string |                      |                  |            |                |
|           |              indicator               |         |           The indicator applied on top of the stitched price. Omit to use the Data Engine default (`twap`)           | object |                      |                  |            |                |
|    ✅     |            indicator.type            |         |                                                  The indicator type                                                  | string |    `none`, `twap`    |                  |            |                |
|           |       indicator.windowSeconds        |         |                                           The indicator window in seconds                                            | number |                      |                  |            |                |
|           |           indicator.endTs            |         |                               The indicator window end as a unix timestamp in seconds                                | number |                      |                  |            |                |
|           |              stitching               |         |              The stitching applied across session feeds. Omit to use the Data Engine default (`kalman`)              | object |                      |                  |            |                |
|    ✅     |            stitching.mode            |         |                                                  The stitching mode                                                  | string | `adaptive`, `kalman` |                  |            |                |
|           |           stitching.params           |         |                          Stitching parameters. Omitted params use the Data Engine defaults                           | object |                      |                  |            |                |
|           | stitching.params.closeWindowSeconds  |         |                            Seconds before a session close in which the anchor is captured                            | number |                      |                  |            |                |
|           |  stitching.params.openWindowSeconds  |         |                             Seconds after a session open in which the anchor is applied                              | number |                      |                  |            |                |
|           |    stitching.params.blendSeconds     |         |                      Duration in seconds of the blend from the anchor to the new session price                       | number |                      |                  |            |                |
|           |  stitching.params.sigmoidSteepness   |         |                                         Steepness of the sigmoid blend curve                                         | number |                      |                  |            |                |
|           | stitching.params.maxAnchorAgeSeconds |         |                              Maximum age in seconds of an anchor before it is discarded                              | number |                      |                  |            |                |
|           | stitching.params.emaHalfLifeSeconds  |         |               Half-life in seconds of the overnight session EMA smoother. Only for the `adaptive` mode               | number |                      |                  |            |                |
|           |              resultPath              |         |                                   The data field to populate the top-level result                                    | string |                      | `indicatorPrice` |            |                |
|           |               decimals               |         |       Number of decimals to scale the resultPath value to (from the native decimals reported in the response)        | number |                      |                  |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "blended",
    "market": "nyse",
    "open": "0x000b355642ce85f1a35c19651d86e0f62b9d80469b4b076032250b838aa1a291",
    "closed": "0x000bccf7f0cabd7a4c9d1936188c9d3cb879d5e5ef35324125e32d11a2cbd116",
    "overnight": "0x000bccf7f0cabd7a4c9d1936188c9d3cb879d5e5ef35324125e32d11a2cbd116",
    "extended": "0x000bbb370f42279bdf6ef55c21b05e319d7e9ca316369c44387a8b5cf17bab3c",
    "resultPath": "indicatorPrice"
  }
}
```

<details>
<summary>Additional Examples</summary>

Request:

```json
{
  "data": {
    "endpoint": "blended",
    "market": "nyse",
    "open": "0x000b355642ce85f1a35c19651d86e0f62b9d80469b4b076032250b838aa1a291",
    "closed": "0x000bccf7f0cabd7a4c9d1936188c9d3cb879d5e5ef35324125e32d11a2cbd116",
    "overnight": "0x000bccf7f0cabd7a4c9d1936188c9d3cb879d5e5ef35324125e32d11a2cbd116",
    "extended": "0x000bbb370f42279bdf6ef55c21b05e319d7e9ca316369c44387a8b5cf17bab3c",
    "indicator": {
      "type": "none"
    },
    "stitching": {
      "mode": "adaptive",
      "params": {
        "closeWindowSeconds": 10,
        "openWindowSeconds": 10,
        "blendSeconds": 30,
        "sigmoidSteepness": 10,
        "maxAnchorAgeSeconds": 600,
        "emaHalfLifeSeconds": 57.53
      }
    },
    "resultPath": "stitchedMid"
  }
}
```

</details>

---

MIT License
