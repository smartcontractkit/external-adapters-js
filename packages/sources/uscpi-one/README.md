# Chainlink External Adapter for US Consumer Price Index (USCPI)

![1.3.27](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/uscpi-one/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Base URL https://api.bls.gov/publicAPI/v2

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |              Description               |  Type  | Options | Default |
| :-------: | :----------: | :------------------------------------: | :----: | :-----: | :-----: |
|           | API_ENDPOINT |                                        |        |         |         |
|           |   API_KEY    | An optional API key to increase limits | string |         |         |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |          Options           | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [series](#series-endpoint) | `series` |

## Series Endpoint

`series` is the only supported name for this endpoint.

### Input Params

| Required? | Name  | Aliases |                                                   Description                                                   |  Type  | Options |    Default    | Depends On | Not Valid With |
| :-------: | :---: | :-----: | :-------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----------: | :--------: | :------------: |
|           | serie |         |                           The US CPI Data serieID (`CUSR0000SA0`, `LNS14000000`, etc)                           | string |         | `CUSR0000SA0` |            |                |
|           | year  |         | The year serie filter (`2021`, `2020`, etc). It is mandatory to specify the `month` and `year` values together. | string |         |               |            |                |
|           | month |         |  The month serie filter `may`, `july`, etc. It is mandatory to specify the `month` and `year` values together.  | string |         |               |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
