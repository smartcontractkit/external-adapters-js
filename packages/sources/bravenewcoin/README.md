# Chainlink External Adapter for BraveNewCoin

![1.3.27](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/bravenewcoin/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |   Name    | Description |  Type  | Options | Default |
| :-------: | :-------: | :---------: | :----: | :-----: | :-----: |
|    ✅     |  API_KEY  |             | string |         |         |
|    ✅     | CLIENT_ID |             | string |         |         |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                    Options                                    | Default  |
| :-------: | :------: | :-----------------: | :----: | :---------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint), [price](#crypto-endpoint), [vwap](#vwap-endpoint) | `crypto` |

## Crypto Endpoint

[BraveNewCoin's AssetTicker endpoint](https://rapidapi.com/BraveNewCoin/api/bravenewcoin?endpoint=apiendpoint_836afc6

**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.**

Supported names for this endpoint are: `crypto`, `price`.

### Input Params

| Required? | Name  |    Aliases     |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` |   The symbol of the currency to query    | string |         |         |            |                |
|    ✅     | quote | `market`, `to` | The symbol of the currency to convert to | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Vwap Endpoint

[BraveNewCoin's 24 Hour USD VWAP](https://rapidapi.com/BraveNewCoin/api/bravenewcoin?endpoint=apiendpoint_8b8774ba-b368-4399-9c4a-dc78f13fc786)

`vwap` is the only supported name for this endpoint.

### Input Params

| Required? |   Name    |                        Aliases                        |                                                                          Description                                                                          |  Type  |   Options    | Default | Depends On | Not Valid With |
| :-------: | :-------: | :---------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------------------------------------------: | :----: | :----------: | :-----: | :--------: | :------------: |
|    ✅     |  symbol   | `asset`, `assetId`, `base`, `coin`, `from`, `indexId` |                                                      Retrieve the VWAP for a particular asset or market                                                       | string |              |         |            |                |
|           | indexType |                                                       |                                                         Restrict the OHLCV results to the index type.                                                         | string | `GWA`, `MWA` |         |            |                |
|           | timestamp |                                                       | Retrieve the daily OHLCV record from before the timestamp provided. All dates are stored in UTC. Timestamp strings should be in the form YYYY-MM-DDThh:mm:ssZ |        |              |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
