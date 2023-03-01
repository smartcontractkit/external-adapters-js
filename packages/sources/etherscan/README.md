# Chainlink External Adapter for EtherScan

![1.3.27](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/etherscan/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Base URL https://api.etherscan.io

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |  Name   |                            Description                            |  Type  | Options |          Default           |
| :-------: | :-----: | :---------------------------------------------------------------: | :----: | :-----: | :------------------------: |
|    ✅     | API_KEY | An API key that can be obtained [here](https://etherscan.io/apis) | string |         | `https://api.etherscan.io` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |            Options             |  Default   |
| :-------: | :------: | :-----------------: | :----: | :----------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [gasprice](#gasprice-endpoint) | `gasprice` |

## Gasprice Endpoint

`gasprice` is the only supported name for this endpoint.

### Input Params

| Required? | Name  | Aliases |    Description    |  Type  |         Options          | Default | Depends On | Not Valid With |
| :-------: | :---: | :-----: | :---------------: | :----: | :----------------------: | :-----: | :--------: | :------------: |
|           | speed |         | The desired speed | string | `fast`, `medium`, `safe` | `fast`  |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
