# Chainlink External Adapter for 1forge

Version: 1.4.15

This README was generated automatically. Please see [scripts](../../scripts) for more info.

## Environment Variables

| Required? |  Name   |                        Description                        |  Type  | Options | Default |
| :-------: | :-----: | :-------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     | API_KEY | An API key that can be obtained from the 1forge dashboard | string |         |         |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                    Options                                                     | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [convert](#convert-endpoint), [forex](#quotes-endpoint), [price](#quotes-endpoint), [quotes](#quotes-endpoint) | `quotes` |

---

## Quotes Endpoint

Returns a batched price comparison from a list currencies to a list of other currencies.

[`/quotes`](https://1forge.com/api#quotes) - Convert from one currency to another.

**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `quotes` endpoint instead.**

Supported names for this endpoint are: `forex`, `price`, `quotes`.

### Input Params

| Required? |   Name   |    Aliases     | Description | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :------: | :------------: | :---------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |   base   | `base`, `from` |             |      |         |         |            |                |
|    ✅     |  quote   | `quote`, `to`  |             |      |         |         |            |                |
|           | quantity |                |             |      |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "quotes",
    "base": "USD",
    "quote": "EUR"
  }
}
```

Response:

```json
{
  "result": 0.8828
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
    "endpoint": "convert",
    "base": "USD",
    "quote": "EUR",
    "quantity": 1
  }
}
```

Response:

```json
{
  "result": 0.862701
}
```

---
