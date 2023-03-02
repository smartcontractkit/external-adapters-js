# Chainlink External Adapter for CoinPaprika

![1.10.19](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/coinpaprika/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

_Note: the `-single` endpoints have the same functionality as their original endpoint, except they will only fetch data for the single asset being queried._

If network spikes are observed with the coinpaprika adapter, it may be due to not providing a coin-id and instead using a ticker symbol. Ticker symbols must be converted to coin-ids before they are fetched from the data provider. This conversion step requires downloading a large list of every single coin-id and matching ticker symbol from the data provider, impacting network performance. Provide a coin-id directly using the coin-id parameter, or provide a coin-id via the overrides parameter.
If the adapter still has large spikes in network usage after using the coin-id instead of a ticker symbol, this because, in order to handle requests for multiple price pairs, the data provider requires fetching every price pair the support simultaneously. The resulting response payload is very large (~2 MB), leading to impacted network performance.
A solution is to use the `crypto-single` endpoint instead to only fetch single price pairs as opposed to all price pairs. This will work, however batching will not be supported.
This is because, by using the crypto-single endpoint, an individual request is sent to the data provider to fetch each price pair, as opposed to one request for all price pairs. Thus, the total number of API requests is increased by a factor of the number of feeds, but each request will have a much smaller payload.

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description | Type | Options | Default |
| :-------: | :----------: | :---------: | :--: | :-----: | :-----: |
|           |   API_KEY    |             |      |         |         |
|           | IS_TEST_MODE |             |      |         |         |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                                                                                                                                          Options                                                                                                                                                           | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [coins](#coins-endpoint), [crypto-single](#cryptosingle-endpoint), [crypto-vwap](#vwap-endpoint), [crypto](#crypto-endpoint), [dominance](#dominance-endpoint), [globalmarketcap](#globalmarketcap-endpoint), [marketcap](#crypto-endpoint), [price](#crypto-endpoint), [volume](#crypto-endpoint), [vwap](#vwap-endpoint) | `crypto` |

## Crypto Endpoint

The `marketcap` endpoint fetches market cap of assets, the `volume` endpoint fetches 24-hour volume of assets, and the `crypto`/`price` endpoint fetches current price of asset pairs (https://api.coinpaprika.com/v1/tickers/`{COIN}`).

**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.**

Supported names for this endpoint are: `crypto`, `marketcap`, `price`, `volume`.

### Input Params

| Required? |  Name  |    Aliases     |                   Description                    |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :------------: | :----------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  base  | `coin`, `from` |       The symbol of the currency to query        |        |         |         |            |                |
|    ✅     | quote  | `market`, `to` |     The symbol of the currency to convert to     |        |         |         |            |                |
|           | coinid |                | The coin ID (optional to use in place of `base`) | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## CryptoSingle Endpoint

`crypto-single` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  |    Aliases     |                   Description                    |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :------------: | :----------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  base  | `coin`, `from` |       The symbol of the currency to query        | string |         |         |            |                |
|    ✅     | quote  | `market`, `to` |     The symbol of the currency to convert to     | string |         |         |            |                |
|           | coinid |                | The coin ID (optional to use in place of `base`) | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Dominance Endpoint

Returns Bitcoin's dominance from the [global endpoint](https://api.coinpaprika.com/v1/global)

`dominance` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  |    Aliases    |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | market | `quote`, `to` | The symbol of the currency to convert to | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## GlobalMarketcap Endpoint

Returns the global market capitilization from the [global endpoint](https://api.coinpaprika.com/v1/global)

`globalmarketcap` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  |    Aliases    |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | market | `quote`, `to` | The symbol of the currency to convert to | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Coins Endpoint

`coins` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

There are no examples for this endpoint.

---

## Vwap Endpoint

Supported names for this endpoint are: `crypto-vwap`, `vwap`.

### Input Params

| Required? |  Name  |    Aliases     |                   Description                    |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :------------: | :----------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  base  | `coin`, `from` |                                                  | string |         |         |            |                |
|           | hours  |                |         Number of hours to get VWAP for          | number |         |  `24`   |            |                |
|           | coinid |                | The coin ID (optional to use in place of `base`) | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
