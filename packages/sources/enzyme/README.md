# Chainlink External Adapter for Enzyme

![2.0.17](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/enzyme/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Adapter to interact with Enzyme contracts.

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |       Name        |                                Description                                 |  Type  | Options | Default |
| :-------: | :---------------: | :------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     | ETHEREUM_RPC_URL  | An http(s) RPC URL to a blockchain node that can read the Enzyme contracts | string |         |         |
|           | ETHEREUM_CHAIN_ID |                         The chain id to connect to                         | string |         |   `1`   |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                                                                             Options                                                                                              |  Default  |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [calcGav](#calcgav-endpoint), [calcNav](#calcnav-endpoint), [calcNetShareValueInAsset](#calcnetsharevalueinasset-endpoint), [calcNetValueForSharesHolder](#calcnetvalueforsharesholder-endpoint) | `calcNav` |

## CalcGav Endpoint

Endpoint to call the `calcGav` function on the contract.

`calcGav` is the only supported name for this endpoint.

### Input Params

| Required? |        Name        | Aliases | Description |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----------------: | :-----: | :---------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | calculatorContract |         |             | string |         |         |            |                |
|    ✅     |     vaultProxy     |         |             | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "calculatorContract": "0x0b2cBB1974f17700531439E3e4AfF5e5D2AADD4A",
    "vaultProxy": "0x44902e5a88371224d9ac172e391C64257B701Ade",
    "endpoint": "calcGav"
  },
  "debug": {
    "cacheKey": "yUw9SO6VrH2QFaTp1fXS40T8Kzg="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "netShareValue": "1000000000000000000",
    "result": "1000000000000000000"
  },
  "result": "1000000000000000000",
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

## CalcNav Endpoint

Endpoint to call the `calcNav` function on the contract.

`calcNav` is the only supported name for this endpoint.

### Input Params

| Required? |        Name        | Aliases | Description |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----------------: | :-----: | :---------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | calculatorContract |         |             | string |         |         |            |                |
|    ✅     |     vaultProxy     |         |             | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "calculatorContract": "0x0b2cBB1974f17700531439E3e4AfF5e5D2AADD4A",
    "vaultProxy": "0x44902e5a88371224d9ac172e391C64257B701Ade",
    "endpoint": "calcNav"
  },
  "debug": {
    "cacheKey": "940HZR6f+3OIPsgqg47sxUwf0zE="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "nav": "19995161270996618818245984400",
    "result": "19995161270996618818245984400"
  },
  "result": "19995161270996618818245984400",
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

## CalcNetValueForSharesHolder Endpoint

Endpoint to call the `calcNetValueForSharesHolder` function on the contract.

`calcNetValueForSharesHolder` is the only supported name for this endpoint.

### Input Params

| Required? |        Name        | Aliases | Description |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----------------: | :-----: | :---------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | calculatorContract |         |             | string |         |         |            |                |
|    ✅     |     vaultProxy     |         |             | string |         |         |            |                |
|    ✅     |    sharesHolder    |         |             | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "calculatorContract": "0x0b2cBB1974f17700531439E3e4AfF5e5D2AADD4A",
    "vaultProxy": "0x399acf6102c466a3e4c5f94cd00fc1bfb071d3c1",
    "sharesHolder": "0x31d675bd2bdfdd3e332311bef7cb6ba357a5d4e3",
    "endpoint": "calcNetValueForSharesHolder"
  },
  "debug": {
    "cacheKey": "a85ZghFmLyLIxhxF64JD0l84PlE="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "netValue": "10000000000000000000",
    "result": "10000000000000000000"
  },
  "result": "10000000000000000000",
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

## CalcNetShareValueInAsset Endpoint

Endpoint to call the `calcNetShareValueInAsset` function on the contract.

`calcNetShareValueInAsset` is the only supported name for this endpoint.

### Input Params

| Required? |        Name        | Aliases | Description |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----------------: | :-----: | :---------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | calculatorContract |         |             | string |         |         |            |                |
|    ✅     |     vaultProxy     |         |             | string |         |         |            |                |
|    ✅     |     quoteAsset     |         |             | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
