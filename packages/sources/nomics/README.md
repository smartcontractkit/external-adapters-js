# Chainlink External Adapter for Nomics

![1.2.1](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/nomics/package.json)

An API key that can be obtained from [here](https://p.nomics.com/pricing#free-plan)

Base URL https://api.nomics.com/v1

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |                                     Description                                     |  Type  | Options |           Default           |
| :-------: | :----------: | :---------------------------------------------------------------------------------: | :----: | :-----: | :-------------------------: |
|    ✅     |   API_KEY    | An API key that can be obtained from [here](https://p.nomics.com/pricing#free-plan) | string |         |                             |
|           | API_ENDPOINT |                                                                                     | string |         | `https://api.nomics.com/v1` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                                                                            Options                                                                                             | Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint), [filtered](#filtered-endpoint), [globalmarketcap](#globalmarketcap-endpoint), [marketcap](#crypto-endpoint), [price](#crypto-endpoint), [volume](#crypto-endpoint) | `crypto` |

## Globalmarketcap Endpoint

`globalmarketcap` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

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
    "num_currencies": "24172",
    "num_currencies_active": "12010",
    "num_currencies_inactive": "10304",
    "num_currencies_dead": "1858",
    "num_currencies_new": "634",
    "market_cap": "2810702841731",
    "transparent_market_cap": "2772966848738",
    "1d": {
      "market_cap_change": "-81760031916",
      "market_cap_change_pct": "-0.0283",
      "transparent_market_cap_change": "-85983424503",
      "transparent_market_cap_change_pct": "-0.0301",
      "volume": "317214811077.86",
      "volume_change": "112969630413.96",
      "volume_change_pct": "0.5531",
      "spot_volume": "156280912797.38",
      "spot_volume_change": "43543634629.40",
      "spot_volume_change_pct": "0.3862",
      "derivative_volume": "160933898280.48",
      "derivative_volume_change": "69425995784.56",
      "derivative_volume_change_pct": "0.7587",
      "transparent_volume": "160700181433.68",
      "transparent_volume_change": "66061287717.04",
      "transparent_volume_change_pct": "0.6980",
      "transparent_spot_volume": "73103234121.48",
      "transparent_spot_volume_change": "24666531974.40",
      "transparent_spot_volume_change_pct": "0.5093",
      "transparent_derivative_volume": "87596947312.21",
      "transparent_derivative_volume_change": "41394755742.64",
      "transparent_derivative_volume_change_pct": "0.8959",
      "volume_transparency": [
        {
          "grade": "?",
          "volume": "509175452.31",
          "volume_change": "110097495.11",
          "volume_change_pct": "0.2759"
        },
        {
          "grade": "A",
          "volume": "160700181433.68",
          "volume_change": "66061287717.04",
          "volume_change_pct": "0.6980"
        },
        {
          "grade": "B",
          "volume": "915611304.68",
          "volume_change": "278513428.95",
          "volume_change_pct": "0.4372"
        },
        {
          "grade": "C",
          "volume": "128294596659.22",
          "volume_change": "38918655321.71",
          "volume_change_pct": "0.4354"
        },
        {
          "grade": "D",
          "volume": "26795246227.96",
          "volume_change": "7601076451.15",
          "volume_change_pct": "0.3960"
        }
      ]
    },
    "7d": {
      "market_cap_change": "133817807098",
      "market_cap_change_pct": "0.0500",
      "transparent_market_cap_change": "122382963718",
      "transparent_market_cap_change_pct": "0.0462",
      "volume": "1678179630654.39",
      "volume_change": "136932986966.87",
      "volume_change_pct": "0.0888",
      "spot_volume": "925125451205.28",
      "spot_volume_change": "19319541696.44",
      "spot_volume_change_pct": "0.0213",
      "derivative_volume": "753054179449.11",
      "derivative_volume_change": "117613445270.43",
      "derivative_volume_change_pct": "0.1851",
      "transparent_volume": "777466328908.29",
      "transparent_volume_change": "99384242241.57",
      "transparent_volume_change_pct": "0.1466",
      "transparent_spot_volume": "391408085573.40",
      "transparent_spot_volume_change": "33076040999.01",
      "transparent_spot_volume_change_pct": "0.0923",
      "transparent_derivative_volume": "386058243334.88",
      "transparent_derivative_volume_change": "66308201242.56",
      "transparent_derivative_volume_change_pct": "0.2074",
      "volume_transparency": [
        {
          "grade": "?",
          "volume": "3586555090.38",
          "volume_change": "-1483190368.87",
          "volume_change_pct": "-0.2926"
        },
        {
          "grade": "A",
          "volume": "777466328908.29",
          "volume_change": "99384242241.57",
          "volume_change_pct": "0.1466"
        },
        {
          "grade": "B",
          "volume": "4581070734.00",
          "volume_change": "1300964130.59",
          "volume_change_pct": "0.3966"
        },
        {
          "grade": "C",
          "volume": "713343055661.56",
          "volume_change": "20752999272.90",
          "volume_change_pct": "0.0300"
        },
        {
          "grade": "D",
          "volume": "179202620260.17",
          "volume_change": "16977971690.68",
          "volume_change_pct": "0.1047"
        }
      ]
    },
    "30d": {
      "market_cap_change": "738137877059",
      "market_cap_change_pct": "0.3561",
      "transparent_market_cap_change": "721336097805",
      "transparent_market_cap_change_pct": "0.3516",
      "volume": "6991109117785.84",
      "volume_change": "-818218047180.97",
      "volume_change_pct": "-0.1048",
      "spot_volume": "3988274504656.83",
      "spot_volume_change": "-521427367845.17",
      "spot_volume_change_pct": "-0.1156",
      "derivative_volume": "3002834613129.00",
      "derivative_volume_change": "-296790679335.80",
      "derivative_volume_change_pct": "-0.0899",
      "transparent_volume": "3010765779916.97",
      "transparent_volume_change": "-308128779427.33",
      "transparent_volume_change_pct": "-0.0928",
      "transparent_spot_volume": "1494527609039.38",
      "transparent_spot_volume_change": "-66787778079.29",
      "transparent_spot_volume_change_pct": "-0.0428",
      "transparent_derivative_volume": "1516238170877.60",
      "transparent_derivative_volume_change": "-241341001348.04",
      "transparent_derivative_volume_change_pct": "-0.1373",
      "volume_transparency": [
        {
          "grade": "?",
          "volume": "23900036939.58",
          "volume_change": "-616680256.93",
          "volume_change_pct": "-0.0252"
        },
        {
          "grade": "A",
          "volume": "3010765779916.97",
          "volume_change": "-308128779427.33",
          "volume_change_pct": "-0.0928"
        },
        {
          "grade": "B",
          "volume": "16456046668.46",
          "volume_change": "-6875654381.54",
          "volume_change_pct": "-0.2947"
        },
        {
          "grade": "C",
          "volume": "3222054873300.98",
          "volume_change": "-458977465193.66",
          "volume_change_pct": "-0.1247"
        },
        {
          "grade": "D",
          "volume": "717932380959.85",
          "volume_change": "-43619467921.51",
          "volume_change_pct": "-0.0573"
        }
      ]
    },
    "365d": {
      "market_cap_change": "2411266607931",
      "market_cap_change_pct": "6.0367",
      "transparent_market_cap_change": "2381879063836",
      "transparent_market_cap_change_pct": "6.0904",
      "volume": "95868595450353.06",
      "volume_change": "66756261027964.13",
      "volume_change_pct": "2.2931",
      "spot_volume": "60342189016182.44",
      "spot_volume_change": "39369235403735.30",
      "spot_volume_change_pct": "1.8771",
      "derivative_volume": "35526406434170.62",
      "derivative_volume_change": "27387025624228.84",
      "derivative_volume_change_pct": "3.3648",
      "transparent_volume": "32416670571023.07",
      "transparent_volume_change": "27685897039481.33",
      "transparent_volume_change_pct": "5.8523",
      "transparent_spot_volume": "15642971063419.21",
      "transparent_spot_volume_change": "13385636180069.97",
      "transparent_spot_volume_change_pct": "5.9298",
      "transparent_derivative_volume": "16773699507603.85",
      "transparent_derivative_volume_change": "14300260859411.36",
      "transparent_derivative_volume_change_pct": "5.7815",
      "volume_transparency": [
        {
          "grade": "?",
          "volume": "348963166263.54",
          "volume_change": "102113300661.07",
          "volume_change_pct": "0.4137"
        },
        {
          "grade": "A",
          "volume": "32416670571023.07",
          "volume_change": "27685897039481.33",
          "volume_change_pct": "5.8523"
        },
        {
          "grade": "B",
          "volume": "228291075387.55",
          "volume_change": "212108485907.22",
          "volume_change_pct": "13.1072"
        },
        {
          "grade": "C",
          "volume": "52003599572755.05",
          "volume_change": "31691847127271.11",
          "volume_change_pct": "1.5603"
        },
        {
          "grade": "D",
          "volume": "10871071064923.85",
          "volume_change": "7064295074643.41",
          "volume_change_pct": "1.8557"
        }
      ]
    },
    "ytd": {
      "market_cap_change": "2020533672003",
      "market_cap_change_pct": "2.5571",
      "transparent_market_cap_change": "1986313478555",
      "transparent_market_cap_change_pct": "2.5250",
      "volume": "86852902810794.07",
      "volume_change": "58977166181926.62",
      "volume_change_pct": "2.1157",
      "spot_volume": "54610828306303.37",
      "spot_volume_change": "35693218101476.11",
      "spot_volume_change_pct": "1.8868",
      "derivative_volume": "32242074504490.70",
      "derivative_volume_change": "23283948080450.51",
      "derivative_volume_change_pct": "2.5992",
      "transparent_volume": "30169806907413.50",
      "transparent_volume_change": "24813313866015.31",
      "transparent_volume_change_pct": "4.6324",
      "transparent_spot_volume": "14719251082847.68",
      "transparent_spot_volume_change": "12320214596570.29",
      "transparent_spot_volume_change_pct": "5.1355",
      "transparent_derivative_volume": "15450555824565.82",
      "transparent_derivative_volume_change": "12493099269445.03",
      "transparent_derivative_volume_change_pct": "4.2243",
      "volume_transparency": [
        {
          "grade": "?",
          "volume": "329438990964.83",
          "volume_change": "226073976998.45",
          "volume_change_pct": "2.1871"
        },
        {
          "grade": "A",
          "volume": "30169806907413.50",
          "volume_change": "24813313866015.31",
          "volume_change_pct": "4.6324"
        },
        {
          "grade": "B",
          "volume": "217993808242.65",
          "volume_change": "195365836965.32",
          "volume_change_pct": "8.6338"
        },
        {
          "grade": "C",
          "volume": "46418754540774.65",
          "volume_change": "28095920871370.33",
          "volume_change_pct": "1.5334"
        },
        {
          "grade": "D",
          "volume": "9716908563398.44",
          "volume_change": "5646491630577.20",
          "volume_change_pct": "1.3872"
        }
      ]
    },
    "result": 2810702841731
  },
  "result": 2810702841731,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

## Crypto Endpoint

The `crypto` endpoint fetches the price of a requested asset, the `marketcap` endpoint fetches the market cap of the requested asset, and the `volume` endpoint fetches the volume of the requested pair of assets for past 24-hr.

**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.**

Supported names for this endpoint are: `crypto`, `marketcap`, `price`, `volume`.

### Input Params

| Required? | Name  |          Aliases          |               Description                | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :-----------------------: | :--------------------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  |   `coin`, `from`, `ids`   |   The symbol of the currency to query    |      |         |         |            |                |
|    ✅     | quote | `convert`, `market`, `to` | The symbol of the currency to convert to |      |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "crypto",
    "resultPath": "price",
    "base": "BTC",
    "quote": "EUR"
  },
  "debug": {
    "cacheKey": "ddvw8QbpkwL0/07MqB7W6GbRqvM=",
    "batchCacheKey": "hKkUywMJxqGMRItXo/4YOoaLMBg=",
    "batchChildrenCacheKeys": [
      [
        "ddvw8QbpkwL0/07MqB7W6GbRqvM=",
        {
          "id": "1",
          "data": {
            "endpoint": "crypto",
            "resultPath": "price",
            "base": "BTC",
            "quote": "EUR"
          }
        }
      ]
    ]
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
        "id": "BTC",
        "currency": "BTC",
        "symbol": "BTC",
        "name": "Bitcoin",
        "logo_url": "https://s3.us-east-2.amazonaws.com/nomics-api/static/images/currencies/btc.svg",
        "status": "active",
        "price": "53835.22386957",
        "price_date": "2021-10-21T00:00:00Z",
        "price_timestamp": "2021-10-21T15:30:00Z",
        "circulating_supply": "18850087",
        "max_supply": "21000000",
        "market_cap": "1014798653606",
        "market_cap_dominance": "0.4245",
        "num_exchanges": "393",
        "num_pairs": "66822",
        "num_pairs_unmapped": "5173",
        "first_candle": "2011-08-18T00:00:00Z",
        "first_trade": "2011-08-18T00:00:00Z",
        "first_order_book": "2017-01-06T00:00:00Z",
        "rank": "1",
        "rank_delta": "0",
        "high": "56821.74207234",
        "high_timestamp": "2021-10-20T00:00:00Z",
        "1d": {
          "volume": "59672098927.86",
          "price_change": "-3740.41307626",
          "price_change_pct": "-0.0650",
          "volume_change": "9411108116.34",
          "volume_change_pct": "0.1872",
          "market_cap_change": "-70444124156.62",
          "market_cap_change_pct": "-0.0649"
        },
        "7d": {
          "volume": "340415904564.69",
          "price_change": "4234.22920209",
          "price_change_pct": "0.0854",
          "volume_change": "34064322926.72",
          "volume_change_pct": "0.1112",
          "market_cap_change": "80137350489.75",
          "market_cap_change_pct": "0.0857"
        },
        "30d": {
          "volume": "1322928603400.34",
          "price_change": "19004.50426584",
          "price_change_pct": "0.5456",
          "volume_change": "4601628768.74",
          "volume_change_pct": "0.0035",
          "market_cap_change": "359204191024.20",
          "market_cap_change_pct": "0.5479"
        },
        "365d": {
          "volume": "18088290804856.42",
          "price_change": "42672.22203579",
          "price_change_pct": "3.8226",
          "volume_change": "8519743286667.40",
          "volume_change_pct": "0.8904",
          "market_cap_change": "808024495254.42",
          "market_cap_change_pct": "3.9078"
        },
        "ytd": {
          "volume": "16042819205085.65",
          "price_change": "26939.06851780",
          "price_change_pct": "1.0016",
          "volume_change": "8222431403654.91",
          "volume_change_pct": "1.0514",
          "market_cap_change": "514881347163.41",
          "market_cap_change_pct": "1.0299"
        }
      }
    ],
    "result": 53835.22386957
  },
  "result": 53835.22386957,
  "statusCode": 200,
  "debug": {
    "batchablePropertyPath": [
      {
        "name": "base"
      }
    ]
  },
  "providerStatusCode": 200
}
```

---

## Filtered Endpoint

Fetches the price of an asset using specified exchanges.

`filtered` is the only supported name for this endpoint.

### Input Params

| Required? |   Name    |       Aliases        |              Description               | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :-------: | :------------------: | :------------------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |   base    | `coin`, `from`, `id` |  The symbol of the currency to query   |      |         |         |            |                |
|    ✅     | exchanges |                      | Comma delimited list of exchange names |      |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "filtered",
    "resultPath": "price",
    "base": "LINK",
    "exchanges": "binance,coinbase"
  },
  "debug": {
    "cacheKey": "zpqIgVvEnh4X7tqChwaEz9+AiFM="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "currency": "LINK",
    "price": 77.77,
    "result": 77.77
  },
  "result": 77.77,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
