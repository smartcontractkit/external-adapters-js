# GSR

![1.0.1](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/gsr-test/package.json)

Base URL wss://oracle.prod.gsr.io/oracle

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name      |             Description              |  Type  | Options | Default |
| :-------: | :------------: | :----------------------------------: | :----: | :-----: | :-----: |
|    ✅     |   WS_USER_ID   |   The user ID used to authenticate   | string |         |         |
|    ✅     | WS_PUBLIC_KEY  | The public key used to authenticate  | string |         |         |
|    ✅     | WS_PRIVATE_KEY | The private key used to authenticate | string |         |         |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                        Options                        | Default |
| :-------: | :------: | :-----------------: | :----: | :---------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [price-ws](#price-endpoint), [price](#price-endpoint) | `price` |

## Price Endpoint

Supported names for this endpoint are: `price`, `price-ws`.

### Input Params

| Required? | Name  |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
