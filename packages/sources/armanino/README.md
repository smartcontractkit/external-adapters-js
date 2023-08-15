# ARMANINO

![3.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/armanino/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |     Description     |  Type  | Options |                                   Default                                   |
| :-------: | :----------: | :-----------------: | :----: | :-----: | :-------------------------------------------------------------------------: |
|           | API_ENDPOINT | API Endpoint to use | string |         | `https://api.oracle-services.ledgerlens.io/v1/chainlink/proof-of-reserves/` |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour | Note |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :--: |
| default |                             |              6              |                           |      |

---

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  |                                  Options                                  | Default |
| :-------: | :------: | :-----------------: | :----: | :-----------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [balance](#mco2-endpoint), [mco2](#mco2-endpoint), [stbt](#stbt-endpoint) | `mco2`  |

## Mco2 Endpoint

Supported names for this endpoint are: `balance`, `mco2`.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "mco2",
    "resultPath": "totalMCO2"
  },
  "debug": {
    "cacheKey": "jma96ZQNYh/skkagk8dl7s6liBk="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "totalMCO2": 3041044,
    "totalCarbonCredits": 3041044,
    "timestamp": "2022-04-04T11:00:46.577Z",
    "result": 3041044
  },
  "result": 3041044,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

## Stbt Endpoint

`stbt` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "stbt"
  },
  "debug": {
    "cacheKey": "CCIV2Xuznjfw8o52RhBO3ncL2cU="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "accountName": "STBT",
    "totalReserve": 72178807.56,
    "totalToken": 71932154.99,
    "timestamp": "2023-06-02T12:53:23.604Z",
    "result": 72178807.56
  },
  "result": 72178807.56,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
