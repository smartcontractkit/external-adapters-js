# Chainlink External Adapter for CoinPaprika

Version: 1.3.8

_Note: the `-single` endpoints have the same functionality as their original endpoint, except they will only fetch data for the single asset being queried._

This README was generated automatically. Please see [scripts](../../scripts) for more info.

## Environment Variables

| Required? |     Name     | Description | Type | Options | Default |
| :-------: | :----------: | :---------: | :--: | :-----: | :-----: |
|           |   API_KEY    |             |      |         |         |
|           | IS_TEST_MODE |             |      |         |         |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                                                                                                                          Options                                                                                                                                                           | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [coins](#coins-endpoint), [crypto-single](#cryptosingle-endpoint), [crypto-vwap](#vwap-endpoint), [crypto](#crypto-endpoint), [dominance](#dominance-endpoint), [globalmarketcap](#globalmarketcap-endpoint), [marketcap](#crypto-endpoint), [price](#crypto-endpoint), [volume](#crypto-endpoint), [vwap](#vwap-endpoint) | `crypto` |

---

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

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "crypto",
    "resultPath": "price",
    "base": "ETH",
    "quote": "USD"
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "payload": [
      {
        "id": "btc-bitcoin",
        "name": "Bitcoin",
        "symbol": "BTC",
        "rank": 1,
        "circulating_supply": 18851169,
        "total_supply": 18851169,
        "max_supply": 21000000,
        "beta_value": 0.932555,
        "first_data_at": "2010-07-17T00:00:00Z",
        "last_updated": "2021-10-22T18:11:05Z",
        "quotes": {
          "USD": {
            "price": 60697.885839641,
            "volume_24h": 49092990352.954,
            "volume_24h_change_24h": -22.62,
            "market_cap": 1144226103905,
            "market_cap_change_24h": -3.78,
            "percent_change_15m": 0.04,
            "percent_change_30m": -0.17,
            "percent_change_1h": -0.73,
            "percent_change_6h": -4.15,
            "percent_change_12h": -3.81,
            "percent_change_24h": -3.78,
            "percent_change_7d": -1.51,
            "percent_change_30d": 38.36,
            "percent_change_1y": 364.42,
            "ath_price": 66890.890314799,
            "ath_date": "2021-10-20T16:06:13Z",
            "percent_from_price_ath": -9.26
          }
        }
      },
      {
        "id": "eth-ethereum",
        "name": "Ethereum",
        "symbol": "ETH",
        "rank": 2,
        "circulating_supply": 118033526,
        "total_supply": 118033574,
        "max_supply": 0,
        "beta_value": 1.08967,
        "first_data_at": "2015-08-07T00:00:00Z",
        "last_updated": "2021-10-22T18:11:05Z",
        "quotes": {
          "USD": {
            "price": 3949.2425813062,
            "volume_24h": 24136641726.138,
            "volume_24h_change_24h": -35.07,
            "market_cap": 466143026900,
            "market_cap_change_24h": -3.44,
            "percent_change_15m": 0.14,
            "percent_change_30m": -0.18,
            "percent_change_1h": -0.64,
            "percent_change_6h": -4.09,
            "percent_change_12h": -4.65,
            "percent_change_24h": -3.45,
            "percent_change_7d": 2.23,
            "percent_change_30d": 28.11,
            "percent_change_1y": 844.08,
            "ath_price": 4365.2053035,
            "ath_date": "2021-05-12T06:06:20Z",
            "percent_from_price_ath": -9.53
          }
        }
      },
      {
        "id": "hex-hex",
        "name": "HEX",
        "symbol": "HEX",
        "rank": 3,
        "circulating_supply": 286375254190,
        "total_supply": 635492436682,
        "max_supply": 0,
        "beta_value": 0.464951,
        "first_data_at": "2019-12-14T00:00:00Z",
        "last_updated": "2021-10-22T18:11:13Z",
        "quotes": {
          "USD": {
            "price": 0.28611624619529,
            "volume_24h": 24824970.353259,
            "volume_24h_change_24h": -35.6,
            "market_cap": 81936612732,
            "market_cap_change_24h": 2.89,
            "percent_change_15m": 0.55,
            "percent_change_30m": 0.68,
            "percent_change_1h": 0.79,
            "percent_change_6h": 1.91,
            "percent_change_12h": 2.29,
            "percent_change_24h": 2.87,
            "percent_change_7d": -6.85,
            "percent_change_30d": -34.79,
            "percent_change_1y": 4934.43,
            "ath_price": 0.51106460487545,
            "ath_date": "2021-09-19T06:36:21Z",
            "percent_from_price_ath": -44.11
          }
        }
      },
      {
        "id": "bnb-binance-coin",
        "name": "Binance Coin",
        "symbol": "BNB",
        "rank": 4,
        "circulating_supply": 153432897,
        "total_supply": 166801148,
        "max_supply": 200000000,
        "beta_value": 1.12437,
        "first_data_at": "2017-07-25T00:00:00Z",
        "last_updated": "2021-10-22T18:11:07Z",
        "quotes": {
          "USD": {
            "price": 479.94841142545,
            "volume_24h": 2535946253.9608,
            "volume_24h_change_24h": -19.94,
            "market_cap": 73639875175,
            "market_cap_change_24h": 1.35,
            "percent_change_15m": 0.05,
            "percent_change_30m": -0.23,
            "percent_change_1h": -0.61,
            "percent_change_6h": -2.3,
            "percent_change_12h": 0.08,
            "percent_change_24h": 1.35,
            "percent_change_7d": 3.27,
            "percent_change_30d": 24.74,
            "percent_change_1y": 1455.79,
            "ath_price": 690.56767219,
            "ath_date": "2021-05-10T06:31:21Z",
            "percent_from_price_ath": -30.59
          }
        }
      },
      {
        "id": "usdt-tether",
        "name": "Tether",
        "symbol": "USDT",
        "rank": 5,
        "circulating_supply": 70415110815,
        "total_supply": 70415110815,
        "max_supply": 0,
        "beta_value": 0.00148463,
        "first_data_at": "2015-02-25T00:00:00Z",
        "last_updated": "2021-10-22T18:11:07Z",
        "quotes": {
          "USD": {
            "price": 0.99993405402971,
            "volume_24h": 76270541122.634,
            "volume_24h_change_24h": -18.14,
            "market_cap": 70410467222,
            "market_cap_change_24h": 0.35,
            "percent_change_15m": -0.1,
            "percent_change_30m": -0.13,
            "percent_change_1h": -0.07,
            "percent_change_6h": -0.06,
            "percent_change_12h": -0.1,
            "percent_change_24h": -0.03,
            "percent_change_7d": -0.08,
            "percent_change_30d": 0.14,
            "percent_change_1y": -0.11,
            "ath_price": 1.21549,
            "ath_date": "2015-02-25T17:04:00Z",
            "percent_from_price_ath": -17.67
          }
        }
      },
      {
        "id": "ada-cardano",
        "name": "Cardano",
        "symbol": "ADA",
        "rank": 6,
        "circulating_supply": 31946328269,
        "total_supply": 32704886184,
        "max_supply": 45000000000,
        "beta_value": 1.00646,
        "first_data_at": "2017-10-01T00:00:00Z",
        "last_updated": "2021-10-22T18:11:05Z",
        "quotes": {
          "USD": {
            "price": 2.1477434703293,
            "volume_24h": 2431508237.5173,
            "volume_24h_change_24h": -35.7,
            "market_cap": 68612517940,
            "market_cap_change_24h": -0.66,
            "percent_change_15m": 0.01,
            "percent_change_30m": -0.12,
            "percent_change_1h": -0.35,
            "percent_change_6h": -1.75,
            "percent_change_12h": -2.72,
            "percent_change_24h": -0.66,
            "percent_change_7d": -3.54,
            "percent_change_30d": -3.98,
            "percent_change_1y": 1839.46,
            "ath_price": 3.0950278974839,
            "ath_date": "2021-09-02T06:01:10Z",
            "percent_from_price_ath": -30.61
          }
        }
      },
      {
        "id": "sol-solana",
        "name": "Solana",
        "symbol": "SOL",
        "rank": 7,
        "circulating_supply": 273556026,
        "total_supply": 494519162,
        "max_supply": 0,
        "beta_value": 0.873294,
        "first_data_at": "2020-08-26T00:00:00Z",
        "last_updated": "2021-10-22T18:11:13Z",
        "quotes": {
          "USD": {
            "price": 203.80848966283,
            "volume_24h": 4601854664.2556,
            "volume_24h_change_24h": 9.54,
            "market_cap": 55753040497,
            "market_cap_change_24h": 11.38,
            "percent_change_15m": 0.31,
            "percent_change_30m": 0.11,
            "percent_change_1h": -1.15,
            "percent_change_6h": 0.66,
            "percent_change_12h": -0.44,
            "percent_change_24h": 11.38,
            "percent_change_7d": 26.04,
            "percent_change_30d": 37.25,
            "percent_change_1y": 9810.01,
            "ath_price": 213.85081401179,
            "ath_date": "2021-09-09T02:21:20Z",
            "percent_from_price_ath": -4.91
          }
        }
      },
      {
        "id": "xrp-xrp",
        "name": "XRP",
        "symbol": "XRP",
        "rank": 8,
        "circulating_supply": 46946349017,
        "total_supply": 99990191217,
        "max_supply": 100000000000,
        "beta_value": 1.16049,
        "first_data_at": "2013-08-04T00:00:00Z",
        "last_updated": "2021-10-22T18:11:05Z",
        "quotes": {
          "USD": {
            "price": 1.0887286285922,
            "volume_24h": 2905602038.9804,
            "volume_24h_change_24h": -20.45,
            "market_cap": 51111834182,
            "market_cap_change_24h": -1.25,
            "percent_change_15m": 0.18,
            "percent_change_30m": -0.06,
            "percent_change_1h": -0.79,
            "percent_change_6h": -1.17,
            "percent_change_12h": -1.62,
            "percent_change_24h": -1.25,
            "percent_change_7d": -4.38,
            "percent_change_30d": 9.93,
            "percent_change_1y": 315.38,
            "ath_price": 3.84194,
            "ath_date": "2018-01-04T07:14:00Z",
            "percent_from_price_ath": -71.66
          }
        }
      },
      {
        "id": "dot-polkadot",
        "name": "Polkadot",
        "symbol": "DOT",
        "rank": 9,
        "circulating_supply": 852647705,
        "total_supply": 1103355567,
        "max_supply": 0,
        "beta_value": 1.20036,
        "first_data_at": "2020-08-21T00:00:00Z",
        "last_updated": "2021-10-22T18:11:14Z",
        "quotes": {
          "USD": {
            "price": 43.632696812692,
            "volume_24h": 1912290280.1219,
            "volume_24h_change_24h": -27.95,
            "market_cap": 37203318800,
            "market_cap_change_24h": 1.71,
            "percent_change_15m": -0.44,
            "percent_change_30m": -0.62,
            "percent_change_1h": -1.05,
            "percent_change_6h": -4.79,
            "percent_change_12h": -3.95,
            "percent_change_24h": 1.71,
            "percent_change_7d": 3.57,
            "percent_change_30d": 38.36,
            "percent_change_1y": 915.77,
            "ath_price": 49.65392627,
            "ath_date": "2021-05-15T03:56:42Z",
            "percent_from_price_ath": -11.99
          }
        }
      },
      {
        "id": "doge-dogecoin",
        "name": "Dogecoin",
        "symbol": "DOGE",
        "rank": 10,
        "circulating_supply": 131800649298,
        "total_supply": 131800649298,
        "max_supply": 0,
        "beta_value": 1.58018,
        "first_data_at": "2013-12-15T00:00:00Z",
        "last_updated": "2021-10-22T18:11:05Z",
        "quotes": {
          "USD": {
            "price": 0.23862371252039,
            "volume_24h": 1167679890.9021,
            "volume_24h_change_24h": -31.68,
            "market_cap": 31450760248,
            "market_cap_change_24h": -2.84,
            "percent_change_15m": 0.2,
            "percent_change_30m": -0.04,
            "percent_change_1h": -0.36,
            "percent_change_6h": -3,
            "percent_change_12h": -3.24,
            "percent_change_24h": -2.85,
            "percent_change_7d": 2,
            "percent_change_30d": 5.92,
            "percent_change_1y": 8792.94,
            "ath_price": 0.75287027,
            "ath_date": "2021-05-08T05:02:22Z",
            "percent_from_price_ath": -68.3
          }
        }
      },
      {
        "id": "usdc-usd-coin",
        "name": "USD Coin",
        "symbol": "USDC",
        "rank": 11,
        "circulating_supply": 25328680874,
        "total_supply": 25328680874,
        "max_supply": 0,
        "beta_value": -0.000618426,
        "first_data_at": "2018-10-09T00:00:00Z",
        "last_updated": "2021-10-22T18:11:10Z",
        "quotes": {
          "USD": {
            "price": 1.0008304742368,
            "volume_24h": 2086594032.1043,
            "volume_24h_change_24h": -14.45,
            "market_cap": 25349715690,
            "market_cap_change_24h": 0.02,
            "percent_change_15m": 0.02,
            "percent_change_30m": 0.01,
            "percent_change_1h": -0.03,
            "percent_change_6h": 0.06,
            "percent_change_12h": 0.03,
            "percent_change_24h": 0.02,
            "percent_change_7d": 0.02,
            "percent_change_30d": 0.12,
            "percent_change_1y": -0.05,
            "ath_price": 1.90619801,
            "ath_date": "2018-10-11T06:36:14Z",
            "percent_from_price_ath": -47.5
          }
        }
      },
      {
        "id": "luna-terra",
        "name": "Terra",
        "symbol": "LUNA",
        "rank": 12,
        "circulating_supply": 417332546,
        "total_supply": 995193878,
        "max_supply": 0,
        "beta_value": 1.16017,
        "first_data_at": "2019-08-07T00:00:00Z",
        "last_updated": "2021-10-22T18:11:12Z",
        "quotes": {
          "USD": {
            "price": 43.821941875825,
            "volume_24h": 988245122.82257,
            "volume_24h_change_24h": -3.14,
            "market_cap": 18288322573,
            "market_cap_change_24h": 8.36,
            "percent_change_15m": 1.97,
            "percent_change_30m": 1.69,
            "percent_change_1h": 1.33,
            "percent_change_6h": -1.27,
            "percent_change_12h": 2.28,
            "percent_change_24h": 8.36,
            "percent_change_7d": 17.65,
            "percent_change_30d": 39.57,
            "percent_change_1y": 13584.16,
            "ath_price": 49.31973547114,
            "ath_date": "2021-10-04T16:56:21Z",
            "percent_from_price_ath": -12.23
          }
        }
      },
      {
        "id": "uni-uniswap",
        "name": "Uniswap",
        "symbol": "UNI",
        "rank": 13,
        "circulating_supply": 575202575,
        "total_supply": 1000000000,
        "max_supply": 0,
        "beta_value": 1.18284,
        "first_data_at": "2020-09-17T00:00:00Z",
        "last_updated": "2021-10-22T18:11:14Z",
        "quotes": {
          "USD": {
            "price": 25.699900580501,
            "volume_24h": 200640197.41492,
            "volume_24h_change_24h": -35.65,
            "market_cap": 14782648991,
            "market_cap_change_24h": -2.34,
            "percent_change_15m": 0.22,
            "percent_change_30m": 0.03,
            "percent_change_1h": -0.45,
            "percent_change_6h": -3.61,
            "percent_change_12h": -3.3,
            "percent_change_24h": -2.34,
            "percent_change_7d": -1.14,
            "percent_change_30d": 19.79,
            "percent_change_1y": 720.31,
            "ath_price": 45.01251094,
            "ath_date": "2021-05-03T04:18:19Z",
            "percent_from_price_ath": -42.99
          }
        }
      },
      {
        "id": "avax-avalanche",
        "name": "Avalanche",
        "symbol": "AVAX",
        "rank": 14,
        "circulating_supply": 220286577,
        "total_supply": 377752194,
        "max_supply": 0,
        "beta_value": 1.19425,
        "first_data_at": "2020-08-07T00:00:00Z",
        "last_updated": "2021-10-22T18:11:13Z",
        "quotes": {
          "USD": {
            "price": 65.995575505791,
            "volume_24h": 1185701916.4612,
            "volume_24h_change_24h": 29.67,
            "market_cap": 14537939425,
            "market_cap_change_24h": 9.98,
            "percent_change_15m": 0.3,
            "percent_change_30m": -0.21,
            "percent_change_1h": -1.3,
            "percent_change_6h": 1.75,
            "percent_change_12h": 0.38,
            "percent_change_24h": 9.98,
            "percent_change_7d": 17.27,
            "percent_change_30d": -7.26,
            "percent_change_1y": 1387.01,
            "ath_price": 79.484838442321,
            "ath_date": "2021-09-23T08:06:21Z",
            "percent_from_price_ath": -17.14
          }
        }
      },
      {
        "id": "shib-shiba-inu",
        "name": "Shiba Inu",
        "symbol": "SHIB",
        "rank": 15,
        "circulating_supply": 489560000000000,
        "total_supply": 1000000000000000,
        "max_supply": 1000000000000000,
        "beta_value": 1.18114,
        "first_data_at": "2021-05-10T00:00:00Z",
        "last_updated": "2021-10-22T18:09:46Z",
        "quotes": {
          "USD": {
            "price": 0.000027923933404345,
            "volume_24h": 27923933.404345,
            "volume_24h_change_24h": 1.53,
            "market_cap": 13670440837,
            "market_cap_change_24h": 1.53,
            "percent_change_15m": 0.05,
            "percent_change_30m": 0.08,
            "percent_change_1h": 0.69,
            "percent_change_6h": -0.37,
            "percent_change_12h": 1.99,
            "percent_change_24h": 1.53,
            "percent_change_7d": 13.05,
            "percent_change_30d": 283.74,
            "percent_change_1y": 0,
            "ath_price": 0.00003797,
            "ath_date": "2021-05-10T22:51:40Z",
            "percent_from_price_ath": -26.46
          }
        }
      },
      {
...
```

<details>
<summary>Additional Examples</summary>

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "volume",
    "resultPath": "volume_24h",
    "base": "ETH",
    "quote": "USD"
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "payload": [
      {
        "id": "btc-bitcoin",
        "name": "Bitcoin",
        "symbol": "BTC",
        "rank": 1,
        "circulating_supply": 18851169,
        "total_supply": 18851169,
        "max_supply": 21000000,
        "beta_value": 0.932555,
        "first_data_at": "2010-07-17T00:00:00Z",
        "last_updated": "2021-10-22T18:11:05Z",
        "quotes": {
          "USD": {
            "price": 60697.885839641,
            "volume_24h": 49092990352.954,
            "volume_24h_change_24h": -22.62,
            "market_cap": 1144226103905,
            "market_cap_change_24h": -3.78,
            "percent_change_15m": 0.04,
            "percent_change_30m": -0.17,
            "percent_change_1h": -0.73,
            "percent_change_6h": -4.15,
            "percent_change_12h": -3.81,
            "percent_change_24h": -3.78,
            "percent_change_7d": -1.51,
            "percent_change_30d": 38.36,
            "percent_change_1y": 364.42,
            "ath_price": 66890.890314799,
            "ath_date": "2021-10-20T16:06:13Z",
            "percent_from_price_ath": -9.26
          }
        }
      },
      {
        "id": "eth-ethereum",
        "name": "Ethereum",
        "symbol": "ETH",
        "rank": 2,
        "circulating_supply": 118033526,
        "total_supply": 118033574,
        "max_supply": 0,
        "beta_value": 1.08967,
        "first_data_at": "2015-08-07T00:00:00Z",
        "last_updated": "2021-10-22T18:11:05Z",
        "quotes": {
          "USD": {
            "price": 3949.2425813062,
            "volume_24h": 24136641726.138,
            "volume_24h_change_24h": -35.07,
            "market_cap": 466143026900,
            "market_cap_change_24h": -3.44,
            "percent_change_15m": 0.14,
            "percent_change_30m": -0.18,
            "percent_change_1h": -0.64,
            "percent_change_6h": -4.09,
            "percent_change_12h": -4.65,
            "percent_change_24h": -3.45,
            "percent_change_7d": 2.23,
            "percent_change_30d": 28.11,
            "percent_change_1y": 844.08,
            "ath_price": 4365.2053035,
            "ath_date": "2021-05-12T06:06:20Z",
            "percent_from_price_ath": -9.53
          }
        }
      },
      {
        "id": "hex-hex",
        "name": "HEX",
        "symbol": "HEX",
        "rank": 3,
        "circulating_supply": 286375254190,
        "total_supply": 635492436682,
        "max_supply": 0,
        "beta_value": 0.464951,
        "first_data_at": "2019-12-14T00:00:00Z",
        "last_updated": "2021-10-22T18:11:13Z",
        "quotes": {
          "USD": {
            "price": 0.28611624619529,
            "volume_24h": 24824970.353259,
            "volume_24h_change_24h": -35.6,
            "market_cap": 81936612732,
            "market_cap_change_24h": 2.89,
            "percent_change_15m": 0.55,
            "percent_change_30m": 0.68,
            "percent_change_1h": 0.79,
            "percent_change_6h": 1.91,
            "percent_change_12h": 2.29,
            "percent_change_24h": 2.87,
            "percent_change_7d": -6.85,
            "percent_change_30d": -34.79,
            "percent_change_1y": 4934.43,
            "ath_price": 0.51106460487545,
            "ath_date": "2021-09-19T06:36:21Z",
            "percent_from_price_ath": -44.11
          }
        }
      },
      {
        "id": "bnb-binance-coin",
        "name": "Binance Coin",
        "symbol": "BNB",
        "rank": 4,
        "circulating_supply": 153432897,
        "total_supply": 166801148,
        "max_supply": 200000000,
        "beta_value": 1.12437,
        "first_data_at": "2017-07-25T00:00:00Z",
        "last_updated": "2021-10-22T18:11:07Z",
        "quotes": {
          "USD": {
            "price": 479.94841142545,
            "volume_24h": 2535946253.9608,
            "volume_24h_change_24h": -19.94,
            "market_cap": 73639875175,
            "market_cap_change_24h": 1.35,
            "percent_change_15m": 0.05,
            "percent_change_30m": -0.23,
            "percent_change_1h": -0.61,
            "percent_change_6h": -2.3,
            "percent_change_12h": 0.08,
            "percent_change_24h": 1.35,
            "percent_change_7d": 3.27,
            "percent_change_30d": 24.74,
            "percent_change_1y": 1455.79,
            "ath_price": 690.56767219,
            "ath_date": "2021-05-10T06:31:21Z",
            "percent_from_price_ath": -30.59
          }
        }
      },
      {
        "id": "usdt-tether",
        "name": "Tether",
        "symbol": "USDT",
        "rank": 5,
        "circulating_supply": 70415110815,
        "total_supply": 70415110815,
        "max_supply": 0,
        "beta_value": 0.00148463,
        "first_data_at": "2015-02-25T00:00:00Z",
        "last_updated": "2021-10-22T18:11:07Z",
        "quotes": {
          "USD": {
            "price": 0.99993405402971,
            "volume_24h": 76270541122.634,
            "volume_24h_change_24h": -18.14,
            "market_cap": 70410467222,
            "market_cap_change_24h": 0.35,
            "percent_change_15m": -0.1,
            "percent_change_30m": -0.13,
            "percent_change_1h": -0.07,
            "percent_change_6h": -0.06,
            "percent_change_12h": -0.1,
            "percent_change_24h": -0.03,
            "percent_change_7d": -0.08,
            "percent_change_30d": 0.14,
            "percent_change_1y": -0.11,
            "ath_price": 1.21549,
            "ath_date": "2015-02-25T17:04:00Z",
            "percent_from_price_ath": -17.67
          }
        }
      },
      {
        "id": "ada-cardano",
        "name": "Cardano",
        "symbol": "ADA",
        "rank": 6,
        "circulating_supply": 31946328269,
        "total_supply": 32704886184,
        "max_supply": 45000000000,
        "beta_value": 1.00646,
        "first_data_at": "2017-10-01T00:00:00Z",
        "last_updated": "2021-10-22T18:11:05Z",
        "quotes": {
          "USD": {
            "price": 2.1477434703293,
            "volume_24h": 2431508237.5173,
            "volume_24h_change_24h": -35.7,
            "market_cap": 68612517940,
            "market_cap_change_24h": -0.66,
            "percent_change_15m": 0.01,
            "percent_change_30m": -0.12,
            "percent_change_1h": -0.35,
            "percent_change_6h": -1.75,
            "percent_change_12h": -2.72,
            "percent_change_24h": -0.66,
            "percent_change_7d": -3.54,
            "percent_change_30d": -3.98,
            "percent_change_1y": 1839.46,
            "ath_price": 3.0950278974839,
            "ath_date": "2021-09-02T06:01:10Z",
            "percent_from_price_ath": -30.61
          }
        }
      },
      {
        "id": "sol-solana",
        "name": "Solana",
        "symbol": "SOL",
        "rank": 7,
        "circulating_supply": 273556026,
        "total_supply": 494519162,
        "max_supply": 0,
        "beta_value": 0.873294,
        "first_data_at": "2020-08-26T00:00:00Z",
        "last_updated": "2021-10-22T18:11:13Z",
        "quotes": {
          "USD": {
            "price": 203.80848966283,
            "volume_24h": 4601854664.2556,
            "volume_24h_change_24h": 9.54,
            "market_cap": 55753040497,
            "market_cap_change_24h": 11.38,
            "percent_change_15m": 0.31,
            "percent_change_30m": 0.11,
            "percent_change_1h": -1.15,
            "percent_change_6h": 0.66,
            "percent_change_12h": -0.44,
            "percent_change_24h": 11.38,
            "percent_change_7d": 26.04,
            "percent_change_30d": 37.25,
            "percent_change_1y": 9810.01,
            "ath_price": 213.85081401179,
            "ath_date": "2021-09-09T02:21:20Z",
            "percent_from_price_ath": -4.91
          }
        }
      },
      {
        "id": "xrp-xrp",
        "name": "XRP",
        "symbol": "XRP",
        "rank": 8,
        "circulating_supply": 46946349017,
        "total_supply": 99990191217,
        "max_supply": 100000000000,
        "beta_value": 1.16049,
        "first_data_at": "2013-08-04T00:00:00Z",
        "last_updated": "2021-10-22T18:11:05Z",
        "quotes": {
          "USD": {
            "price": 1.0887286285922,
            "volume_24h": 2905602038.9804,
            "volume_24h_change_24h": -20.45,
            "market_cap": 51111834182,
            "market_cap_change_24h": -1.25,
            "percent_change_15m": 0.18,
            "percent_change_30m": -0.06,
            "percent_change_1h": -0.79,
            "percent_change_6h": -1.17,
            "percent_change_12h": -1.62,
            "percent_change_24h": -1.25,
            "percent_change_7d": -4.38,
            "percent_change_30d": 9.93,
            "percent_change_1y": 315.38,
            "ath_price": 3.84194,
            "ath_date": "2018-01-04T07:14:00Z",
            "percent_from_price_ath": -71.66
          }
        }
      },
      {
        "id": "dot-polkadot",
        "name": "Polkadot",
        "symbol": "DOT",
        "rank": 9,
        "circulating_supply": 852647705,
        "total_supply": 1103355567,
        "max_supply": 0,
        "beta_value": 1.20036,
        "first_data_at": "2020-08-21T00:00:00Z",
        "last_updated": "2021-10-22T18:11:14Z",
        "quotes": {
          "USD": {
            "price": 43.632696812692,
            "volume_24h": 1912290280.1219,
            "volume_24h_change_24h": -27.95,
            "market_cap": 37203318800,
            "market_cap_change_24h": 1.71,
            "percent_change_15m": -0.44,
            "percent_change_30m": -0.62,
            "percent_change_1h": -1.05,
            "percent_change_6h": -4.79,
            "percent_change_12h": -3.95,
            "percent_change_24h": 1.71,
            "percent_change_7d": 3.57,
            "percent_change_30d": 38.36,
            "percent_change_1y": 915.77,
            "ath_price": 49.65392627,
            "ath_date": "2021-05-15T03:56:42Z",
            "percent_from_price_ath": -11.99
          }
        }
      },
      {
        "id": "doge-dogecoin",
        "name": "Dogecoin",
        "symbol": "DOGE",
        "rank": 10,
        "circulating_supply": 131800649298,
        "total_supply": 131800649298,
        "max_supply": 0,
        "beta_value": 1.58018,
        "first_data_at": "2013-12-15T00:00:00Z",
        "last_updated": "2021-10-22T18:11:05Z",
        "quotes": {
          "USD": {
            "price": 0.23862371252039,
            "volume_24h": 1167679890.9021,
            "volume_24h_change_24h": -31.68,
            "market_cap": 31450760248,
            "market_cap_change_24h": -2.84,
            "percent_change_15m": 0.2,
            "percent_change_30m": -0.04,
            "percent_change_1h": -0.36,
            "percent_change_6h": -3,
            "percent_change_12h": -3.24,
            "percent_change_24h": -2.85,
            "percent_change_7d": 2,
            "percent_change_30d": 5.92,
            "percent_change_1y": 8792.94,
            "ath_price": 0.75287027,
            "ath_date": "2021-05-08T05:02:22Z",
            "percent_from_price_ath": -68.3
          }
        }
      },
      {
        "id": "usdc-usd-coin",
        "name": "USD Coin",
        "symbol": "USDC",
        "rank": 11,
        "circulating_supply": 25328680874,
        "total_supply": 25328680874,
        "max_supply": 0,
        "beta_value": -0.000618426,
        "first_data_at": "2018-10-09T00:00:00Z",
        "last_updated": "2021-10-22T18:11:10Z",
        "quotes": {
          "USD": {
            "price": 1.0008304742368,
            "volume_24h": 2086594032.1043,
            "volume_24h_change_24h": -14.45,
            "market_cap": 25349715690,
            "market_cap_change_24h": 0.02,
            "percent_change_15m": 0.02,
            "percent_change_30m": 0.01,
            "percent_change_1h": -0.03,
            "percent_change_6h": 0.06,
            "percent_change_12h": 0.03,
            "percent_change_24h": 0.02,
            "percent_change_7d": 0.02,
            "percent_change_30d": 0.12,
            "percent_change_1y": -0.05,
            "ath_price": 1.90619801,
            "ath_date": "2018-10-11T06:36:14Z",
            "percent_from_price_ath": -47.5
          }
        }
      },
      {
        "id": "luna-terra",
        "name": "Terra",
        "symbol": "LUNA",
        "rank": 12,
        "circulating_supply": 417332546,
        "total_supply": 995193878,
        "max_supply": 0,
        "beta_value": 1.16017,
        "first_data_at": "2019-08-07T00:00:00Z",
        "last_updated": "2021-10-22T18:11:12Z",
        "quotes": {
          "USD": {
            "price": 43.821941875825,
            "volume_24h": 988245122.82257,
            "volume_24h_change_24h": -3.14,
            "market_cap": 18288322573,
            "market_cap_change_24h": 8.36,
            "percent_change_15m": 1.97,
            "percent_change_30m": 1.69,
            "percent_change_1h": 1.33,
            "percent_change_6h": -1.27,
            "percent_change_12h": 2.28,
            "percent_change_24h": 8.36,
            "percent_change_7d": 17.65,
            "percent_change_30d": 39.57,
            "percent_change_1y": 13584.16,
            "ath_price": 49.31973547114,
            "ath_date": "2021-10-04T16:56:21Z",
            "percent_from_price_ath": -12.23
          }
        }
      },
      {
        "id": "uni-uniswap",
        "name": "Uniswap",
        "symbol": "UNI",
        "rank": 13,
        "circulating_supply": 575202575,
        "total_supply": 1000000000,
        "max_supply": 0,
        "beta_value": 1.18284,
        "first_data_at": "2020-09-17T00:00:00Z",
        "last_updated": "2021-10-22T18:11:14Z",
        "quotes": {
          "USD": {
            "price": 25.699900580501,
            "volume_24h": 200640197.41492,
            "volume_24h_change_24h": -35.65,
            "market_cap": 14782648991,
            "market_cap_change_24h": -2.34,
            "percent_change_15m": 0.22,
            "percent_change_30m": 0.03,
            "percent_change_1h": -0.45,
            "percent_change_6h": -3.61,
            "percent_change_12h": -3.3,
            "percent_change_24h": -2.34,
            "percent_change_7d": -1.14,
            "percent_change_30d": 19.79,
            "percent_change_1y": 720.31,
            "ath_price": 45.01251094,
            "ath_date": "2021-05-03T04:18:19Z",
            "percent_from_price_ath": -42.99
          }
        }
      },
      {
        "id": "avax-avalanche",
        "name": "Avalanche",
        "symbol": "AVAX",
        "rank": 14,
        "circulating_supply": 220286577,
        "total_supply": 377752194,
        "max_supply": 0,
        "beta_value": 1.19425,
        "first_data_at": "2020-08-07T00:00:00Z",
        "last_updated": "2021-10-22T18:11:13Z",
        "quotes": {
          "USD": {
            "price": 65.995575505791,
            "volume_24h": 1185701916.4612,
            "volume_24h_change_24h": 29.67,
            "market_cap": 14537939425,
            "market_cap_change_24h": 9.98,
            "percent_change_15m": 0.3,
            "percent_change_30m": -0.21,
            "percent_change_1h": -1.3,
            "percent_change_6h": 1.75,
            "percent_change_12h": 0.38,
            "percent_change_24h": 9.98,
            "percent_change_7d": 17.27,
            "percent_change_30d": -7.26,
            "percent_change_1y": 1387.01,
            "ath_price": 79.484838442321,
            "ath_date": "2021-09-23T08:06:21Z",
            "percent_from_price_ath": -17.14
          }
        }
      },
      {
        "id": "shib-shiba-inu",
        "name": "Shiba Inu",
        "symbol": "SHIB",
        "rank": 15,
        "circulating_supply": 489560000000000,
        "total_supply": 1000000000000000,
        "max_supply": 1000000000000000,
        "beta_value": 1.18114,
        "first_data_at": "2021-05-10T00:00:00Z",
        "last_updated": "2021-10-22T18:09:46Z",
        "quotes": {
          "USD": {
            "price": 0.000027923933404345,
            "volume_24h": 27923933.404345,
            "volume_24h_change_24h": 1.53,
            "market_cap": 13670440837,
            "market_cap_change_24h": 1.53,
            "percent_change_15m": 0.05,
            "percent_change_30m": 0.08,
            "percent_change_1h": 0.69,
            "percent_change_6h": -0.37,
            "percent_change_12h": 1.99,
            "percent_change_24h": 1.53,
            "percent_change_7d": 13.05,
            "percent_change_30d": 283.74,
            "percent_change_1y": 0,
            "ath_price": 0.00003797,
            "ath_date": "2021-05-10T22:51:40Z",
            "percent_from_price_ath": -26.46
          }
        }
      },
      {
...
```

</details>

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

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "dominance",
    "market": "BTC"
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "market_cap_usd": 2559344984924,
    "volume_24h_usd": 217605673763,
    "bitcoin_dominance_percentage": 44.68,
    "cryptocurrencies_number": 5438,
    "market_cap_ath_value": 2729904005915,
    "market_cap_ath_date": "2021-10-21T09:45:00Z",
    "volume_24h_ath_value": 33401557439370,
    "volume_24h_ath_date": "2021-10-22T12:50:00Z",
    "volume_24h_percent_from_ath": -99.35,
    "volume_24h_percent_to_ath": 9999.99,
    "market_cap_change_24h": -1.86,
    "volume_24h_change_24h": -18.21,
    "last_updated": 1634927806,
    "result": 44.68
  },
  "result": 44.68,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

## GlobalMarketcap Endpoint

Returns the global market capitilization from the [global endpoint](https://api.coinpaprika.com/v1/global)

`globalmarketcap` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  |    Aliases    |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | market | `quote`, `to` | The symbol of the currency to convert to | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "globalmarketcap",
    "market": "USD"
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "market_cap_usd": 2559344984924,
    "volume_24h_usd": 217605673763,
    "bitcoin_dominance_percentage": 44.68,
    "cryptocurrencies_number": 5438,
    "market_cap_ath_value": 2729904005915,
    "market_cap_ath_date": "2021-10-21T09:45:00Z",
    "volume_24h_ath_value": 33401557439370,
    "volume_24h_ath_date": "2021-10-22T12:50:00Z",
    "volume_24h_percent_from_ath": -99.35,
    "volume_24h_percent_to_ath": 9999.99,
    "market_cap_change_24h": -1.86,
    "volume_24h_change_24h": -18.21,
    "last_updated": 1634927806,
    "result": 2559344984924
  },
  "result": 2559344984924,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

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
