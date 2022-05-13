# Chainlink Fixer External Adapter

![1.3.32](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/fixer/package.json)

This adapter is for [Fixer.io](https://fixer.io/) and supports the convert endpoint.

Base URL https://data.fixer.io

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |         Default         |
| :-------: | :----------: | :---------: | :----: | :-----: | :---------------------: |
|    ✅     |   API_KEY    |             | string |         |                         |
|           | API_ENDPOINT |             | string |         | `https://data.fixer.io` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                                    Options                                                     |  Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------------------------------------------------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [convert](#convert-endpoint), [forex](#latest-endpoint), [latest](#latest-endpoint), [price](#latest-endpoint) | `convert` |

## Convert Endpoint

`convert` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  |    Aliases     |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  base  | `coin`, `from` |   The symbol of the currency to query    | string |         |         |            |                |
|    ✅     | quote  | `market`, `to` | The symbol of the currency to convert to | string |         |         |            |                |
|           | amount |                |      The amount of `base` currency       | number |         |   `1`   |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "base": "EUR",
    "quote": "USD"
  },
  "debug": {
    "cacheKey": "55c3992cf1e9d0cd4f70dc1b3cea317c1fd9dbe2"
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
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
  },
  "result": 0.862805,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

## Latest Endpoint

Returns a batched price comparison from one currency to a list of other currencies.

Supported names for this endpoint are: `forex`, `latest`, `price`.

### Input Params

| Required? | Name  |    Aliases     |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` |   The symbol of the currency to query    | string |         |         |            |                |
|    ✅     | quote | `market`, `to` | The symbol of the currency to convert to | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "latest",
    "base": "EUR",
    "quote": "USD"
  },
  "debug": {
    "cacheKey": "7c1830561a48c6c99d6fa92ca28dfea45b0307c1"
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "success": true,
    "timestamp": 1646446742,
    "base": "EUR",
    "date": "2022-03-05",
    "rates": {
      "USD": 1.094769
    },
    "result": 1.094769
  },
  "result": 1.094769,
  "statusCode": 200,
  "debug": {
    "batchablePropertyPath": [
      {
        "name": "quote"
      }
    ]
  },
  "providerStatusCode": 200
}
```

---

MIT License
