# Chainlink External Adapter for Coinranking

Version: 1.1.16

This README was generated automatically. Please see [scripts](../../scripts) for more info.

## Environment Variables

| Required? |  Name   |                            Description                             |  Type  | Options | Default |
| :-------: | :-----: | :----------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     | API_KEY | An API key that can be obtained from the data provider's dashboard | string |         |         |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                       Options                                        | Default  |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint), [marketcap](#crypto-endpoint), [price](#crypto-endpoint) | `crypto` |

---

## Crypto Endpoint

https://api.coinranking.com/v2/coins

Supported names for this endpoint are: `crypto`, `marketcap`, `price`.

### Input Params

| Required? |         Name          |    Aliases     |                                  Description                                  |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-------------------: | :------------: | :---------------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |         base          | `coin`, `from` |                      The symbol of the currency to query                      | string |         |         |            |                |
|    ✅     |         quote         | `market`, `to` |                   The symbol of the currency to convert to                    | string |         |         |            |                |
|           |        coinid         |                | The coin ID to select the specific coin (in case of duplicate `from` symbols) |        |         |         |            |                |
|           | referenceCurrencyUuid |                |                      Optional UUID of the `to` currency                       | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "crypto",
    "resultPath": "price",
    "base": "ETH",
    "quote": "USD"
  }
}
```

Response:

```json
{
  "result": 4478.930333561968
}
```

<details>
<summary>Additional Examples</summary>

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "marketcap",
    "resultPath": "marketCap",
    "base": "ETH",
    "quote": "USD"
  }
}
```

Response:

```json
{
  "result": 527538906196
}
```

</details>

---
