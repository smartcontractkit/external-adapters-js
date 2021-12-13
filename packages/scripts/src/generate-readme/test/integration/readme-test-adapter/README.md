# README Test Adapter

Version: 1.2.3

This is a fake adapter for testing, and should not be used as a template for adapters.

## Environment Variables

| Required? |     Name     |                                                Description                                                 |  Type  |          Options          |             Default              |
| :-------: | :----------: | :--------------------------------------------------------------------------------------------------------: | :----: | :-----------------------: | :------------------------------: |
|           | API_ENDPOINT |                                            API Endpoint to use                                             | string |                           | `https://test.api.endpoint.link` |
|           |   CHAIN_ID   |                                Chain ID (`1 = Mainnet`, `2 = Testnet`, ...)                                | number |                           |               `1`                |
|           |     MODE     | API Mode has `live` for live data, `sandbox` for development, and `test` for live-like environment testing | string | `live`, `sandbox`, `test` |            `sandbox`             |
|    ✅     | PRIVATE_KEY  |                                          Private subscription key                                          | string |                           |                                  |
|    ✅     |   RPC_URL    |                                            RPC Endpoint to use                                             | string |                           |                                  |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                         Options                                          |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------------------------------------------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [balance](#balance-endpoint), [marketcap](#marketcap-endpoint), [price](#price-endpoint) | `balance` |

---

## Balance Endpoint

`balance` is the only supported name for this endpoint.

### Input Params

| Required? |     Name      | Aliases | Description | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :-----------: | :-----: | :---------: | :--: | :-----: | :-----: | :--------: | :------------: |
|           |   dataPath    |         |             |      |         |         |            |                |
|           | confirmations |         |             |      |         |         |            |                |
|           |   addresses   |         |             |      |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "balance",
    "dataPath": "addresses",
    "addresses": [
      {
        "address": "3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1"
      }
    ]
  }
}
```

Response:

```json
{
  "responses": [
    {
      "status": 200,
      "title": "OK",
      "description": "Successful request",
      "payload": {
        "address": {
          "address": "3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1"
        },
        "blockchainId": "408fa195a34b533de9ad9889f076045e",
        "blockNumber": "693286",
        "timestampNanoseconds": 0,
        "value": "2188",
        "timestamp": "2021-07-29T20:54:39.000Z"
      }
    }
  ],
  "result": [
    {
      "address": "3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1",
      "chain": "mainnet",
      "coin": "btc",
      "balance": "2188"
    }
  ]
}
```

---

## Marketcap Endpoint

Supported names for this endpoint are: `marketcap`, `mc`.

### Input Params

| Required? |         Name          |    Aliases     |                   Description                    |  Type  |                         Options                          | Default  | Depends On |     Not Valid With      |
| :-------: | :-------------------: | :------------: | :----------------------------------------------: | :----: | :------------------------------------------------------: | :------: | :--------: | :---------------------: |
|    ✅     |         base          | `from`, `coin` |       The symbol of the currency to query        | string |                                                          |          |            |                         |
|    ✅     |         quote         | `to`, `market` |     The symbol of the currency to convert to     | string |                                                          |          |            |                         |
|           |        coinid         |                | The coin ID (optional to use in place of `base`) | number |                                                          |          |            | `referenceCurrencyUuid` |
|           |      resultPath       |                |             The path for the result              | string | `address`, `addresses`, `marketcap`, `result`, `results` | `result` |            |                         |
|           | referenceCurrencyUuid |                |      The reference currency UUID to utilize      | string |                                                          |          |            |        `coinid`         |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "marketcap",
    "base": "BTC",
    "quote": "USD",
    "coinid": 1,
    "resultPath": "marketcap"
  }
}
```

Response:

```json
{
  "marketcap": 1000000000,
  "result": 1000000000
}
```

<details>
<summary>Additional Examples</summary>

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "mc",
    "base": "BTC",
    "quote": "USD",
    "coinid": 2,
    "resultPath": "marketcap"
  }
}
```

Response:

```json
{
  "marketcap": 1000000000,
  "result": 1000000000
}
```

</details>

---

## Price Endpoint

Supported names for this endpoint are: `price`, `convert`.

### Input Params

| Required? |    Name    |    Aliases     |               Description                |  Type  |                       Options                        | Default  |  Depends On  | Not Valid With |
| :-------: | :--------: | :------------: | :--------------------------------------: | :----: | :--------------------------------------------------: | :------: | :----------: | :------------: |
|    ✅     |    base    | `from`, `coin` |   The symbol of the currency to query    | string |                                                      |          |              |                |
|    ✅     |   quote    | `to`, `market` | The symbol of the currency to convert to | string |                                                      |          |              |                |
|           |   amount   |    `value`     |       Amount of currency to price        | number |                                                      |          | `resultPath` |                |
|           | resultPath |                |         The path for the result          | string | `address`, `addresses`, `price`, `result`, `results` | `result` |   `amount`   |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "price",
    "base": "BTC",
    "quote": "USD",
    "amount": 1,
    "resultPath": "price"
  }
}
```

Response:

```json
{
  "price": 123456,
  "result": 123456
}
```

<details>
<summary>Additional Examples</summary>

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "convert",
    "base": "BTC",
    "quote": "USD",
    "amount": 10,
    "resultPath": "price"
  }
}
```

Response:

```json
{
  "price": 123456,
  "result": 123456
}
```

</details>
