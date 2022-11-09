# Galaxy test Source Adapter

![0.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/galaxy-test/package.json)

Base URL https://data.galaxy.com/v1.0/login

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |                                            Description                                            |  Type  | Options |               Default                |
| :-------: | :-------------: | :-----------------------------------------------------------------------------------------------: | :----: | :-----: | :----------------------------------: |
|           |  API_ENDPOINT   | The endpoint to fetch the Galaxy access token from (required to establish a websocket connection) | string |         | `https://data.galaxy.com/v1.0/login` |
|           | WS_API_ENDPOINT |                             The websocket endpoint to pull data from                              | string |         |   `wss://data.galaxy.com/v1.0/ws`    |
|    ✅     |     API_KEY     |                                      Key for the Galaxy API                                       | string |         |                                      |
|    ✅     |  API_PASSWORD   |                                    Password for the Galaxy API                                    | string |         |                                      |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |         Options          | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [price](#price-endpoint) | `price` |

## Price Endpoint

`price` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
