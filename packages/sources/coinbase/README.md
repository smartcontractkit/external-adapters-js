# Chainlink External Adapter for Coinbase

![2.0.11](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/coinbase/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Query information from [Coinbase's API](https://developers.coinbase.com/api/v2)

Base URL wss://ws-feed.pro.coinbase.com

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |        Name         |                                   Description                                   |  Type  | Options |             Default              |
| :-------: | :-----------------: | :-----------------------------------------------------------------------------: | :----: | :-----: | :------------------------------: |
|           |    API_ENDPOINT     |                                                                                 | string |         |    `https://api.coinbase.com`    |
|           |   WS_API_ENDPOINT   |                                                                                 | string |         | `wss://ws-feed.pro.coinbase.com` |
|           |  NFT_API_ENDPOINT   | The API endpoint for making NFT API requests (eg. https://nft-api.coinbase.com) | string |         |                                  |
|           | NFT_API_AUTH_HEADER |         The CB-NFT-API-TOKEN header used to authorize NFT API requests          | string |         |                                  |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                                                 Options                                                                 | Default  |
| :-------: | :------: | :-----------------: | :----: | :-------------------------------------------------------------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint), [nft-floor-price](#nftfloorprice-endpoint), [nft-floor](#nftfloorprice-endpoint), [price](#crypto-endpoint) | `crypto` |

## Crypto Endpoint

**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.**

Supported names for this endpoint are: `crypto`, `price`.

### Input Params

| Required? |  Name   |            Aliases            |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-----: | :---------------------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | symbol  | `base`, `coin`, `from`, `sym` |   The symbol of the currency to query    | string |         |         |            |                |
|    ✅     | convert |    `market`, `quote`, `to`    | The symbol of the currency to convert to | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## NftFloorPrice Endpoint

Get NFT floor price for a given network, contractAddress & metricName. Note: metricName defaults to ETH_FLOOR_PRICE_ESTIMATE_BASE; if you want to use a different metricName, you should also supply a custom resultPath

Supported names for this endpoint are: `nft-floor`, `nft-floor-price`.

### Input Params

| Required? |      Name       | Aliases |               Description               |  Type  |                Options                |             Default             | Depends On | Not Valid With |
| :-------: | :-------------: | :-----: | :-------------------------------------: | :----: | :-----------------------------------: | :-----------------------------: | :--------: | :------------: |
|           |     network     |         | The blockchain network to get data from | string | `ethereum-mainnet`, `polygon-mainnet` |       `ethereum-mainnet`        |            |                |
|    ✅     | contractAddress |         |        The NFT contract address         | string |                                       |                                 |            |                |
|           |   metricName    |         |        The metric name to query         | string |                                       | `ETH_FLOOR_PRICE_ESTIMATE_BASE` |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
