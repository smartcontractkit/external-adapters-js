# Chainlink External Adapter for 1Forge

![1.6.37](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/1forge/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Base URL https://api.1forge.com/

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |                        Description                        |  Type  | Options |          Default          |
| :-------: | :----------: | :-------------------------------------------------------: | :----: | :-----: | :-----------------------: |
|    ✅     |   API_KEY    | An API key that can be obtained from the 1Forge dashboard | string |         |                           |
|           | API_ENDPOINT |                                                           | string |         | `https://api.1forge.com/` |

---

## Data Provider Rate Limits

|   Name    | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |            Note            |
| :-------: | :-------------------------: | :-------------------------: | :-----------------------: | :------------------------: |
|  starter  |                             |                             |          208.33           | https://1forge.com/pricing |
|  premium  |                             |                             |          4166.66          |                            |
| business  |                             |                             |         41666.66          |                            |
| business+ |                             |                             |         416666.66         |                            |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                                    Options                                                     | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [convert](#convert-endpoint), [forex](#quotes-endpoint), [price](#quotes-endpoint), [quotes](#quotes-endpoint) | `quotes` |

## Quotes Endpoint

Returns a batched price comparison from a list currencies to a list of other currencies.

[`/quotes`](https://1forge.com/api#quotes) - Convert from one currency to another.

**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `quotes` endpoint instead.**

Supported names for this endpoint are: `forex`, `price`, `quotes`.

### Input Params

| Required? | Name  | Aliases |               Description                | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :-----: | :--------------------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `from`  |   The symbol of the currency to query    |      |         |         |            |                |
|    ✅     | quote |  `to`   | The symbol of the currency to convert to |      |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "base": "USD",
    "quote": "EUR",
    "endpoint": "quotes"
  },
  "debug": {
    "cacheKey": "7bgmviEbqyIiUCIfawMxKPrtU7Y=",
    "batchCacheKey": "sd6ZPVkDqkZ6Jd06Y/63s1xaO58=",
    "batchChildrenCacheKeys": [
      [
        "7bgmviEbqyIiUCIfawMxKPrtU7Y=",
        {
          "id": "1",
          "data": {
            "base": "USD",
            "quote": "EUR",
            "endpoint": "quotes"
          }
        }
      ]
    ]
  },
  "rateLimitMaxAge": 38400
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "payload": [
      {
        "p": 0.8828,
        "a": 0.8828,
        "b": 0.8827,
        "s": "USD/EUR",
        "t": 1641851954307
      }
    ],
    "result": 0.8828
  },
  "result": 0.8828,
  "statusCode": 200,
  "debug": {
    "batchablePropertyPath": [
      {
        "name": "base"
      },
      {
        "name": "quote"
      }
    ]
  },
  "providerStatusCode": 200
}
```

---

## Convert Endpoint

[`/convert`](https://1forge.com/api#convert) - Convert from one currency to another.

`convert` is the only supported name for this endpoint.

### Input Params

| Required? |   Name   | Aliases |                  Description                  |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :------: | :-----: | :-------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |   base   | `from`  |      The symbol of the currency to query      | string |         |         |            |                |
|    ✅     |  quote   |  `to`   |   The symbol of the currency to convert to    | string |         |         |            |                |
|           | quantity |         | An additional amount of the original currency | number |         |   `1`   |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "base": "USD",
    "quote": "EUR",
    "quantity": 1,
    "endpoint": "convert"
  },
  "debug": {
    "cacheKey": "EbMPGiWl2oE1AmSzqMaVAMCtj3I="
  },
  "rateLimitMaxAge": 19200
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "value": "0.862701",
    "text": "1 USD is worth 0.862701 EUR",
    "timestamp": 1636478097478,
    "result": 0.862701
  },
  "result": 0.862701,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
