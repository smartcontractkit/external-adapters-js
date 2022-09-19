# Elwood Adapter

![1.0.2](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/elwood/package.json)

This adapter implements a WS interface for price data from the [Elwood](https://elwood.io/) platform. Note that the first request for a price will fail because the WS connection does not have enough time to start up before the first subscription request is sent.

Base URL wss://api.chk.elwood.systems/v1/stream

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |  Name   |                Description                |  Type  | Options | Default |
| :-------: | :-----: | :---------------------------------------: | :----: | :-----: | :-----: |
|    ✅     | API_KEY | API key to use (combined WS and HTTP key) | string |         |         |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |         Options          | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [price](#price-endpoint) | `price` |

## Price Endpoint

The price endpoint is used to fetch a price for a base/quote asset pair. This adapter currently only supports WS connection to the API for price data.

`price` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |        Aliases         |            Description            | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :--------------------: | :-------------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  |     `coin`, `from`     |   The currency ticker to query    |      |         |         |            |                |
|    ✅     | quote | `market`, `term`, `to` | The currency ticker to convert to |      |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
