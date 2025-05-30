# Chainlink External Adapter for EthGasStation

![1.4.45](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/ethgasstation/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Base URL https://ethgasstation.info/

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |             Default              |
| :-------: | :----------: | :---------: | :----: | :-----: | :------------------------------: |
|    ✅     |   API_KEY    |             | string |         |                                  |
|           | API_ENDPOINT |             | string |         | `https://data-api.defipulse.com` |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |                                                           Note                                                            |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :-----------------------------------------------------------------------------------------------------------------------: |
|  trial  |                             |                             |           1.34            |   Taken from the API key limit as 1,000 / 31 / 24 (EGS uses Defi Pulse's API keys): https://data.defipulse.com/#pricing   |
| starter |                             |                             |          1344.08          | Taken from the API key limit as 1,000,000 / 31 / 24 (EGS uses Defi Pulse's API keys): https://data.defipulse.com/#pricing |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |            Options             |  Default   |
| :-------: | :------: | :-----------------: | :----: | :----------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [gasprice](#gasprice-endpoint) | `gasprice` |

## Gasprice Endpoint

`gasprice` is the only supported name for this endpoint.

### Input Params

| Required? | Name  | Aliases |    Description    |  Type  |                 Options                 |  Default  | Depends On | Not Valid With |
| :-------: | :---: | :-----: | :---------------: | :----: | :-------------------------------------: | :-------: | :--------: | :------------: |
|           | speed |         | The desired speed | string | `average`, `fast`, `fastest`, `safeLow` | `average` |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
