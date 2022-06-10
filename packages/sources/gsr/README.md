# GSR Adapter

![1.0.3](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/gsr/package.json)

This adapter only supports WS connections. Make sure WS is enabled in your configuration in order to run this adapter.

Base URL https://oracle.prod.gsr.io/v1

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |                                          Description                                           |  Type  | Options |              Default              |
| :-------: | :-------------: | :--------------------------------------------------------------------------------------------: | :----: | :-----: | :-------------------------------: |
|           |  API_ENDPOINT   | The endpoint to fetch the GSR access token from (required to establish a websocket connection) | string |         |  `https://oracle.prod.gsr.io/v1`  |
|           | WS_API_ENDPOINT |                            The websocket endpoint to pull data from                            | string |         | `wss://oracle.prod.gsr.io/oracle` |
|    ✅     |   WS_USER_ID    |                                The user ID used to authenticate                                | string |         |                                   |
|    ✅     |  WS_PUBLIC_KEY  |                              The public key used to authenticate                               | string |         |                                   |
|    ✅     | WS_PRIVATE_KEY  |                              The private key used to authenticate                              | string |         |                                   |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |         Options          | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [price](#price-endpoint) | `price` |

## Price Endpoint

The price endpoint is used to fetch a price for a base/quote asset pair. This adapter currently only supports WS connection to the API on this endpoint.

`price` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |    Aliases     |            Description            | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :-------------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` |   The currency ticker to query    |      |         |         |            |                |
|    ✅     | quote | `market`, `to` | The currency ticker to convert to |      |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
