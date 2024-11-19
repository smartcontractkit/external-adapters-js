# IEXCLOUD

![2.0.28](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/iex-cloud/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |                                       Description                                       |  Type  | Options |              Default               |
| :-------: | :----------: | :-------------------------------------------------------------------------------------: | :----: | :-----: | :--------------------------------: |
|           | API_ENDPOINT |                               API endpoint for iex-cloud                                | string |         | `https://cloud.iexapis.com/stable` |
|    ✅     |   API_KEY    | An API key that can be obtained from [here](https://iexcloud.io/cloud-login#/register/) | string |         |                                    |

---

## Data Provider Rate Limits

|    Name    | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |            Note             |
| :--------: | :-------------------------: | :-------------------------: | :-----------------------: | :-------------------------: |
| individual |                             |                             |       6944.44444444       | only mentions monthly limit |
|  business  |                             |                             |       208333.333333       | only mentions monthly limit |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                              Options                                                              | Default |
| :-------: | :------: | :-----------------: | :----: | :-------------------------------------------------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint), [eod-close](#eod-endpoint), [eod](#eod-endpoint), [price](#crypto-endpoint), [stock](#stock-endpoint) | `stock` |

## Crypto Endpoint

Supported names for this endpoint are: `crypto`, `price`.

### Input Params

| Required? | Name  |              Aliases              |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :-------------------------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `asset`, `coin`, `from`, `symbol` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote |          `market`, `to`           |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "crypto",
    "base": "ETH",
    "quote": "USD"
  }
}
```

---

## Stock Endpoint

`stock` is the only supported name for this endpoint.

### Input Params

| Required? | Name |                   Aliases                   |        Description        |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :-----------------------------------------: | :-----------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `asset`, `coin`, `from`, `symbol`, `ticker` | The stock ticker to query | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "stock",
    "base": "USD"
  }
}
```

---

## Eod Endpoint

Supported names for this endpoint are: `eod`, `eod-close`.

### Input Params

| Required? | Name |                   Aliases                   |        Description        |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :-----------------------------------------: | :-----------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `asset`, `coin`, `from`, `symbol`, `ticker` | The stock ticker to query | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "eod",
    "base": "USD"
  }
}
```

---

MIT License
