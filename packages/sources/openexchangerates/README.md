# Chainlink Open Exchange Rates External Adapter

![1.3.29](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/openexchangerates/package.json)

Base URL https://openexchangerates.org/api/

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |                                    Description                                    |  Type  | Options |               Default                |
| :-------: | :----------: | :-------------------------------------------------------------------------------: | :----: | :-----: | :----------------------------------: |
|    ✅     |   API_KEY    | An API key that can be obtained from [here](https://openexchangerates.org/signup) | string |         |                                      |
|           | API_ENDPOINT |                                                                                   | string |         | `https://openexchangerates.org/api/` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                      Options                       | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [forex](#forex-endpoint), [price](#forex-endpoint) | `forex` |

## Forex Endpoint

**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `forex` endpoint instead.**

Supported names for this endpoint are: `forex`, `price`.

### Input Params

| Required? | Name  |    Aliases     |               Description                | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` |   The symbol of the currency to query    |      |         |         |            |                |
|    ✅     | quote | `market`, `to` | The symbol of the currency to convert to |      |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "forex",
    "base": "ETH",
    "quote": "USD"
  },
  "debug": {
    "cacheKey": "QjGCaijj/AZfhRuMfhhiXZgSxOY=",
    "batchCacheKey": "bABKu8Pn740JrPW1AA9ksPP7vCs=",
    "batchChildrenCacheKeys": [
      [
        "QjGCaijj/AZfhRuMfhhiXZgSxOY=",
        {
          "id": "1",
          "data": {
            "endpoint": "forex",
            "base": "ETH",
            "quote": "USD"
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
    "disclaimer": "Usage subject to terms: https://openexchangerates.org/terms",
    "license": "https://openexchangerates.org/license",
    "timestamp": 1636113600,
    "base": "ETH",
    "rates": {
      "AED": 16468.846726,
      "AFN": 408154.684464,
      "ALL": 477023.604218,
      "AMD": 2142258.338021,
      "ANG": 8083.935552,
      "AOA": 2676840.69997,
      "ARS": 447946.623273,
      "AUD": 6083.05553,
      "AWG": 8073.118469,
      "AZN": 7626.103931,
      "BAM": 7592.423151,
      "BBD": 8967.640536,
      "BDT": 384670.719421,
      "BGN": 7590.260272,
      "BHD": 1690.738607,
      "BIF": 8925863.504424,
      "BMD": 4483.820268,
      "BND": 6061.787123,
      "BOB": 30927.06233,
      "BRL": 25117.015901,
      "BSD": 4483.820268,
      "BTC": 0.073071071562,
      "BTN": 334001.168984,
      "BWP": 51263.73661,
      "BYN": 11034.664482,
      "BZD": 9041.632162,
      "CAD": 5590.742272,
      "CDF": 8989811.80424,
      "CHF": 4110.023218,
      "CLF": 132.468461,
      "CLP": 3655210.282438,
      "CNH": 28714.81081,
      "CNY": 28713.03985,
      "COP": 17210589.490674,
      "CRC": 2863759.941431,
      "CUC": 4483.820268,
      "CUP": 115458.3719,
      "CVE": 429886.26819,
      "CZK": 98505.944212,
      "DJF": 798533.154168,
      "DKK": 28914.267489,
      "DOP": 252781.041604,
      "DZD": 618275.262894,
      "EGP": 70395.529825,
      "ERN": 67260.083988,
      "ETB": 213059.680028,
      "EUR": 3887.617117,
      "FJD": 9343.608862,
      "FKP": 3335.617386,
      "GBP": 3335.617386,
      "GEL": 14168.872047,
      "GGP": 3335.617386,
      "GHS": 27406.138408,
      "GIP": 3335.617386,
      "GMD": 233158.653934,
      "GNF": 43078007.893634,
      "GTQ": 34717.542539,
      "GYD": 938693.080987,
      "HKD": 34910.49805,
      "HNL": 108323.178602,
      "HRK": 29244.820934,
      "HTG": 441510.821101,
      "HUF": 1398750.15169,
      "IDR": 64246569.18801,
      "ILS": 13966.516367,
      "IMP": 3335.617386,
      "INR": 333144.779753,
      "IQD": 6544312.343173,
      "IRR": 189418987.219832,
      "ISK": 583927.913496,
      "JEP": 3335.617386,
      "JMD": 694583.924263,
      "JOD": 3179.028539,
      "JPY": 510404.47065218,
      "KES": 500394.341904,
      "KGS": 380215.892762,
      "KHR": 18274767.266951,
      "KMF": 1912126.316992,
      "KPW": 4035438.241161,
      "KRW": 5321275.545433,
      "KWD": 1353.368472,
      "KYD": 3737.616813,
      "KZT": 1926533.113528,
      "LAK": 46491759.0121,
      "LBP": 6789665.185597,
      "LKR": 903834.038523,
      "LRD": 662036.003622,
      "LSL": 68449.082491,
      "LYD": 20440.432772,
      "MAD": 40756.144241,
      "MDL": 78539.910976,
      "MGA": 17796406.330351,
      "MKD": 238936.74564,
      "MMK": 8076209.206068,
      "MNT": 12787820.538026,
      "MOP": 35961.011605,
      "MRO": 1600723.064443,
      "MRU": 162762.675727,
      "MUR": 194149.417603,
      "MVR": 69319.862272,
      "MWK": 3656312.248661,
      "MXN": 92483.306759,
      "MYR": 18652.692402,
      "MZN": 286202.247704,
      "NAD": 68826.641113,
      "NGN": 1843477.864968,
      "NIO": 158025.728276,
      "NOK": 38510.909159,
      "NPR": 534409.347662,
      "NZD": 6330.754679,
      "OMR": 1726.427222,
      "PAB": 4483.820268,
      "PEN": 18028.913982,
      "PGK": 15749.708408,
      "PHP": 225578.729317,
      "PKR": 762540.021134,
      "PLN": 17908.282572,
      "PYG": 30862249.420789,
      "QAR": 16325.589364,
      "RON": 19242.313621,
      "RSD": 456516.618795,
      "RUB": 320681.480418,
      "RWF": 4571009.458388,
      "SAR": 16818.092414,
      "SBD": 35985.924581,
      "SCR": 59694.073458,
      "SDG": 1979606.648303,
      "SEK": 38541.83108,
      "SGD": 6069.228896,
      "SHP": 3335.617386,
      "SLL": 48776566.471989,
      "SOS": 2594750.743581,
      "SRD": 96370.749019,
      "SSP": 584062.428104,
      "STD": 93964912.676065,
      "STN": 95953.753734,
      "SVC": 39247.306117,
      "SYP": 5636284.668952,
      "SZL": 68449.087203,
      "THB": 149326.031707,
      "TJS": 50506.254214,
      "TMT": 15738.2104,
      "TND": 12711.630646,
      "TOP": 10075.360464,
      "TRY": 43563.003831,
      "TTD": 30428.114476,
      "TWD": 125088.722403,
      "TZS": 10312786.6163,
      "UAH": 117472.111966,
      "UGX": 15938462.625288,
      "USD": 4483.820268,
      "UYU": 198029.98057,
      "UZS": 47927607.281693,
      "VES": 19877.89635,
      "VND": 101905469.191354,
      "VUV": 498709.398472,
      "WST": 11514.86296,
      "XAF": 2550109.661013,
      "XAG": 188.2060273,
      "XAU": 2.49935634,
      "XCD": 12117.748465,
      "XDR": 3179.27518,
      "XOF": 2550109.661013,
      "XPD": 2.22136594,
      "XPF": 463916.123708,
      "XPT": 4.3490268,
      "YER": 1122076.012503,
      "ZAR": 68480.186979,
      "ZMW": 77935.986063,
      "ZWL": 1443790.126282
    },
    "result": 4483.820268
  },
  "result": 4483.820268,
  "statusCode": 200,
  "debug": {
    "batchablePropertyPath": [
      {
        "name": "quote"
      }
    ]
  },
  "providerStatusCode": 200
}
```

---

MIT License
