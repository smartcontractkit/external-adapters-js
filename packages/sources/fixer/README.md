# Chainlink Fixer External Adapter

Version: 1.2.1

This adapter is for [Fixer.io](https://fixer.io/) and supports the convert endpoint.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |         Default         |
| :-------: | :----------: | :---------: | :----: | :-----: | :---------------------: |
|    ✅     |   API_KEY    |             | string |         |                         |
|           | API_ENDPOINT |             | string |         | `https://data.fixer.io` |

---

## Input Parameters

| Required? |   Name   |     Description     |                         Options                         | Defaults to |
| :-------: | :------: | :-----------------: | :-----------------------------------------------------: | :---------: |
|           | endpoint | The endpoint to use | [convert](#Convert-Endpoint) [latest](#Latest-Endpoint) |   latest    |

---

## Convert Endpoint

### Input Params

| Required? |          Name           |                        Description                        |                                       Options                                        | Defaults to |
| :-------: | :---------------------: | :-------------------------------------------------------: | :----------------------------------------------------------------------------------: | :---------: |
|    ✅     | `base`, `from`, `coin`  |            The symbol of the currency to query            |                                                                                      |             |
|    ✅     | `quote`, `to`, `market` |         The symbol of the currency to convert to          |                                                                                      |             |
|    🟡     |        `amount`         |               The amount of `base` currency               |                                                                                      |      1      |
|    🟡     |       `overrides`       | If base provided is found in overrides, that will be used | [Format](../../core/bootstrap/src/lib/external-adapter/overrides/presetSymbols.json) |             |

## Output

```json
{
  "jobRunID": "1",
  "data": {
    "success": true,
    "query": {
      "from": "GBP",
      "to": "JPY",
      "amount": 1
    },
    "info": {
      "timestamp": 1519328414,
      "rate": 148.972231
    },
    "historical": "",
    "date": "2018-02-22",
    "result": 148.972231
  },
  "result": 148.972231,
  "statusCode": 200
}
```

## Latest Endpoint

Supported names for this endpoint are: `convert`, `price`.

### Input Params

| Required? |  Name  |    Aliases     |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  base  | `from`, `coin` |   The symbol of the currency to query    | string |         |         |            |                |
|    ✅     | quote  | `to`, `market` | The symbol of the currency to convert to | string |         |         |            |                |
|           | amount |                |      The amount of `base` currency       | number |         |   `1`   |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "base": "EUR",
    "quote": "USD"
  }
}
```

Response:

```json
{
  "success": true,
  "query": {
    "from": "USD",
    "to": "EUR",
    "amount": 1
  },
  "info": {
    "timestamp": 1636390923,
    "rate": 0.862805
  },
  "date": "2021-11-08",
  "result": 0.862805
}
```

---

## Latest Endpoint

`latest` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  |         Aliases         | Description | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :---------------------: | :---------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  base  | `base`, `from`, `coin`  |             |      |         |         |            |                |
|    ✅     | quote  | `quote`, `to`, `market` |             |      |         |         |            |                |
|           | amount |                         |             |      |         |         |            |                |

There are no examples for this endpoint.
