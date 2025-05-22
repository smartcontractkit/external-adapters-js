# Chainlink External Adapter for EOD Historical Data

![1.5.14](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/eodhistoricaldata/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |             Default             |
| :-------: | :----------: | :---------: | :----: | :-----: | :-----------------------------: |
|    ✅     |   API_KEY    |             | string |         |                                 |
|           | API_ENDPOINT |             | string |         | `https://eodhistoricaldata.com` |

---

## Data Provider Rate Limits

| Name | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |             Note              |
| :--: | :-------------------------: | :-------------------------: | :-----------------------: | :---------------------------: |
| all  |                             |                             |          4166.66          | all feeds have the same limit |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                    Options                                    | Default |
| :-------: | :------: | :-----------------: | :----: | :---------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [price](#stock-endpoint), [stock](#stock-endpoint), [uk_etf](#stock-endpoint) | `stock` |

## Stock Endpoint

**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `stock` endpoint instead.**

Supported names for this endpoint are: `price`, `stock`, `uk_etf`.

### Input Params

| Required? | Name |                  Aliases                   |                                                       Description                                                        |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :----------------------------------------: | :----------------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `asset`, `etf`, `from`, `symbol`, `uk_etf` | The symbol of the currency to query taken from [here](https://eodhistoricaldata.com/financial-apis/category/data-feeds/) | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
