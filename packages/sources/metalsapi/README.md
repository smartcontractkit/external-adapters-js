# Chainlink External Adapter for [MetalsAPI](https://metals-api.com/documentation#convertcurrency)

Version: 1.6.14

This README was generated automatically. Please see [scripts](../../scripts) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |           Default           |
| :-------: | :----------: | :---------: | :----: | :-----: | :-------------------------: |
|    ✅     |   API_KEY    |             | string |         |                             |
|           | API_ENDPOINT |             | string |         | `https://some_endpoint.com` |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                       Options                                        | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [convert](#convert-endpoint), [forex](#convert-endpoint), [latest](#latest-endpoint) | `forex` |

---

## Convert Endpoint

Supported names for this endpoint are: `convert`, `forex`.

### Input Params

| Required? |  Name  |    Aliases     |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  base  | `coin`, `from` |   The symbol of the currency to query    |        |         |         |            |                |
|    ✅     | quote  | `market`, `to` | The symbol of the currency to convert to |        |         |         |            |                |
|           | amount |                |    The amount of the `base` currency     | number |         |   `1`   |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "convert",
    "base": "XAU",
    "quote": "USD",
    "amount": 1
  },
  "rateLimitMaxAge": 58823529
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "success": true,
    "query": {
      "from": "XAU",
      "to": "USD",
      "amount": 1
    },
    "info": {
      "timestamp": 1637949420,
      "rate": 1785.0181286441143
    },
    "historical": false,
    "date": "2021-11-26",
    "result": 1785.0181286441143,
    "unit": "per ounce"
  },
  "result": 1785.0181286441143,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

## Latest Endpoint

Returns a batched price comparison from one currency to a list of other currencies.

`latest` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |    Aliases     |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` |   The symbol of the currency to query    | string |         |         |            |                |
|    ✅     | quote | `market`, `to` | The symbol of the currency to convert to |        |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "latest",
    "base": "XAU",
    "quote": "USD"
  },
  "rateLimitMaxAge": 117647058
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "success": true,
    "timestamp": 1641990900,
    "date": "2022-01-12",
    "base": "XAU",
    "rates": {
      "USD": 1817.0552439305814
    },
    "unit": "per ounce",
    "result": 1817.0552439305814
  },
  "result": 1817.0552439305814,
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

<details>
<summary>Additional Examples</summary>

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "latest",
    "base": "BTC",
    "quote": ["USD", "XAU"]
  },
  "rateLimitMaxAge": 176470588
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "success": true,
    "timestamp": 1641990180,
    "date": "2022-01-12",
    "base": "BTC",
    "rates": {
      "XAU": 0.04228229144046888,
      "USD": 42968.36778447169
    },
    "unit": "per ounce",
    "results": [
      [
        {
          "id": "1",
          "data": {
            "endpoint": "latest",
            "base": "BTC",
            "quote": "USD"
          },
          "rateLimitMaxAge": 176470588
        },
        42968.36778447169
      ],
      [
        {
          "id": "1",
          "data": {
            "endpoint": "latest",
            "base": "BTC",
            "quote": "XAU"
          },
          "rateLimitMaxAge": 176470588
        },
        0.04228229144046888
      ]
    ]
  },
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

</details>

---
