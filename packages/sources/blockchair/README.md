# Chainlink External Adapter for Blockchair

### Environment Variables

The adapter takes the following environment variables:

| Required? |     Name      |        Description        | Options | Defaults to |
| :-------: | :-----------: | :-----------------------: | :-----: | :---------: |
|           |   `API_KEY`   | Blockchair API key to use |         |             |
|           | `API_TIMEOUT` |   API timeout parameter   |         |   `30000`   |

### Input Params

- `blockchain` or `coin`: The blockchain to get stats from
- `endpoint`: The parameter to query for. Default: "difficulty"

| Required? |          Name          |           Description            | Options | Defaults to  |
| :-------: | :--------------------: | :------------------------------: | :-----: | :----------: |
|    ✅     | `blockchain` or `coin` | The blockchain to get stats from |         |              |
|           |       `endpoint`       |    The parameter to query for    |         | `difficulty` |

### Sample Input

```json
{
  "id": 1,
  "data": {
    "blockchain": "BTC"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "data": {
      "blocks": 652383,
      "transactions": 576952373,
      "outputs": 1535084660,
      "circulation": 1851486479497096,
      "blocks_24h": 144,
      "transactions_24h": 284387,
      "difficulty": 19298087186263,
      "volume_24h": 205020039431581,
      "mempool_transactions": 7866,
      "mempool_size": 6776663,
      "mempool_tps": 3.8833333333333333,
      "mempool_total_fee_usd": 3256.115,
      "best_block_height": 652382,
      "best_block_hash": "0000000000000000000b0dcb8a9f98d240bf048dfac57781dd4bf480d45edc56",
      "best_block_time": "2020-10-12 11:46:57",
      "blockchain_size": 304483721105,
      "average_transaction_fee_24h": 20199,
      "inflation_24h": 90000000000,
      "median_transaction_fee_24h": 10387,
      "cdd_24h": 7629459.6835731985,
      "largest_transaction_24h": {
        "hash": "b2d3bf32f359a55a764bf9319f0bd1a1fa564f5365c67a08165bb7dff4a2a627",
        "value_usd": 298061760
      },
      "nodes": 8181,
      "hashrate_24h": "138141088900593742424",
      "inflation_usd_24h": 10140174,
      "average_transaction_fee_usd_24h": 2.2758096168976207,
      "median_transaction_fee_usd_24h": 1.1702887482000002,
      "market_price_usd": 11266.86,
      "market_price_btc": 1,
      "market_price_usd_change_24h_percentage": -0.86586,
      "market_cap_usd": 208461611642,
      "market_dominance_percentage": 57.63,
      "next_retarget_time_estimate": "2020-10-18 00:03:19",
      "next_difficulty_estimate": 19500702198044,
      "countdowns": [],
      "suggested_transaction_fee_per_byte_sat": 7
    },
    "context": {
      "code": 200,
      "source": "A",
      "state": 652382,
      "cache": {
        "live": false,
        "duration": "Ignore",
        "since": "2020-10-12 11:49:45",
        "until": "2020-10-12 11:50:56",
        "time": 0.0000050067901611328125
      },
      "api": {
        "version": "2.0.66",
        "last_major_update": "2020-07-19 00:00:00",
        "next_major_update": null,
        "documentation": "https://blockchair.com/api/docs",
        "notice": "Beginning July 19th, 2020 we start enforcing request cost formulas, see the changelog for details"
      },
      "time": 0.6659250259399414,
      "render_time": 0.013970136642456055,
      "full_time": 0.013975143432617188,
      "request_cost": 1
    },
    "result": 19298087186263
  },
  "result": 19298087186263,
  "statusCode": 200
}
```

### Balance endpoint

https://blockchair.com/api/docs#link_390

- `dataPath`: Optional path where to find the addresses array, defaults to `result`
- `confirmations`: Optional confirmations param, defaults to `6`

- `addresses`: Addresses to query

  {

  - `address`: Address to query
  - `coin`: Optional currency to query, defaults to `btc`, one of `(btc|dash|doge|ltc|bch)`
  - `chain`: Optional chain to query, defaults to `mainnet`.

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
    ],
    "dataPath": "addresses"
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
        "balance": "547"
      },
      {
        "address": "38bzm6nhQMFJe71jJw1U7CbgNrVNpkonZF",
        "coin": "btc",
        "chain": "mainnet",
        "balance": "3282"
      },
      {
        "address": "3ANaBZ6odMrzdg9xifgRNxAUFUxnReesws",
        "coin": "btc",
        "chain": "mainnet",
        "balance": "547"
      },
      {
        "address": "3FFgKaYkEf1M73QtzuY9DGqC7VeM2sAQhT",
        "coin": "btc",
        "chain": "mainnet",
        "balance": "895134971346"
      },
      {
        "address": "3KTeq879YjzhqkAXzZmdapJAVC6qz5qEth",
        "coin": "btc",
        "chain": "mainnet",
        "balance": "202325966208"
      },
      {
        "address": "35ULMyVnFoYaPaMxwHTRmaGdABpAThM4QR",
        "coin": "btc",
        "chain": "mainnet",
        "balance": "500000010680"
      }
    ]
  ],
  "statusCode": 200
}
```
