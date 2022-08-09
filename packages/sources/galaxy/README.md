# Example Source Adapter

![0.2.10](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/galaxy/package.json)

This adapter only supports WS connections. Make sure WS is enabled in your configuration in order to run this adapter.

Base URL https://test.data.galaxydigital.io/v1.0/login

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |                                            Description                                            |  Type  | Options |                     Default                     |
| :-------: | :-------------: | :-----------------------------------------------------------------------------------------------: | :----: | :-----: | :---------------------------------------------: |
|           |  API_ENDPOINT   | The endpoint to fetch the Galaxy access token from (required to establish a websocket connection) | string |         | `https://test.data.galaxydigital.io/v1.0/login` |
|           | WS_API_ENDPOINT |                             The websocket endpoint to pull data from                              | string |         |     `wss://prod.data.galaxydigital.io/v1.0`     |
|    ✅     |   WS_API_KEY    |                                 The API key to authenticate with                                  | string |         |                                                 |
|    ✅     | WS_API_PASSWORD |                               The API password to authenticate with                               | string |         |                                                 |

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
