# Chainlink CoinPaprika External Adapter

### Input Parameters

| Required? |   Name   |     Description     |                                                    Options                                                     | Defaults to |
| :-------: | :------: | :-----------------: | :------------------------------------------------------------------------------------------------------------: | :---------: |
|           | endpoint | The endpoint to use | [price](#Price-Endpoint), [dominance](#Dominance-Endpoint), [globalmarketcap](#Market-Capitalization-Endpoint) |   `price`   |

---

## Price Endpoint

https://api.coinpaprika.com/v1/tickers/`{COIN}`

### Input Params

| Required? |          Name           |                   Description                    | Options | Defaults to |
| :-------: | :---------------------: | :----------------------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, `coin`  |       The symbol of the currency to query        |         |             |
|    ✅     | `quote`, `to`, `market` |     The symbol of the currency to convert to     |         |             |
|    🟡     |        `coinid`         | The coin ID (optional to use in place of `base`) |         |             |
|    🟡     |   `overrides`   | If base provided is found in overrides, that will be used  | [Format](../presetSymbols.json)|             |

### Output

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {
    "id": "eth-ethereum",
    "name": "Ethereum",
    "symbol": "ETH",
    "rank": 2,
    "circulating_supply": 109469522,
    "total_supply": 109469556,
    "max_supply": 0,
    "beta_value": 1.04048,
    "last_updated": "2020-01-28T21:56:03Z",
    "quotes": {
      "USD": {
        "price": 173.00001891,
        "volume_24h": 8256159044.3763,
        "volume_24h_change_24h": 2.54,
        "market_cap": 18938229376,
        "market_cap_change_24h": 0.93,
        "percent_change_1h": 0.27,
        "percent_change_12h": 1.04,
        "percent_change_24h": 0.92,
        "percent_change_7d": 2.18,
        "percent_change_30d": 27.49,
        "percent_change_1y": 64.2,
        "ath_price": 1432.88,
        "ath_date": "2018-01-13T21:04:00Z",
        "percent_from_price_ath": -87.93
      }
    },
    "result": 173.00001891
  },
  "result": 173.00001891,
  "statusCode": 200
}
```

## Dominance Endpoint

Returns Bitcoin's dominance from the [global endpoint](https://api.coinpaprika.com/v1/global)

### Input Params

| Required? |          Name           |             Description             | Options | Defaults to |
| :-------: | :---------------------: | :---------------------------------: | :-----: | :---------: |
|    ✅     | `quote`, `to`, `market` | The symbol of the currency to query |  `BTC`  |             |

### Output

```json
{
  "jobRunID": "1",
  "data": {
    "market_cap_usd": 368198248292,
    "volume_24h_usd": 59351367068,
    "bitcoin_dominance_percentage": 59.98,
    "cryptocurrencies_number": 2435,
    "market_cap_ath_value": 835692000000,
    "market_cap_ath_date": "2018-01-07T11:17:00Z",
    "volume_24h_ath_value": 197699715619,
    "volume_24h_ath_date": "2020-03-13T10:00:00Z",
    "volume_24h_percent_from_ath": -69.98,
    "volume_24h_percent_to_ath": 233.1,
    "market_cap_change_24h": -0.2,
    "volume_24h_change_24h": 16.98,
    "last_updated": 1603238207,
    "result": 59.98
  },
  "result": 59.98,
  "statusCode": 200
}
```

## Market Capitalization Endpoint

Returns the global market capitilization from the [global endpoint](https://api.coinpaprika.com/v1/global)

### Input Params

| Required? |          Name           |             Description             | Options | Defaults to |
| :-------: | :---------------------: | :---------------------------------: | :-----: | :---------: |
|    ✅     | `quote`, `to`, `market` | The symbol of the currency to query |  `USD`  |             |

### Output

```json
{
  "jobRunID": "1",
  "data": {
    "market_cap_usd": 368198248292,
    "volume_24h_usd": 59351367068,
    "bitcoin_dominance_percentage": 59.98,
    "cryptocurrencies_number": 2435,
    "market_cap_ath_value": 835692000000,
    "market_cap_ath_date": "2018-01-07T11:17:00Z",
    "volume_24h_ath_value": 197699715619,
    "volume_24h_ath_date": "2020-03-13T10:00:00Z",
    "volume_24h_percent_from_ath": -69.98,
    "volume_24h_percent_to_ath": 233.1,
    "market_cap_change_24h": -0.2,
    "volume_24h_change_24h": 16.98,
    "last_updated": 1603238207,
    "result": 368198248292
  },
  "result": 368198248292,
  "statusCode": 200
}
```
