# ALPHAVANTAGE

![2.0.14](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/alphavantage/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |                                        Description                                        |  Type  | Options |               Default               |
| :-------: | :----------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :---------------------------------: |
|           | API_ENDPOINT |                            The HTTP URL to retrieve data from                             | string |         | `https://www.alphavantage.co/query` |
|    ✅     |   API_KEY    | An API key that can be obtained from [here](https://www.alphavantage.co/support/#api-key) | string |         |                                     |

---

## Data Provider Rate Limits

|  Name  | Requests/credits per second | Requests/credits per minute | Requests/credits per hour | Note |
| :----: | :-------------------------: | :-------------------------: | :-----------------------: | :--: |
|  free  |                             |              5              |           20.83           |      |
| 49.99  |                             |             75              |                           |      |
| 99.99  |                             |             150             |                           |      |
| 149.99 |                             |             300             |                           |      |
| 199.99 |                             |             600             |                           |      |
| 249.99 |                             |            1200             |                           |      |

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
    "base": "GBP",
    "quote": "USD"
  }
}
```

---

MIT License
