# Chainlink External Adapter for Etherchain (Rebranded under Beaconchain)

![1.4.46](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/etherchain/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Base URL https://beaconcha.in

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |        Default         |
| :-------: | :----------: | :---------: | :----: | :-----: | :--------------------: |
|           | API_ENDPOINT |             | string |         | `https://beaconcha.in` |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |            Options             |  Default   |
| :-------: | :------: | :-----------------: | :----: | :----------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [gasprice](#gasprice-endpoint) | `gasprice` |

## Gasprice Endpoint

`gasprice` is the only supported name for this endpoint.

### Input Params

| Required? | Name  | Aliases |    Description    |  Type  |               Options               |  Default   | Depends On | Not Valid With |
| :-------: | :---: | :-----: | :---------------: | :----: | :---------------------------------: | :--------: | :--------: | :------------: |
|           | speed |         | The desired speed | string | `fast`, `rapid`, `slow`, `standard` | `standard` |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
