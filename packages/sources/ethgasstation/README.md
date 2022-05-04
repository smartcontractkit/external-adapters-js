# Chainlink External Adapter for EthGasStation

![1.3.20](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/ethgasstation/package.json)

Base URL https://ethgasstation.info/

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |             Default              |
| :-------: | :----------: | :---------: | :----: | :-----: | :------------------------------: |
|    ✅     |   API_KEY    |             | string |         |                                  |
|           | API_ENDPOINT |             | string |         | `https://data-api.defipulse.com` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |            Options             |  Default   |
| :-------: | :------: | :-----------------: | :----: | :----------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [gasprice](#gasprice-endpoint) | `gasprice` |

## Gasprice Endpoint

`gasprice` is the only supported name for this endpoint.

### Input Params

| Required? | Name  | Aliases |    Description    |  Type  |                 Options                 |  Default  | Depends On | Not Valid With |
| :-------: | :---: | :-----: | :---------------: | :----: | :-------------------------------------: | :-------: | :--------: | :------------: |
|           | speed |         | The desired speed | string | `average`, `fast`, `fastest`, `safeLow` | `average` |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "gasprice",
    "speed": "fast"
  },
  "debug": {
    "cacheKey": "0BJQ6WrEaARtjkqLfBrRVKG+QcE="
  },
  "rateLimitMaxAge": 2985074
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "fast": 1840,
    "fastest": 1840,
    "safeLow": 1090,
    "average": 1180,
    "block_time": 14.117647058823529,
    "blockNum": 13690889,
    "speed": 0.4069521658740773,
    "safeLowWait": 12.8,
    "avgWait": 1.6,
    "fastWait": 0.5,
    "fastestWait": 0.5,
    "gasPriceRange": {
      "4": 235.3,
      "6": 235.3,
      "8": 235.3,
      "10": 235.3,
      "20": 235.3,
      "30": 235.3,
      "40": 235.3,
      "50": 235.3,
      "60": 235.3,
      "70": 235.3,
      "80": 235.3,
      "90": 235.3,
      "100": 235.3,
      "110": 235.3,
      "120": 235.3,
      "130": 235.3,
      "140": 235.3,
      "150": 235.3,
      "160": 235.3,
      "170": 235.3,
      "180": 235.3,
      "190": 235.3,
      "200": 235.3,
      "220": 235.3,
      "240": 235.3,
      "260": 235.3,
      "280": 235.3,
      "300": 235.3,
      "320": 235.3,
      "340": 235.3,
      "360": 235.3,
      "380": 235.3,
      "400": 235.3,
      "420": 235.3,
      "440": 235.3,
      "460": 235.3,
      "480": 235.3,
      "500": 235.3,
      "520": 235.3,
      "540": 235.3,
      "560": 235.3,
      "580": 235.3,
      "600": 235.3,
      "620": 235.3,
      "640": 235.3,
      "660": 235.3,
      "680": 235.3,
      "700": 235.3,
      "720": 235.3,
      "740": 235.3,
      "760": 235.3,
      "780": 235.3,
      "800": 235.3,
      "820": 235.3,
      "840": 235.3,
      "860": 235.3,
      "880": 235.3,
      "900": 235.3,
      "920": 235.3,
      "940": 30.6,
      "960": 27.9,
      "980": 25.5,
      "1000": 22.8,
      "1020": 20.7,
      "1040": 18.9,
      "1060": 15.4,
      "1080": 14.1,
      "1090": 12.8,
      "1100": 12.5,
      "1120": 10.2,
      "1140": 9.1,
      "1160": 8.9,
      "1180": 1.6,
      "1200": 1.4,
      "1220": 1.3,
      "1240": 1.2,
      "1260": 1.2,
      "1280": 1.1,
      "1300": 1,
      "1320": 1,
      "1340": 0.9,
      "1360": 0.9,
      "1380": 0.8,
      "1400": 0.8,
      "1420": 0.7,
      "1440": 0.7,
      "1460": 0.7,
      "1480": 0.7,
      "1500": 0.6,
      "1520": 0.6,
      "1540": 0.6,
      "1560": 0.6,
      "1580": 0.6,
      "1600": 0.6,
      "1620": 0.6,
      "1640": 0.6,
      "1660": 0.5,
      "1680": 0.5,
      "1700": 0.5,
      "1720": 0.5,
      "1740": 0.5,
      "1760": 0.5,
      "1780": 0.5,
      "1800": 0.5,
      "1820": 0.5,
      "1840": 0.5
    },
    "result": 184000000000
  },
  "result": 184000000000,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
