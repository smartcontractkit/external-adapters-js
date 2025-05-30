# Chainlink External Adapter for Coinranking

![2.1.16](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/coinranking/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |  Name   |                            Description                             |  Type  | Options | Default |
| :-------: | :-----: | :----------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     | API_KEY | An API key that can be obtained from the data provider's dashboard | string |         |         |

---

## Data Provider Rate Limits

|   Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |                                          Note                                          |
| :------: | :-------------------------: | :-------------------------: | :-----------------------: | :------------------------------------------------------------------------------------: |
|   free   |              5              |                             |       13.8888888889       | 10k/mo on the free tier (with API key) unauthenticated request limits aren't specified |
| hobbyist |                             |                             |       277.777777778       |                                                                                        |
|   pro    |                             |                             |            -1             |                                                                                        |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                                                                                       Options                                                                                                        | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint), [globalmarketcap](#totalmarketcap-endpoint), [marketcap](#crypto-endpoint), [price](#crypto-endpoint), [totalMarketCap](#totalmarketcap-endpoint), [totalmcap](#totalmarketcap-endpoint) | `crypto` |

## Crypto Endpoint

https://api.coinranking.com/v2/coins

Supported names for this endpoint are: `crypto`, `marketcap`, `price`.

### Input Params

| Required? |         Name          |    Aliases     |                                  Description                                  |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-------------------: | :------------: | :---------------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |         base          | `coin`, `from` |                      The symbol of the currency to query                      | string |         |         |            |                |
|    ✅     |         quote         | `market`, `to` |                   The symbol of the currency to convert to                    | string |         |         |            |                |
|           |        coinid         |                | The coin ID to select the specific coin (in case of duplicate `from` symbols) |        |         |         |            |                |
|           | referenceCurrencyUuid |                |                      Optional UUID of the `to` currency                       | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## TotalMarketCap Endpoint

Returns the totalMarketCap value provided by coinranking's 'stats' endpoint

Supported names for this endpoint are: `globalmarketcap`, `totalMarketCap`, `totalmcap`.

### Input Params

There are no input parameters for this endpoint.

### Example

There are no examples for this endpoint.

---

MIT License
