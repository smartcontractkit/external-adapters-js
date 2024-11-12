# Chainlink External Adapter for Coinranking

![2.1.7](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/coinranking/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

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

Request:

```json
{
  "id": "1",
  "data": {
    "base": "ETH",
    "quote": "USD",
    "endpoint": "crypto",
    "resultPath": "price"
  },
  "debug": {
    "cacheKey": "myCLTCj4zYsnsKksIJQuUgg6g+Y="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "status": "success",
    "data": {
      "stats": {
        "total": 2,
        "totalCoins": 12443,
        "totalMarkets": 22970,
        "totalExchanges": 173,
        "totalMarketCap": "2851820248983",
        "total24hVolume": "128082207195"
      },
      "coins": [
        {
          "uuid": "razxDUgYGNAdQ",
          "symbol": "ETH",
          "name": "Ethereum",
          "color": "#3C3C3D",
          "iconUrl": "https://cdn.coinranking.com/rk4RKHOuW/eth.svg",
          "marketCap": "527538906196",
          "price": "4478.930333561968",
          "listedAt": 1438905600,
          "tier": 1,
          "change": "4.59",
          "rank": 2,
          "sparkline": [
            "4282.1804199846228637180000",
            "4295.9820933572436686440000",
            "4338.0415746961392639740000",
            "4317.4246601886649788100000",
            "4296.0931736628041592430000",
            "4317.6363325631844686940000",
            "4319.5656864028767274890000",
            "4315.0492875427621272280000",
            "4319.3435285958741908900000",
            "4312.8379293033577666440000",
            "4309.9339113747802206040000",
            "4335.5094937050709057660000",
            "4351.1826227419480188020000",
            "4361.2776132439523819370000",
            "4362.3590272312213170420000",
            "4344.6618847237498360710000",
            "4355.0108360480565010600000",
            "4434.9508778240489888020000",
            "4440.9039538669308358670000",
            "4432.1808277294489703950000",
            "4444.4011631659664527740000",
            "4467.2186533493298884390000",
            "4475.3444958315847831110000",
            "4497.1013469323828725430000",
            "4495.1474082460385223070000",
            "4479.8274332723585633240000",
            "4478.9303335619675063580000"
          ],
          "lowVolume": false,
          "coinrankingUrl": "https://coinranking.com/coin/razxDUgYGNAdQ+ethereum-eth",
          "24hVolume": "16855138984",
          "btcPrice": "0.07068440870606915"
        },
        {
          "uuid": "z_D3NLkrkPDW",
          "symbol": "ETH",
          "name": "ETH Light",
          "color": null,
          "iconUrl": "https://cdn.coinranking.com/W_LV9_LV_/eth-light.svg",
          "marketCap": null,
          "price": "0.000039624511925286",
          "listedAt": 1545060300,
          "tier": 3,
          "change": "0",
          "rank": 5675,
          "sparkline": [
            "0.0000396245119252860000",
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            "0.0000396245119252860000"
          ],
          "lowVolume": false,
          "coinrankingUrl": "https://coinranking.com/coin/z_D3NLkrkPDW+ethlight-eth",
          "24hVolume": null,
          "btcPrice": "6.53373113e-10"
        }
      ]
    },
    "cost": 1,
    "result": 4478.930333561968
  },
  "result": 4478.930333561968,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

<details>
<summary>Additional Examples</summary>

Request:

```json
{
  "id": "1",
  "data": {
    "base": "ETH",
    "quote": "USD",
    "endpoint": "marketcap",
    "resultPath": "marketCap"
  },
  "debug": {
    "cacheKey": "pOdAjL3913pdWiqCSCbdpHFCw+w="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "status": "success",
    "data": {
      "stats": {
        "total": 2,
        "totalCoins": 12443,
        "totalMarkets": 22970,
        "totalExchanges": 173,
        "totalMarketCap": "2851820248983",
        "total24hVolume": "128082207195"
      },
      "coins": [
        {
          "uuid": "razxDUgYGNAdQ",
          "symbol": "ETH",
          "name": "Ethereum",
          "color": "#3C3C3D",
          "iconUrl": "https://cdn.coinranking.com/rk4RKHOuW/eth.svg",
          "marketCap": "527538906196",
          "price": "4478.930333561968",
          "listedAt": 1438905600,
          "tier": 1,
          "change": "4.59",
          "rank": 2,
          "sparkline": [
            "4282.1804199846228637180000",
            "4295.9820933572436686440000",
            "4338.0415746961392639740000",
            "4317.4246601886649788100000",
            "4296.0931736628041592430000",
            "4317.6363325631844686940000",
            "4319.5656864028767274890000",
            "4315.0492875427621272280000",
            "4319.3435285958741908900000",
            "4312.8379293033577666440000",
            "4309.9339113747802206040000",
            "4335.5094937050709057660000",
            "4351.1826227419480188020000",
            "4361.2776132439523819370000",
            "4362.3590272312213170420000",
            "4344.6618847237498360710000",
            "4355.0108360480565010600000",
            "4434.9508778240489888020000",
            "4440.9039538669308358670000",
            "4432.1808277294489703950000",
            "4444.4011631659664527740000",
            "4467.2186533493298884390000",
            "4475.3444958315847831110000",
            "4497.1013469323828725430000",
            "4495.1474082460385223070000",
            "4479.8274332723585633240000",
            "4478.9303335619675063580000"
          ],
          "lowVolume": false,
          "coinrankingUrl": "https://coinranking.com/coin/razxDUgYGNAdQ+ethereum-eth",
          "24hVolume": "16855138984",
          "btcPrice": "0.07068440870606915"
        },
        {
          "uuid": "z_D3NLkrkPDW",
          "symbol": "ETH",
          "name": "ETH Light",
          "color": null,
          "iconUrl": "https://cdn.coinranking.com/W_LV9_LV_/eth-light.svg",
          "marketCap": null,
          "price": "0.000039624511925286",
          "listedAt": 1545060300,
          "tier": 3,
          "change": "0",
          "rank": 5675,
          "sparkline": [
            "0.0000396245119252860000",
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            "0.0000396245119252860000"
          ],
          "lowVolume": false,
          "coinrankingUrl": "https://coinranking.com/coin/z_D3NLkrkPDW+ethlight-eth",
          "24hVolume": null,
          "btcPrice": "6.53373113e-10"
        }
      ]
    },
    "cost": 1,
    "result": 527538906196
  },
  "result": 527538906196,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

</details>

---

## TotalMarketCap Endpoint

Returns the totalMarketCap value provided by coinranking's 'stats' endpoint

Supported names for this endpoint are: `globalmarketcap`, `totalMarketCap`, `totalmcap`.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "totalMarketCap"
  },
  "debug": {
    "cacheKey": "ow1rfzVUhrabsezQrFXAy1jncWo="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "status": "success",
    "data": {
      "referenceCurrencyRate": 1,
      "totalCoins": 23349,
      "totalMarkets": 37921,
      "totalExchanges": 179,
      "totalMarketCap": "1139638848309",
      "total24hVolume": "85309476474",
      "btcDominance": 41.393155263964395,
      "bestCoins": [
        {
          "uuid": "fmHk13Rqw",
          "symbol": "FLOKI*",
          "name": "FLOKI",
          "iconUrl": "https://cdn.coinranking.com/Yfn5I1O01/10804.png",
          "coinrankingUrl": "https://coinranking.com/coin/fmHk13Rqw+floki-floki"
        },
        {
          "uuid": "08CsQa-Ov",
          "symbol": "WEMIX",
          "name": "WEMIX TOKEN",
          "iconUrl": "https://cdn.coinranking.com/1N84MQsoO/7548.png",
          "coinrankingUrl": "https://coinranking.com/coin/08CsQa-Ov+wemixtoken-wemix"
        },
        {
          "uuid": "jrP7Ptsct",
          "symbol": "ACH**",
          "name": "Alchemy Pay",
          "iconUrl": "https://cdn.coinranking.com/tkKQoiNEr/alchemypay.svg",
          "coinrankingUrl": "https://coinranking.com/coin/jrP7Ptsct+alchemypay-ach"
        }
      ],
      "newestCoins": [
        {
          "uuid": "ZO8YGJCio",
          "symbol": "HASHTAG",
          "name": "Hashtag United F.C Fan Token",
          "iconUrl": "https://cdn.coinranking.com/FYBQpoUyV/HASH.PNG",
          "coinrankingUrl": "https://coinranking.com/coin/ZO8YGJCio+hashtagunitedfcfantoken-hashtag"
        },
        {
          "uuid": "BYg5FxSE-",
          "symbol": "FLAME",
          "name": "Flame Chain",
          "iconUrl": "https://cdn.coinranking.com/mv2256upC/FLAME_LOGO.png",
          "coinrankingUrl": "https://coinranking.com/coin/BYg5FxSE-+flamechain-flame"
        },
        {
          "uuid": "EK1DC7MeO",
          "symbol": "SFIL",
          "name": "Super File Coin",
          "iconUrl": "https://cdn.coinranking.com/n15BzWVX7/SFIL_LOGO.png",
          "coinrankingUrl": "https://coinranking.com/coin/EK1DC7MeO+superfilecoin-sfil"
        }
      ]
    },
    "result": 1139638848309
  },
  "result": 1139638848309,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

<details>
<summary>Additional Examples</summary>

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "globalmarketcap"
  },
  "debug": {
    "cacheKey": "UgXT1GeGBteW8oldPY+NnKaTMEA="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "status": "success",
    "data": {
      "referenceCurrencyRate": 1,
      "totalCoins": 23349,
      "totalMarkets": 37921,
      "totalExchanges": 179,
      "totalMarketCap": "1139638848309",
      "total24hVolume": "85309476474",
      "btcDominance": 41.393155263964395,
      "bestCoins": [
        {
          "uuid": "fmHk13Rqw",
          "symbol": "FLOKI*",
          "name": "FLOKI",
          "iconUrl": "https://cdn.coinranking.com/Yfn5I1O01/10804.png",
          "coinrankingUrl": "https://coinranking.com/coin/fmHk13Rqw+floki-floki"
        },
        {
          "uuid": "08CsQa-Ov",
          "symbol": "WEMIX",
          "name": "WEMIX TOKEN",
          "iconUrl": "https://cdn.coinranking.com/1N84MQsoO/7548.png",
          "coinrankingUrl": "https://coinranking.com/coin/08CsQa-Ov+wemixtoken-wemix"
        },
        {
          "uuid": "jrP7Ptsct",
          "symbol": "ACH**",
          "name": "Alchemy Pay",
          "iconUrl": "https://cdn.coinranking.com/tkKQoiNEr/alchemypay.svg",
          "coinrankingUrl": "https://coinranking.com/coin/jrP7Ptsct+alchemypay-ach"
        }
      ],
      "newestCoins": [
        {
          "uuid": "ZO8YGJCio",
          "symbol": "HASHTAG",
          "name": "Hashtag United F.C Fan Token",
          "iconUrl": "https://cdn.coinranking.com/FYBQpoUyV/HASH.PNG",
          "coinrankingUrl": "https://coinranking.com/coin/ZO8YGJCio+hashtagunitedfcfantoken-hashtag"
        },
        {
          "uuid": "BYg5FxSE-",
          "symbol": "FLAME",
          "name": "Flame Chain",
          "iconUrl": "https://cdn.coinranking.com/mv2256upC/FLAME_LOGO.png",
          "coinrankingUrl": "https://coinranking.com/coin/BYg5FxSE-+flamechain-flame"
        },
        {
          "uuid": "EK1DC7MeO",
          "symbol": "SFIL",
          "name": "Super File Coin",
          "iconUrl": "https://cdn.coinranking.com/n15BzWVX7/SFIL_LOGO.png",
          "coinrankingUrl": "https://coinranking.com/coin/EK1DC7MeO+superfilecoin-sfil"
        }
      ]
    },
    "result": 1139638848309
  },
  "result": 1139638848309,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

</details>

---

MIT License
