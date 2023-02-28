# Chainlink External Adapter for TrueUSD

![1.6.16](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/trueusd/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Base URL https://api.real-time-attest.trustexplorer.io

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |                       Default                        |
| :-------: | :----------: | :---------: | :----: | :-----: | :--------------------------------------------------: |
|           | API_ENDPOINT |             | string |         | `https://core-api.real-time-attest.trustexplorer.io` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [trueusd](#trueusd-endpoint) | `trueusd` |

## Trueusd Endpoint

https://api.real-time-attest.trustexplorer.io/chainlink/proof-of-reserves/TrueUSD

`trueusd` is the only supported name for this endpoint.

### Input Params

| Required? | Name  | Aliases |                                                   Description                                                    |  Type  | Options |   Default    | Depends On | Not Valid With |
| :-------: | :---: | :-----: | :--------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :----------: | :--------: | :------------: |
|           | chain |         |                                        Filter data to a single blockchain                                        | string |         |              |            |                |
|           | field |         | The object-path string to parse a single `result` value. When not provided the entire response will be provided. | string |         | `totalTrust` |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
