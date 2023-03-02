# Chainlink External Adapter for the Bureau of Economic Analysis (BEA)

![1.3.27](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/bea/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Base URL https://apps.bea.gov/api

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |                            Description                             |  Type  | Options |          Default           |
| :-------: | :----------: | :----------------------------------------------------------------: | :----: | :-----: | :------------------------: |
|           | API_ENDPOINT |                                                                    | string |         | `https://apps.bea.gov/api` |
|    ✅     |   API_KEY    | An API key that can be obtained from the data provider's dashboard | string |         |                            |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [average](#average-endpoint) | `average` |

## Average Endpoint

`average` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  | Aliases |                     Description                     |  Type  | Options | Default  | Depends On | Not Valid With |
| :-------: | :----: | :-----: | :-------------------------------------------------: | :----: | :-----: | :------: | :--------: | :------------: |
|           | series |         | The series code to query (`DGDSRG`, `DPCERG`, etc.) | string |         | `DPCERG` |            |                |
|           |  last  |         |             The last N months to query              | number |         |   `3`    |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
