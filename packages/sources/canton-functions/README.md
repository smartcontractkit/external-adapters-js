# CANTON_FUNCTIONS

![1.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/canton-functions/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name          |                                        Description                                        |  Type  | Options | Default |
| :-------: | :-------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     |      AUTH_TOKEN       |                       JWT token for Canton JSON API authentication                        | string |         |         |
|           | BACKGROUND_EXECUTE_MS | The amount of time the background execute should sleep before performing the next request | number |         | `1000`  |
|    ✅     |          URL          |                                  The Canton JSON API URL                                  | string |         |         |
|    ✅     |      TEMPLATE_ID      |        The template ID to query contracts for (format: packageId:Module:Template)         | string |         |         |
|    ✅     |        CHOICE         |                   The non-consuming choice to exercise on the contract                    | string |         |         |
|           |       ARGUMENT        |                         The argument for the choice (JSON string)                         | string |         |         |
|           |    CONTRACT_FILTER    |          Filter to query contracts when contractId is not provided (JSON string)          | string |         |         |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |               Options                |    Default    |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------: | :-----------: |
|           | endpoint | The endpoint to use | string | [canton-data](#canton-data-endpoint) | `canton-data` |

## Canton-data Endpoint

`canton-data` is the only supported name for this endpoint.

### Input Params

| Required? |    Name    | Aliases |              Description              |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--------: | :-----: | :-----------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|           | contractId |         | The contract ID to exercise choice on | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "canton-data",
    "contractId": "00e1f5c6d8b9a7f4e3c2d1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0"
  }
}
```

---
