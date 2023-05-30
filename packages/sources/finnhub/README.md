# FINNHUB

![2.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/finnhub/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |            Description             |  Type  | Options |           Default           |
| :-------: | :----------: | :--------------------------------: | :----: | :-----: | :-------------------------: |
|           | API_ENDPOINT | The HTTP URL to retrieve data from | string |         | `https://finnhub.io/api/v1` |
|    ✅     |   API_KEY    |         A Finnhub API key          | string |         |                             |

---

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  |                                                 Options                                                 | Default |
| :-------: | :------: | :-----------------: | :----: | :-----------------------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [common](#quote-endpoint), [forex](#quote-endpoint), [quote](#quote-endpoint), [stock](#quote-endpoint) | `quote` |

## Quote Endpoint

Supported names for this endpoint are: `common`, `forex`, `quote`, `stock`.

### Input Params

| Required? | Name |         Aliases          |                 Description                  |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :----------------------: | :------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `asset`, `from`, `quote` | The symbol of the currency or asset to query | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "base": "AAPL"
  }
}
```

Response:

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {
    "c": 244.59,
    "h": 258.25,
    "l": 244.3,
    "o": 250.75,
    "pc": 246.88,
    "t": 1585143000,
    "result": 244.59
  },
  "result": 244.59,
  "statusCode": 200
}
```

---

MIT License
