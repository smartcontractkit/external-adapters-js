# Chainlink External Adapter for Twelvedata

![1.4.14](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/twelvedata/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

`closing` endpoint provides the closing price of the previous day as detailed in [Twelvedata documentation](https://twelvedata.com/docs#end-of-day-price).

`price` endpoint provides the real-time price as detailed in [Twelvedata documentation](https://twelvedata.com/docs#real-time-price).

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |           Description            |  Type  | Options |            Default            |
| :-------: | :----------: | :------------------------------: | :----: | :-----: | :---------------------------: |
|    ✅     |   API_KEY    |      API key for Twelvedata      | string |         |                               |
|           | API_ENDPOINT | The endpoint for your Twelvedata | string |         | `https://api.twelvedata.com/` |

---

## Data Provider Rate Limits

|    Name     | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |         Note         |
| :---------: | :-------------------------: | :-------------------------: | :-----------------------: | :------------------: |
|    basic    |                             |              8              |       33.3333333333       | 800 API requests/day |
|    grow1    |                             |             55              |                           |                      |
|    grow2    |                             |             144             |                           |                      |
|    grow3    |                             |             377             |                           |                      |
|    pro1     |                             |             610             |                           |                      |
|    pro2     |                             |             987             |                           |                      |
|    pro3     |                             |            1597             |                           |                      |
| enterprise1 |                             |                             |           2584            |                      |
| enterprise2 |                             |                             |           4181            |                      |
| enterprise3 |                             |                             |           10946           |                      |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                                                                                      Options                                                                                                       |  Default  |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [closing](#closing-endpoint), [crypto](#price-endpoint), [eod](#closing-endpoint), [etf](#price-endpoint), [forex](#price-endpoint), [price](#price-endpoint), [stock](#price-endpoint), [uk_etf](#price-endpoint) | `closing` |

## Closing Endpoint

This `closing` endpoint provides the closing price of the previous day as detailed in [Twelvedata documentation](https://twelvedata.com/docs#end-of-day-price).

Supported names for this endpoint are: `closing`, `eod`.

### Input Params

| Required? | Name |                   Aliases                    |             Description             |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :------------------------------------------: | :---------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `coin`, `from`, `market`, `symbol`, `uk_etf` | The symbol of the currency to query | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Price Endpoint

This `price` endpoint provides the real-time price as detailed in [Twelvedata documentation](https://twelvedata.com/docs#real-time-price).

Supported names for this endpoint are: `crypto`, `etf`, `forex`, `price`, `stock`, `uk_etf`.

### Input Params

| Required? | Name |                   Aliases                    |             Description             |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :------------------------------------------: | :---------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `coin`, `from`, `market`, `symbol`, `uk_etf` | The symbol of the currency to query | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
