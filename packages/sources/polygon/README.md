# POLYGON

![2.0.27](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/polygon/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |                                   Description                                    |  Type  | Options |         Default          |
| :-------: | :----------: | :------------------------------------------------------------------------------: | :----: | :-----: | :----------------------: |
|           | API_ENDPOINT |                        The HTTP URL to retrieve data from                        | string |         | `https://api.polygon.io` |
|    ✅     |   API_KEY    | An API key that can be obtained from [here](https://polygon.io/dashboard/signup) | string |         |                          |

---

## Data Provider Rate Limits

|    Name    | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |                           Note                           |
| :--------: | :-------------------------: | :-------------------------: | :-----------------------: | :------------------------------------------------------: |
|    free    |                             |              5              |                           |               only mentions monthly limits               |
|  starter   |             100             |                             |                           | Considered unlimited tier, but setting reasonable limits |
| developer  |             100             |                             |                           | Considered unlimited tier, but setting reasonable limits |
|  advanced  |             100             |                             |                           | Considered unlimited tier, but setting reasonable limits |
| enterprise |             100             |                             |                           | Considered unlimited tier, but setting reasonable limits |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                         Options                                                          |  Default  |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------------------------------------------------------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [conversion](#conversion-endpoint), [forex](#tickers-endpoint), [price](#tickers-endpoint), [tickers](#tickers-endpoint) | `tickers` |

## Tickers Endpoint

Supported names for this endpoint are: `forex`, `price`, `tickers`.

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
    "endpoint": "tickers",
    "base": "USD",
    "quote": "GBP"
  }
}
```

---

## Conversion Endpoint

`conversion` is the only supported name for this endpoint.

### Input Params

| Required? |   Name    |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-------: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |   base    | `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     |   quote   | `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |
|           |  amount   |                |      The amount of the `base` to convert       | number |         |   `1`   |            |                |
|           | precision |                |  The number of significant figures to include  | number |         |   `6`   |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "conversion",
    "base": "GBP",
    "quote": "USD",
    "amount": 1,
    "precision": 6
  }
}
```

---

MIT License
