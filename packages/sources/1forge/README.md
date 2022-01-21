# Chainlink External Adapter for 1forge

Version: 1.3.1

##### NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `forex` endpoint instead. [`/convert`](https://1forge.com/api#convert) - Convert from one currency to another

## Environment Variables

| Required? |  Name   |                        Description                        |  Type  | Options | Default |
| :-------: | :-----: | :-------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     | API_KEY | An API key that can be obtained from the 1forge dashboard | string |         |         |

---

## Input Parameters

| Required? |   Name   |     Description     |                         Options                          | Defaults to |
| :-------: | :------: | :-----------------: | :------------------------------------------------------: | :---------: |
|           | endpoint | The endpoint to use | [quotes](#Quotes-Endpoint), [convert](#Convert-Endpoint) |   convert   |

---

## Convert Endpoint

[`/convert`](https://1forge.com/api#convert) - Convert from one currency to another

### Input Params

| Required? |      Name      |                        Description                        |                                       Options                                        | Defaults to |
| :-------: | :------------: | :-------------------------------------------------------: | :----------------------------------------------------------------------------------: | :---------: |
|    ✅     | `base`, `from` |            The symbol of the currency to query            |                       [List](https://1forge.com/currency-list)                       |             |
|    ✅     | `quote`, `to`  |         The symbol of the currency to convert to          |                       [List](https://1forge.com/currency-list)                       |             |
|    🟡     |   `quantity`   |       An additional amount of the original currency       |                                                                                      |             |
|    🟡     |  `overrides`   | If base provided is found in overrides, that will be used | [Format](../../core/bootstrap/src/lib/external-adapter/overrides/presetSymbols.json) |             |

### Output

```json
{
  "jobRunID": "1",
  "data": {
    "value": 1.22687,
    "text": "1.0 GBP is worth 1.22687 USD",
    "timestamp": 1587489920,
    "result": 1.22687
  },
  "result": 1.22687,
  "statusCode": 200
}
```

## Quotes Endpoint

##### NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `quotes` endpoint instead.

#### Returns a batched price comparison from a list currencies to a list of other currencies.

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "price",
    "base": "USD",
    "quote": "EUR",
    "quantity": 1
  }
}
```

Response:

```json
{
  "value": "0.862701",
  "text": "1 USD is worth 0.862701 EUR",
  "timestamp": 1636478097478,
  "result": 0.862701
}
```

---

## Quotes Endpoint

`quotes` is the only supported name for this endpoint.

### Input Params

| Required? |   Name   |    Aliases     | Description | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :------: | :------------: | :---------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |   base   | `base`, `from` |             |      |         |         |            |                |
|    ✅     |  quote   | `quote`, `to`  |             |      |         |         |            |                |
|           | quantity |                |             |      |         |         |            |                |

There are no examples for this endpoint.
