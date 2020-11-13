# Chainlink External Adapter for CryptoAPIs

## Configuration

The adapter takes the following environment variables:

- `API_KEY`: Optional Blochair API key to use
- `API_TIMEOUT`: Optional timeout param, defaults to `30000`

## Input Params

- `endpoint`: The endpoint to use. Default: "price"

### Price endpoint

- `base`, `from`, or `coin`: The symbol or ID of the coin to query
- `quote`, `to`, or `market`: The symbol or ID of the market to convert to

### Difficulty endpoint

- `blockchain` or `coin`: The blockchain to get difficulty from
- `network`: The network of the blockchain to get difficulty from. Default: "mainnet"

## Output

```json
{
  "jobRunID": "1",
  "data": {
    "payload": {
      "weightedAveragePrice": 188.02563659478218,
      "amount": 2848.4069787899994,
      "timestamp": 1587650913,
      "datetime": "2020-04-23T14:08:33+0000",
      "baseAsset": "ETH",
      "quoteAsset": "USD"
    },
    "result": 188.02563659478218
  },
  "result": 188.02563659478218,
  "statusCode": 200
}
```

### Balance endpoint

https://blockchair.com/api/docs#link_390

- `dataPath`: Optional path where to find the addresses array, defaults to `addresses`
- `confirmations`: Optional confirmations param, defaults to `6`

- `addresses`: Addresses to query

  {

  - `address`: Address to query
  - `coin`: Optional currency to query, defaults to `btc`, one of `(btc|eth|etc|bch|ltc|dash|doge|btcv|zil)`
  - `chain`: Optional chain to query, defaults to `mainnet`, one of `(mainnet|testnet)`

  }

```json
{
  "id": "1",
  "data": {
    "addresses": [
      {
        "address": "3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1"
      },
      {
        "address": "38bzm6nhQMFJe71jJw1U7CbgNrVNpkonZF"
      },
      {
        "address": "3ANaBZ6odMrzdg9xifgRNxAUFUxnReesws"
      },
      {
        "address": "3FFgKaYkEf1M73QtzuY9DGqC7VeM2sAQhT"
      },
      {
        "address": "3KTeq879YjzhqkAXzZmdapJAVC6qz5qEth"
      },
      {
        "address": "35ULMyVnFoYaPaMxwHTRmaGdABpAThM4QR"
      }
    ]
  }
}
```

### Output

```json
{
  "jobRunID": "1",
  "data": {
    "responses": [
      {
        "data": {
          "3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1": 547,
          "3ANaBZ6odMrzdg9xifgRNxAUFUxnReesws": 547,
          "35ULMyVnFoYaPaMxwHTRmaGdABpAThM4QR": 500000010680,
          "38bzm6nhQMFJe71jJw1U7CbgNrVNpkonZF": 3282,
          "3KTeq879YjzhqkAXzZmdapJAVC6qz5qEth": 202325966208,
          "3FFgKaYkEf1M73QtzuY9DGqC7VeM2sAQhT": 895134971346
        },
        "context": {
          "code": 200,
          "source": "A",
          "results": 6,
          "state": 656647,
          "cache": {
            "live": true,
            "duration": 60,
            "since": "2020-11-12 20:34:55",
            "until": "2020-11-12 20:35:55",
            "time": null
          },
          "api": {
            "version": "2.0.68",
            "last_major_update": "2020-07-19 00:00:00",
            "next_major_update": null,
            "documentation": "https://blockchair.com/api/docs",
            "notice": "Beginning July 19th, 2020 we start enforcing request cost formulas, see the changelog for details"
          },
          "time": 0.05315399169921875,
          "render_time": 0.014842987060546875,
          "full_time": 0.06799697875976562,
          "request_cost": 1.006
        }
      }
    ],
    "result": [
      [
        {
          "address": "3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1",
          "coin": "btc",
          "chain": "mainnet",
          "balance": 547
        },
        {
          "address": "38bzm6nhQMFJe71jJw1U7CbgNrVNpkonZF",
          "coin": "btc",
          "chain": "mainnet",
          "balance": 3282
        },
        {
          "address": "3ANaBZ6odMrzdg9xifgRNxAUFUxnReesws",
          "coin": "btc",
          "chain": "mainnet",
          "balance": 547
        },
        {
          "address": "3FFgKaYkEf1M73QtzuY9DGqC7VeM2sAQhT",
          "coin": "btc",
          "chain": "mainnet",
          "balance": 895134971346
        },
        {
          "address": "3KTeq879YjzhqkAXzZmdapJAVC6qz5qEth",
          "coin": "btc",
          "chain": "mainnet",
          "balance": 202325966208
        },
        {
          "address": "35ULMyVnFoYaPaMxwHTRmaGdABpAThM4QR",
          "coin": "btc",
          "chain": "mainnet",
          "balance": 500000010680
        }
      ]
    ]
  },
  "result": [
    [
      {
        "address": "3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1",
        "coin": "btc",
        "chain": "mainnet",
        "balance": 547
      },
      {
        "address": "38bzm6nhQMFJe71jJw1U7CbgNrVNpkonZF",
        "coin": "btc",
        "chain": "mainnet",
        "balance": 3282
      },
      {
        "address": "3ANaBZ6odMrzdg9xifgRNxAUFUxnReesws",
        "coin": "btc",
        "chain": "mainnet",
        "balance": 547
      },
      {
        "address": "3FFgKaYkEf1M73QtzuY9DGqC7VeM2sAQhT",
        "coin": "btc",
        "chain": "mainnet",
        "balance": 895134971346
      },
      {
        "address": "3KTeq879YjzhqkAXzZmdapJAVC6qz5qEth",
        "coin": "btc",
        "chain": "mainnet",
        "balance": 202325966208
      },
      {
        "address": "35ULMyVnFoYaPaMxwHTRmaGdABpAThM4QR",
        "coin": "btc",
        "chain": "mainnet",
        "balance": 500000010680
      }
    ]
  ],
  "statusCode": 200
}
```
