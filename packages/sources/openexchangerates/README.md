# OPENEXCHANGERATES

![2.0.26](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/openexchangerates/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |                                    Description                                    |  Type  | Options |               Default                |
| :-------: | :----------: | :-------------------------------------------------------------------------------: | :----: | :-----: | :----------------------------------: |
|           | API_ENDPOINT |                        API endpoint for OpenExchangeRates                         | string |         | `https://openexchangerates.org/api/` |
|    ✅     |   API_KEY    | An API key that can be obtained from [here](https://openexchangerates.org/signup) | string |         |                                      |

---

## Data Provider Rate Limits

|    Name    | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |                           Note                           |
| :--------: | :-------------------------: | :-------------------------: | :-----------------------: | :------------------------------------------------------: |
| developer  |                             |                             |           13.69           |               only mentions monthly limits               |
| enterprise |                             |                             |           136.9           |                                                          |
| unlimited  |             100             |            6000             |                           | Considered unlimited tier, but setting reasonable limits |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                      Options                       | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [forex](#forex-endpoint), [price](#forex-endpoint) | `forex` |

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
    "base": "ETH",
    "quote": "USD"
  }
}
```

---

MIT License
