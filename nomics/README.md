# Chainlink External Adapter for Nomics

### Environment Variables

| Required? |  Name   |                                     Description                                     | Options | Defaults to |
| :-------: | :-----: | :---------------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | API_KEY | An API key that can be obtained from [here](https://p.nomics.com/pricing#free-plan) |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |                                       Options                                       | Defaults to |
| :-------: | :------: | :-----------------: | :---------------------------------------------------------------------------------: | :---------: |
|           | endpoint | The endpoint to use | [price](#Price-Endpoint), [globalmarketcap](#Global-Market-Capitalization-Endpoint) |    price    |

---

## Price Endpoint

### Input Params

| Required? |               Name                |               Description                | Options | Defaults to |
| :-------: | :-------------------------------: | :--------------------------------------: | :-----: | :---------: |
|    ✅     |   `base`, `from`, `coin`, `ids`   |   The symbol of the currency to query    |         |             |
|    ✅     | `quote`, `to`,`market`, `convert` | The symbol of the currency to convert to |         |             |
|    🟡     |   `overrides`   | If base provided is found in overrides, that will be used  | [Format](../presetSymbols.json)|             |

## Output

```json
{
  "jobRunID": "1",
  "data": {
    "id": "ETH",
    "currency": "ETH",
    "symbol": "ETH",
    "name": "Ethereum",
    "logo_url": "https://s3.us-east-2.amazonaws.com/nomics-api/static/images/currencies/eth.svg",
    "price": "212.14328234",
    "price_date": "2020-05-19T00:00:00Z",
    "price_timestamp": "2020-05-19T20:52:00Z",
    "circulating_supply": "110996094",
    "market_cap": "23547075774",
    "rank": "2",
    "high": "1395.34621699",
    "high_timestamp": "2018-01-13T00:00:00Z",
    "1d": {
      "volume": "14178248134.83",
      "price_change": "-0.73630137",
      "price_change_pct": "-0.0035",
      "volume_change": "-3197635063.30",
      "volume_change_pct": "-0.1840",
      "market_cap_change": "-78813252.83",
      "market_cap_change_pct": "-0.0033"
    },
    "7d": {
      "volume": "105111098844.29",
      "price_change": "13.96884812",
      "price_change_pct": "0.0705",
      "volume_change": "-32944402211.20",
      "volume_change_pct": "-0.2386",
      "market_cap_change": "1569366484.55",
      "market_cap_change_pct": "0.0714"
    },
    "30d": {
      "volume": "556970627008.05",
      "price_change": "37.39557368",
      "price_change_pct": "0.2140",
      "volume_change": "104685652955.51",
      "volume_change_pct": "0.2315",
      "market_cap_change": "4222249988.74",
      "market_cap_change_pct": "0.2185"
    },
    "365d": {
      "volume": "4017714095609.41",
      "price_change": "-57.46600124",
      "price_change_pct": "-0.2131",
      "volume_change": "3126412777223.25",
      "volume_change_pct": "3.5077",
      "market_cap_change": "-5069135546.65",
      "market_cap_change_pct": "-0.1771"
    },
    "ytd": {
      "volume": "2297193690835.99",
      "price_change": "70.90720621",
      "price_change_pct": "0.5020",
      "volume_change": "1245772581341.68",
      "volume_change_pct": "1.1848",
      "market_cap_change": "8139098374.82",
      "market_cap_change_pct": "0.5282"
    },
    "result": 212.14328234
  },
  "result": 212.14328234,
  "statusCode": 200
}
```

## Global Market Capitalization Endpoint

## Output

```json
{
  "jobRunID": "2",
  "data": {
    "num_currencies": "11996",
    "num_currencies_active": "4814",
    "num_currencies_inactive": "6118",
    "num_currencies_dead": "1064",
    "num_currencies_new": "735",
    "market_cap": "1378511244903",
    "transparent_market_cap": "1359550541086",
    "1d": {
      "market_cap_change": "-45151295457",
      "market_cap_change_pct": "-0.0317",
      "transparent_market_cap_change": "-42549876648",
      "transparent_market_cap_change_pct": "-0.0303",
      "volume": "258039036580.82",
      "volume_change": "13784474286.90",
      "volume_change_pct": "0.0564",
      "transparent_volume": "55640357579.68",
      "transparent_volume_change": "1918004148.04",
      "transparent_volume_change_pct": "0.0357",
      "volume_transparency": [
        {
          "grade": "?",
          "volume": "688460376.53",
          "volume_change": "-32099929.51",
          "volume_change_pct": "-0.0445"
        },
        {
          "grade": "A",
          "volume": "55749207985.85",
          "volume_change": "2013327125.70",
          "volume_change_pct": "0.0375"
        },
        {
          "grade": "B",
          "volume": "1213341177.30",
          "volume_change": "114222543.51",
          "volume_change_pct": "0.1039"
        },
        {
          "grade": "C",
          "volume": "141344893303.36",
          "volume_change": "13719226841.73",
          "volume_change_pct": "0.1075"
        },
        {
          "grade": "D",
          "volume": "59043133737.78",
          "volume_change": "-2030202294.53",
          "volume_change_pct": "-0.0332"
        }
      ]
    },
    "7d": {
      "market_cap_change": "224216447834",
      "market_cap_change_pct": "0.1942",
      "transparent_market_cap_change": "218401928553",
      "transparent_market_cap_change_pct": "0.1914",
      "volume": "1558702928385.47",
      "volume_change": "359446794644.48",
      "volume_change_pct": "0.2997",
      "transparent_volume": "338670639090.49",
      "transparent_volume_change": "94878735486.19",
      "transparent_volume_change_pct": "0.3892",
      "volume_transparency": [
        {
          "grade": "?",
          "volume": "4859417580.44",
          "volume_change": "1136169291.31",
          "volume_change_pct": "0.3052"
        },
        {
          "grade": "A",
          "volume": "340755588081.80",
          "volume_change": "96696599797.14",
          "volume_change_pct": "0.3962"
        },
        {
          "grade": "B",
          "volume": "7316235620.53",
          "volume_change": "2549523100.38",
          "volume_change_pct": "0.5349"
        },
        {
          "grade": "C",
          "volume": "871093380740.69",
          "volume_change": "160882329806.94",
          "volume_change_pct": "0.2265"
        },
        {
          "grade": "D",
          "volume": "334678306362.01",
          "volume_change": "98182172648.71",
          "volume_change_pct": "0.4152"
        }
      ]
    },
    "30d": {
      "market_cap_change": "416356723318",
      "market_cap_change_pct": "0.4327",
      "transparent_market_cap_change": "397674883386",
      "transparent_market_cap_change_pct": "0.4134",
      "volume": "5653908564464.01",
      "volume_change": "1601131203412.30",
      "volume_change_pct": "0.3951",
      "transparent_volume": "1067111587952.80",
      "transparent_volume_change": "404878968751.51",
      "transparent_volume_change_pct": "0.6114",
      "volume_transparency": [
        {
          "grade": "?",
          "volume": "16882677580.65",
          "volume_change": "2205558964.40",
          "volume_change_pct": "0.1503"
        },
        {
          "grade": "A",
          "volume": "1070763889348.68",
          "volume_change": "411903669832.29",
          "volume_change_pct": "0.6252"
        },
        {
          "grade": "B",
          "volume": "19913779679.12",
          "volume_change": "9738875450.37",
          "volume_change_pct": "0.9571"
        },
        {
          "grade": "C",
          "volume": "3322269755276.39",
          "volume_change": "951046406613.22",
          "volume_change_pct": "0.4011"
        },
        {
          "grade": "D",
          "volume": "1224078462579.18",
          "volume_change": "226236692552.01",
          "volume_change_pct": "0.2267"
        }
      ]
    },
    "365d": {
      "market_cap_change": "1081116974090",
      "market_cap_change_pct": "3.6353",
      "transparent_market_cap_change": "1068220627950",
      "transparent_market_cap_change_pct": "3.6667",
      "volume": "29883716656515.38",
      "volume_change": "18282436180631.36",
      "volume_change_pct": "1.5759",
      "transparent_volume": "3713836896422.77",
      "transparent_volume_change": "2278313444188.28",
      "transparent_volume_change_pct": "1.5871",
      "volume_transparency": [
        {
          "grade": "?",
          "volume": "328566253797.24",
          "volume_change": "-281695023880.62",
          "volume_change_pct": "-0.4616"
        },
        {
          "grade": "A",
          "volume": "3718511931979.16",
          "volume_change": "2275840182127.67",
          "volume_change_pct": "1.5775"
        },
        {
          "grade": "B",
          "volume": "49320831220.13",
          "volume_change": "35847296193.89",
          "volume_change_pct": "2.6606"
        },
        {
          "grade": "C",
          "volume": "18797899813953.55",
          "volume_change": "10871748480102.48",
          "volume_change_pct": "1.3716"
        },
        {
          "grade": "D",
          "volume": "6989417825565.30",
          "volume_change": "5380695246087.94",
          "volume_change_pct": "3.3447"
        }
      ]
    },
    "ytd": {
      "market_cap_change": "578426575593",
      "market_cap_change_pct": "0.7230",
      "transparent_market_cap_change": "578938892155",
      "transparent_market_cap_change_pct": "0.7416",
      "volume": "7656109632899.66",
      "volume_change": "3899765551830.88",
      "volume_change_pct": "1.0382",
      "transparent_volume": "1412720078662.37",
      "transparent_volume_change": "838480157007.22",
      "transparent_volume_change_pct": "1.4602",
      "volume_transparency": [
        {
          "grade": "?",
          "volume": "23712345285.45",
          "volume_change": "7995749128.09",
          "volume_change_pct": "0.5087"
        },
        {
          "grade": "A",
          "volume": "1412955971658.93",
          "volume_change": "838395923576.66",
          "volume_change_pct": "1.4592"
        },
        {
          "grade": "B",
          "volume": "25803043851.13",
          "volume_change": "18258809154.80",
          "volume_change_pct": "2.4202"
        },
        {
          "grade": "C",
          "volume": "4430711040925.43",
          "volume_change": "2026001737962.93",
          "volume_change_pct": "0.8425"
        },
        {
          "grade": "D",
          "volume": "1762927231178.73",
          "volume_change": "1009113332008.41",
          "volume_change_pct": "1.3387"
        }
      ]
    },
    "result": 1378511244903
  },
  "result": 1378511244903,
  "statusCode": 200
}
```
