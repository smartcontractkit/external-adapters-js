# Chainlink External Adapter for Coinbase

![1.2.39](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/coinbase/package.json)

Query information from [Coinbase's API](https://developers.coinbase.com/api/v2)

Base URL wss://ws-feed.pro.coinbase.com

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |        Name         | Description |  Type  | Options |             Default              |
| :-------: | :-----------------: | :---------: | :----: | :-----: | :------------------------------: |
|           |    API_ENDPOINT     |             | string |         |    `https://api.coinbase.com`    |
|           |   WS_API_ENDPOINT   |             | string |         | `wss://ws-feed.pro.coinbase.com` |
|           |  NFT_API_ENDPOINT   |             | string |         |                                  |
|           | NFT_API_AUTH_HEADER |             | string |         |                                  |

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

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "crypto",
    "symbol": "BTC",
    "convert": "USD"
  },
  "debug": {
    "cacheKey": "r6ZXhd+zEdyag6axryIefPg9QnI="
  },
  "rateLimitMaxAge": 370
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "data": {
      "base": "BTC",
      "currency": "USD",
      "amount": "57854.29"
    },
    "result": 57854.29
  },
  "result": 57854.29,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

## NftFloorPrice Endpoint

Supported names for this endpoint are: `nft-floor`, `nft-floor-price`.

### Input Params

| Required? |      Name       | Aliases |                            Description                            |  Type  |                Options                |      Default       | Depends On | Not Valid With |
| :-------: | :-------------: | :-----: | :---------------------------------------------------------------: | :----: | :-----------------------------------: | :----------------: | :--------: | :------------: |
|           |     network     |         |              The blockchain network to get data from              | string | `ethereum-mainnet`, `polygon-mainnet` | `ethereum-mainnet` |            |                |
|    ✅     | contractAddress |         |                     The NFT contract address                      | string |                                       |                    |            |                |
|    ✅     |      start      |         | The beginning of the time window (inclusive, yyyy-mm-dd hh:mm:ss) | string |                                       |                    |            |                |
|    ✅     |       end       |         |    The end of the time window (inclusive, yyyy-mm-dd hh:mm:ss)    | string |                                       |                    |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "nft-floor-price",
    "network": "ethereum-mainnet",
    "contractAddress": "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d",
    "start": "2022-05-12T00:00:00",
    "end": "2022-05-12T00:00:00"
  },
  "debug": {
    "cacheKey": "4LcNxiggj5tja/4SVWiC8hk0OFY="
  },
  "rateLimitMaxAge": 740
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "floorPriceDailyValue": [
      {
        "date": "2022-05-11T00:00:00Z",
        "multiplier": 1,
        "priceStdDev": 0.12498363928979012,
        "logFloorPrice": 4.569591987976991,
        "adjustedFloorPrice": 85.16651572690085
      }
    ],
    "result": 85.16651572690085
  },
  "result": 85.16651572690085,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
