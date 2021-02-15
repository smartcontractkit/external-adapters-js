# Chainlink External Adapter for Nomics

## Input Params

- `base`, `from`, `coin`, or `ids`: The symbol of the currency to query
- `quote`, `to`, `market`, or `convert`: The symbol of the currency to convert to
- `endpoint`: Optional endpoint param

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
