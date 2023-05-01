# FINNHUB

![1.0.2](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/finnhub-test/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |            Description             |  Type  | Options |           Default           |
| :-------: | :----------: | :--------------------------------: | :----: | :-----: | :-------------------------: |
|           | API_ENDPOINT | The HTTP URL to retrieve data from | string |         | `https://finnhub.io/api/v1` |
|    ✅     |   API_KEY    |         A Finnhub API key          | string |         |                             |

---

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  |                       Options                       | Default |
| :-------: | :------: | :-----------------: | :----: | :-------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [common](#quote-endpoint), [quote](#quote-endpoint) | `quote` |

## Quote Endpoint

Supported names for this endpoint are: `common`, `quote`.

### Input Params

| Required? | Name |         Aliases          |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :----------------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `asset`, `from`, `quote` | The symbol of symbols of the currency to query | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
