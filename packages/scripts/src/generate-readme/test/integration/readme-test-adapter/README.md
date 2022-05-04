# README Test Adapter

![1.2.14](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/scripts/src/generate-readme/test/integration/readme-test-adapter/package.json)

This is a fake adapter for testing, and should not be used as a template for adapters.

Base URL https://test.api.endpoint.link

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

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

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                                                     Options                                                                     |  Default  |
| :-------: | :------: | :-----------------: | :----: | :---------------------------------------------------------------------------------------------------------------------------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [balance](#balance-endpoint), [convert](#price-endpoint), [marketcap](#marketcap-endpoint), [mc](#marketcap-endpoint), [price](#price-endpoint) | `balance` |

## Balance Endpoint

Balance endpoint for test adapter

`balance` is the only supported name for this endpoint.

### Input Params

| Required? |     Name      | Aliases |                        Description                         |  Type  | Options | Default  | Depends On | Not Valid With |
| :-------: | :-----------: | :-----: | :--------------------------------------------------------: | :----: | :-----: | :------: | :--------: | :------------: |
|    ✅     |   addresses   |         | Array of objects with address information as defined below | array  |         |          |            |                |
|           | confirmations |         |                  Confirmations parameter                   | number |         |   `6`    |            |                |
|           |   dataPath    |         |           Path where to find the addresses array           | string |         | `result` |            |                |

Address objects within `addresses` have the following properties:

| Required? |  Name   |                 Description                  |  Type  |                    Options                    |  Default  |
| :-------: | :-----: | :------------------------------------------: | :----: | :-------------------------------------------: | :-------: |
|    ✅     | address |               Address to query               | string |                                               |           |
|           |  chain  | Chain to query (Ethereum testnet is Rinkeby) | string |             `mainnet`, `testnet`              | `mainnet` |
|           |  coin   |              Currency to query               | string | Ex. `bch`, `btc`, `btsv`, `eth`, `ltc`, `zec` |   `btc`   |

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
  },
  "debug": {
    "cacheKey": "lTBXOJ+YWu4hSLnRtApWBUhCu40="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "statusCode": 200,
  "data": {
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
  },
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

Marketcap endpoint, which has many optional input parameters.

Supported names for this endpoint are: `marketcap`, `mc`.

### Input Params

| Required? |         Name          |    Aliases     |                   Description                    |  Type  |                         Options                          | Default  | Depends On |     Not Valid With      |
| :-------: | :-------------------: | :------------: | :----------------------------------------------: | :----: | :------------------------------------------------------: | :------: | :--------: | :---------------------: |
|    ✅     |         base          | `coin`, `from` |       The symbol of the currency to query        | string |                                                          |          |            |                         |
|    ✅     |         quote         | `market`, `to` |     The symbol of the currency to convert to     | string |                                                          |          |            |                         |
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
    "resultPath": "marketcap",
    "base": "BTC",
    "quote": "USD",
    "coinid": 1
  },
  "debug": {
    "cacheKey": "DpZS5CoFN19tP4shmR6mkFkvJ2w="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "marketcap": 1000000000,
    "result": 1000000000
  },
  "result": 1000000000,
  "statusCode": 200,
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
    "endpoint": "mc",
    "resultPath": "marketcap",
    "base": "BTC",
    "quote": "USD",
    "coinid": 2
  },
  "debug": {
    "cacheKey": "w3GwX88vkpKKHcxGEVagYaFaozw="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "marketcap": 1000000000,
    "result": 1000000000
  },
  "result": 1000000000,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

</details>

---

## Price Endpoint

Supported names for this endpoint are: `convert`, `price`.

### Input Params

| Required? |    Name    |    Aliases     |               Description                |  Type  |                       Options                        | Default  |  Depends On  | Not Valid With |
| :-------: | :--------: | :------------: | :--------------------------------------: | :----: | :--------------------------------------------------: | :------: | :----------: | :------------: |
|    ✅     |    base    | `coin`, `from` |   The symbol of the currency to query    | string |                                                      |          |              |                |
|    ✅     |   quote    | `market`, `to` | The symbol of the currency to convert to | string |                                                      |          |              |                |
|           |   amount   |    `value`     |       Amount of currency to price        | number |                                                      |          | `resultPath` |                |
|           | resultPath |                |         The path for the result          | string | `address`, `addresses`, `price`, `result`, `results` | `result` |   `amount`   |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "price",
    "resultPath": "price",
    "base": "BTC",
    "quote": "USD",
    "amount": 1
  },
  "debug": {
    "cacheKey": "L98LAmN1SgxnUxkXmEcJC1+nxVY="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "price": 123456,
    "result": 123456
  },
  "result": 123456,
  "statusCode": 200,
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
    "endpoint": "convert",
    "resultPath": "price",
    "base": "BTC",
    "quote": "USD",
    "amount": 10
  },
  "debug": {
    "cacheKey": "4FyMTrMFLiEe85bTJ4tVO4XRuFA="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "price": 123456,
    "result": 123456
  },
  "result": 123456,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

</details>

---
