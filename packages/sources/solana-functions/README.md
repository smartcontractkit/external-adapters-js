# SOLANA_FUNCTIONS

![1.3.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/solana-functions/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Known Issues

`solana-functions` does not provide a direct way to call view functions on
Solana programs because there is no standard way in Solana to call view
functions.

In Solana, accounts have account data that can be read. But the meaning of this
account data depends on the program that created it. There is not a single
standard way to interpret the account data. Some ways are using an Anchor IDL
or defining a buffer layout but even with those, you need to know the specific
format for the program you are using.

This means that supporting a new program, always requires a code change in the
external adapter and does not work out of the box.

If a program uses Anchor, you might be able to download the IDL from its page
on explorer.solana.com. In this case note that IDLs created with an Anchor
version of 0.29.0 or earlier are not compatible with anchor 0.30.0 or later.

## Environment Variables

| Required? |         Name          |                                        Description                                        |  Type  | Options | Default |
| :-------: | :-------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     |        RPC_URL        |                            The RPC URL for the Solana cluster                             | string |         |         |
|           | BACKGROUND_EXECUTE_MS | The amount of time the background execute should sleep before performing the next request | number |         | `1000`  |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                                                               Options                                                                                                |   Default    |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :----------: |
|           | endpoint | The endpoint to use | string | [anchor-data](#anchor-data-endpoint), [buffer-layout](#buffer-layout-endpoint), [eusx-price](#eusx-price-endpoint), [extension](#extension-endpoint), [sanctum-infinity](#sanctum-infinity-endpoint) | `eusx-price` |

## Eusx-price Endpoint

`eusx-price` is the only supported name for this endpoint.

### Input Params

| Required? |  Name   | Aliases |          Description          |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-----: | :-----: | :---------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | address |         | Program address to fetch from | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "eusx-price",
    "address": "eUSXyKoZ6aGejYVbnp3wtWQ1E8zuokLAJPecPxxtgG3"
  }
}
```

---

## Anchor-data Endpoint

`anchor-data` is the only supported name for this endpoint.

### Input Params

| Required? |        Name         | Aliases |                       Description                        |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-----------------: | :-----: | :------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | stateAccountAddress |         |        The state account address for the program         | string |         |         |            |                |
|    ✅     |       account       |         |     The name of the account to retrieve from the IDL     | string |         |         |            |                |
|    ✅     |        field        |         | The name of the field to retrieve from the state account | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "anchor-data",
    "stateAccountAddress": "3TK9fNePM4qdKC4dwvDe8Bamv14prDqdVfuANxPeiryb",
    "account": "FundAccount",
    "field": "one_receipt_token_as_sol"
  }
}
```

---

## Sanctum-infinity Endpoint

`sanctum-infinity` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "data": {
    "endpoint": "sanctum-infinity"
  }
}
```

---

## Buffer-layout Endpoint

`buffer-layout` is the only supported name for this endpoint.

### Input Params

| Required? |        Name         | Aliases |                       Description                        |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-----------------: | :-----: | :------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | stateAccountAddress |         |        The state account address for the program         | string |         |         |            |                |
|    ✅     |        field        |         | The name of the field to retrieve from the state account | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "buffer-layout",
    "stateAccountAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "field": "supply"
  }
}
```

---

## Extension Endpoint

`extension` is the only supported name for this endpoint.

### Input Params

| Required? |             Name              | Aliases |                             Description                             |   Type   |           Options            | Default | Depends On | Not Valid With |
| :-------: | :---------------------------: | :-----: | :-----------------------------------------------------------------: | :------: | :--------------------------: | :-----: | :--------: | :------------: |
|    ✅     |      stateAccountAddress      |         |              The state account address for the program              |  string  |                              |         |            |                |
|           |          baseFields           |         |       Fields to get from the base section of the account data       | object[] |                              |         |            |                |
|    ✅     |        baseFields.name        |         |             Name to give the value in the response data             |  string  |                              |         |            |                |
|    ✅     |       baseFields.offset       |         |            Byte offset of the field in the account data             |  number  |                              |         |            |                |
|    ✅     |        baseFields.type        |         |                       Data type of the field                        |  string  | `float64`, `int64`, `uint64` |         |            |                |
|           |      extensionDataOffset      |         | Byte offset where the extensions section starts in the account data |  number  |                              |  `166`  |            |                |
|           |        extensionFields        |         | Fields to get from the token extension section of the account data  | object[] |                              |         |            |                |
|    ✅     | extensionFields.extensionType |         |              The number identifying the extension type              |  number  |                              |         |            |                |
|    ✅     |     extensionFields.name      |         |             Name to give the value in the response data             |  string  |                              |         |            |                |
|    ✅     |    extensionFields.offset     |         |            Byte offset of the field in the account data             |  number  |                              |         |            |                |
|    ✅     |     extensionFields.type      |         |                       Data type of the field                        |  string  | `float64`, `int64`, `uint64` |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "extension",
    "stateAccountAddress": "2HehXG149TXuVptQhbiWAWDjbbuCsXSAtLTB5wc2aajK",
    "baseFields": [
      {
        "name": "supply",
        "offset": 36,
        "type": "uint64"
      }
    ],
    "extensionDataOffset": 166,
    "extensionFields": [
      {
        "extensionType": 25,
        "name": "currentMultiplier",
        "offset": 32,
        "type": "float64"
      },
      {
        "extensionType": 25,
        "name": "newMultiplier",
        "offset": 48,
        "type": "float64"
      },
      {
        "extensionType": 25,
        "name": "activationDateTime",
        "offset": 40,
        "type": "int64"
      }
    ]
  }
}
```

---

MIT License
