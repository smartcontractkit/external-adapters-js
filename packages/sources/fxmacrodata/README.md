# FXMACRODATA

![0.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/fxmacrodata/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Data Provider

[FXMacroData](https://fxmacrodata.com/?utm_source=github&utm_medium=referral&utm_campaign=external-adapters-js&utm_content=readme) publishes daily FX reference rates and macroeconomic releases sourced from central banks and national statistics agencies.

- The `forex` endpoint returns the most recent daily reference rate for `base`/`quote`. `providerIndicatedTimeUnixMs` is the observation date of that rate.
- The `indicator` endpoint returns the most recent released value of a macroeconomic indicator (for example `inflation` or `policy_rate`) for a currency. `providerIndicatedTimeUnixMs` is the release time of that value. Indicator names for each currency are listed at `GET /v1/data_catalogue/{currency}`.

## Environment Variables

| Required? |      Name      |                        Description                         |  Type  | Options |             Default              |
| :-------: | :------------: | :--------------------------------------------------------: | :----: | :-----: | :------------------------------: |
|    ✅     |   `API_KEY`    | An API key for FXMacroData, sent in the `X-API-Key` header | string |         |                                  |
|           | `API_ENDPOINT` |                API endpoint for FXMacroData                | string |         | `https://api.fxmacrodata.com/v1` |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |    Note     |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :---------: |
| default |                             |             300             |           5000            | Per API key |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                       Options                                        | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [forex](#forex-endpoint), [indicator](#indicator-endpoint), [price](#forex-endpoint) | `forex` |

## Forex Endpoint

Supported names for this endpoint are: `forex`, `price`.

### Input Params

| Required? | Name  |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "forex",
    "base": "EUR",
    "quote": "USD"
  }
}
```

---

## Indicator Endpoint

`indicator` is the only supported name for this endpoint.

### Input Params

| Required? |   Name    | Aliases |                                Description                                 |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-------: | :-----: | :------------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | currency  |         |       The three-letter code of the currency the indicator belongs to       | string |         |         |            |                |
|    ✅     | indicator |         | The name of the macroeconomic indicator, e.g. `inflation` or `policy_rate` | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "indicator",
    "currency": "USD",
    "indicator": "inflation"
  }
}
```

---

MIT License
