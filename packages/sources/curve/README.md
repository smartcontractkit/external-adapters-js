# Chainlink External Adapter for Curve.fi

![1.2.10](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/curve/package.json)

This adapter allows querying Curve.fi contracts

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name         | Description |  Type  | Options |                   Default                    |
| :-------: | :------------------: | :---------: | :----: | :-----: | :------------------------------------------: |
|    ✅     |       RPC_URL        |             | string |         |                                              |
|           |   ADDRESS_PROVIDER   |             | string |         | `0x0000000022D53366457F9d5E68Ec105046FC4383` |
|           | EXCHANGE_PROVIDER_ID |             | number |         |                     `2`                      |
|           |  BLOCKCHAIN_NETWORK  |             | string |         |                  `ethereum`                  |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |          Options           | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint) | `crypto` |

## Crypto Endpoint

Gets the exchange rate between two tokens

`crypto` is the only supported name for this endpoint.

### Input Params

| Required? |     Name     |      Aliases      |                                                     Description                                                      |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----------: | :---------------: | :------------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |     from     |  `base`, `coin`   |                                         The symbol of the currency to query                                          | string |         |         |            |                |
|           | fromAddress  |                   |          Optional param to pre-define the address to convert from. If set, it takes precedence over `from`           | string |         |         |            |                |
|           | fromDecimals |                   | Optional param to pre-define the number of decimals in the `from` token. Setting this will make the query run faster | number |         |         |            |                |
|    ✅     |      to      | `market`, `quote` |                                       The symbol of the currency to convert to                                       | string |         |         |            |                |
|           |  toAddress   |                   |            Optional param to pre-define the address to convert to. If set, it takes precedence over `to`             | string |         |         |            |                |
|           |  toDecimals  |                   |  Optional param to pre-define the number of decimals in the `to` token. Setting this will make the query run faster  | number |         |         |            |                |
|           |    amount    |                   |               The exchange amount to get the rate of. The amount is in full units, e.g. 1 USDC, 1 ETH                | number |         |   `1`   |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "crypto",
    "resultPath": "rate",
    "from": "USDC",
    "to": "USDT",
    "amount": 1
  },
  "debug": {
    "cacheKey": "8+57VCexLY5xpa6wBMELqPDkP4w="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "pool": "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
    "input": "1000000",
    "inputToken": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "inputDecimals": 6,
    "output": "999424",
    "outputToken": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    "outputDecimals": 6,
    "rate": 0.999424,
    "result": 0.999424
  },
  "result": 0.999424,
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
    "endpoint": "crypto",
    "resultPath": "rate",
    "from": "0xBC6DA0FE9aD5f3b0d58160288917AA56653660E9",
    "fromDecimals": 18,
    "to": "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    "toDecimals": 18,
    "amount": 10
  },
  "debug": {
    "cacheKey": "GtHEA0XyZDBJS8lIwWVQtfKtIRM="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "pool": "0x43b4FdFD4Ff969587185cDB6f0BD875c5Fc83f8c",
    "input": "10000000000000000000",
    "inputToken": "0xBC6DA0FE9aD5f3b0d58160288917AA56653660E9",
    "inputDecimals": 18,
    "output": "9777973472353241389",
    "outputToken": "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    "outputDecimals": 18,
    "rate": 0.9777973472353242,
    "result": 0.9777973472353242
  },
  "result": 0.9777973472353242,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

</details>

---

MIT License
