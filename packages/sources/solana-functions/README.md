# SOLANA_FUNCTIONS

![1.1.1](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/solana-functions/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

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

| Required? |   Name   |     Description     |  Type  |                                                         Options                                                          |   Default    |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------------------------------------------------------------------------: | :----------: |
|           | endpoint | The endpoint to use | string | [anchor-data](#anchor-data-endpoint), [eusx-price](#eusx-price-endpoint), [sanctum-infinity](#sanctum-infinity-endpoint) | `eusx-price` |

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

MIT License
