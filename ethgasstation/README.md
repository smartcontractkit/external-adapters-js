# Chainlink External Adapter for EthGasStation

### Environment Variables

| Required? |  Name   | Description | Options | Defaults to |
| :-------: | :-----: | :---------: | :-----: | :---------: |
|    ✅     | API_KEY |             |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |            Options             | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------------: | :---------: |
|           | endpoint | The endpoint to use | [gasprice](#gasprice-Endpoint) | `gasprice`  |

---

## Gas Price Endpoint

### Input Params

| Required? |    Name    |               Description                |               Options                |    Defaults to     |
| :-------: | :--------: | :--------------------------------------: | :----------------------------------: | :----------------: |
|    🟡     |  `speed`   |            The desired speed             | `safeLow`,`average`,`fast`,`fastest` |     `average`      |
|    🟡     | `endpoint` | The blockchain id to get gas prices from |                                      | `ethereum-mainnet` |

### Output Format

```json
{
  "jobRunID": "1",
  "data": {
    "fast": 570,
    "fastest": 620,
    "safeLow": 500,
    "average": 530,
    "block_time": 17.285714285714285,
    "blockNum": 10518362,
    "speed": 0.9984971128258865,
    "safeLowWait": 20.1,
    "avgWait": 1.5,
    "fastWait": 0.6,
    "fastestWait": 0.6,
    "gasPriceRange": {
      "4": 288.1,
      "6": 288.1,
      "8": 288.1,
      "10": 288.1,
      "20": 288.1,
      "30": 288.1,
      "40": 288.1,
      "50": 288.1,
      "60": 288.1,
      "70": 288.1,
      "80": 288.1,
      "90": 288.1,
      "100": 288.1,
      "110": 288.1,
      "120": 288.1,
      "130": 288.1,
      "140": 288.1,
      "150": 288.1,
      "160": 288.1,
      "170": 288.1,
      "180": 288.1,
      "190": 288.1,
      "200": 288.1,
      "220": 288.1,
      "240": 288.1,
      "260": 288.1,
      "280": 288.1,
      "300": 288.1,
      "320": 288.1,
      "340": 288.1,
      "360": 288.1,
      "380": 288.1,
      "400": 288.1,
      "420": 288.1,
      "440": 288.1,
      "460": 288.1,
      "480": 288.1,
      "500": 20.1,
      "520": 12.1,
      "530": 1.5,
      "540": 1.2,
      "560": 1.1,
      "570": 0.6,
      "580": 0.6,
      "600": 0.6,
      "620": 0.6
    },
    "result": 57000000000
  },
  "result": 57000000000,
  "statusCode": 200
}
```
