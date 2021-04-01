# Chainlink Kaiko External Adapter

### Environment Variables

| Required? |  Name   |                                 Description                                 | Options | Defaults to |
| :-------: | :-----: | :-------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | API_KEY | An API key that can be obtained from [here](https://www.coinapi.io/pricing) |         |             |

---

### Input Params

| Required? |            Name            |               Description                | Options | Defaults to |
| :-------: | :------------------------: | :--------------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, or `coin`  |   The symbol of the currency to query    |         |             |
|    ✅     | `quote`, `to`, or `market` | The symbol of the currency to convert to |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "base": "ETH",
    "quote": "USD"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "query": {
      "page_size": 100,
      "start_time": "2020-04-17T16:29:13.277Z",
      "interval": "1m",
      "sort": "desc",
      "base_asset": "eth",
      "quote_asset": "usd",
      "sources": false,
      "data_version": "v1",
      "commodity": "trades",
      "request_time": "2020-04-17T16:45:53.234Z",
      "instruments": [
        "bequ:spot:eth-usd",
        "bfnx:spot:eth-usd",
        "btby:spot:eth-usd",
        "btca:spot:eth-usd",
        "bnus:spot:eth-usd",
        "btrx:spot:eth-usd",
        "btsh:spot:eth-usd",
        "cbse:spot:eth-usd",
        "cexi:spot:eth-usd",
        "cnhd:spot:eth-usd",
        "ethx:spot:eth-usd",
        "exxa:spot:eth-usd",
        "gmni:spot:eth-usd",
        "gacn:spot:eth-usd",
        "itbi:spot:eth-usd",
        "kcon:spot:eth-usd",
        "krkn:spot:eth-usd",
        "okcn:spot:eth-usd",
        "lmax:spot:eth-usd",
        "yobt:spot:eth-usd",
        "quon:spot:eth-usd",
        "stmp:spot:eth-usd",
        "tbit:spot:eth-usd",
        "wexn:spot:eth-usd"
      ],
      "start_timestamp": 1587140953277
    },
    "time": "2020-04-17T16:45:53.336Z",
    "timestamp": 1587141953336,
    "data": [
      {
        "timestamp": 1587141900000,
        "price": "170.5073255331914"
      },
      {
        "timestamp": 1587141600000,
        "price": "170.64267792770045"
      },
      {
        "timestamp": 1587141300000,
        "price": "170.42193163824737"
      },
      {
        "timestamp": 1587141000000,
        "price": "170.55189478953133"
      }
    ],
    "result": "170.5073255331914",
    "access": {
      "access_range": {
        "start_timestamp": null,
        "end_timestamp": 1606495255000
      },
      "data_range": {
        "start_timestamp": 1572912000000,
        "end_timestamp": null
      }
    }
  },
  "result": "170.5073255331914",
  "statusCode": 200
}
```
