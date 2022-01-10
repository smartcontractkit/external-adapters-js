# Chainlink External Adapter for 1forge

Version: 1.3.1

##### NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `forex` endpoint instead. [`/convert`](https://1forge.com/api#convert) - Convert from one currency to another

## Environment Variables

| Required? |  Name   |                        Description                        |  Type  | Options | Default |
| :-------: | :-----: | :-------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     | API_KEY | An API key that can be obtained from the 1forge dashboard | string |         |         |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                       Options                        | Default |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [forex](#forex-endpoint), [quotes](#quotes-endpoint) | `forex` |

---

## Forex Endpoint

Supported names for this endpoint are: `price`, `forex`.

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
