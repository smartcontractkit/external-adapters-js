# Chainlink CoinMarketCap Pro External Adapter

## Input Params

- `base`, `from`, `coin`, or `sym`: The coin to query (required)
- `quote`, `to`, `market`, or `convert`: The currency to convert to (required)
- `cid`: The CMC coin ID (optional, use in place of `sym` or `coin`)
- `endpoint`: The endpoint to use (defaults to "price", one of "price", "dominance")

## Output

```json
{
  "jobRunID": "1",
  "data": {
    "status": {
      "timestamp": "2020-04-13T20:52:42.250Z",
      "error_code": 0,
      "error_message": null,
      "elapsed": 9,
      "credit_count": 1,
      "notice": null
    },
    "data": {
      "ETH": {
        "id": 1027,
        "name": "Ethereum",
        "symbol": "ETH",
        "slug": "ethereum",
        "num_market_pairs": 5135,
        "date_added": "2015-08-07T00:00:00.000Z",
        "tags": ["mineable"],
        "max_supply": null,
        "circulating_supply": 110505332.374,
        "total_supply": 110505332.374,
        "platform": null,
        "cmc_rank": 2,
        "last_updated": "2020-04-13T20:51:27.000Z",
        "quote": {
          "USD": {
            "price": 155.22087406,
            "volume_24h": 16301412264.6787,
            "percent_change_1h": 0.250983,
            "percent_change_24h": -5.25413,
            "percent_change_7d": -5.93502,
            "market_cap": 17152734279.383095,
            "last_updated": "2020-04-13T20:51:27.000Z"
          }
        }
      }
    },
    "result": 155.22087406
  },
  "result": 155.22087406,
  "statusCode": 200
}
```

`endpoint: dominance`

```json
{
  "jobRunID": "1",
  "data": {
    "status": {
      "timestamp": "2020-10-16T23:18:36.289Z",
      "error_code": 0,
      "error_message": null,
      "elapsed": 25,
      "credit_count": 1,
      "notice": null
    },
    "data": {
      "active_cryptocurrencies": 3664,
      "total_cryptocurrencies": 7433,
      "active_market_pairs": 31365,
      "active_exchanges": 354,
      "total_exchanges": 1186,
      "eth_dominance": 11.654905392401,
      "btc_dominance": 59.044719937306,
      "defi_volume_24h": 5295507637.881502,
      "defi_volume_24h_reported": 6102491895.518447,
      "defi_market_cap": 12069649224.074215,
      "defi_24h_percentage_change": -5.822889028242,
      "stablecoin_volume_24h": 42596840368.40701,
      "stablecoin_volume_24h_reported": 49209035106.58548,
      "stablecoin_market_cap": 22305460671.832672,
      "stablecoin_24h_percentage_change": 1.882412510019,
      "derivatives_volume_24h": 18862201846.868465,
      "derivatives_volume_24h_reported": 18862201846.868465,
      "derivatives_24h_percentage_change": 9.823120311572,
      "quote": {
        "USD": {
          "total_market_cap": 355594318165.9909,
          "total_volume_24h": 78693834550.99867,
          "total_volume_24h_reported": 97215603736.63431,
          "altcoin_volume_24h": 53560686839.051575,
          "altcoin_volume_24h_reported": 65149517236.24264,
          "altcoin_market_cap": 145634648891.90988,
          "last_updated": "2020-10-16T23:15:18.000Z"
        }
      },
      "last_updated": "2020-10-16T23:15:18.000Z"
    },
    "result": 59.044719937306
  },
  "result": 59.044719937306,
  "statusCode": 200
}
```
