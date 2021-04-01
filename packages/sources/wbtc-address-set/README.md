# Chainlink External Adapters to query wBTC custodial address set

## Configuration

The adapter takes the following environment variables:

| Required? |      Name      |      Description      | Options | Defaults to |
| :-------: | :------------: | :-------------------: | :-----: | :---------: |
|    ✅     | `API_ENDPOINT` | wBTC endpoint to call |         |             |

## Running

### Input Params

No input parameters.

### Sample Input

```json
{
  "id": "1",
  "data": {}
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "result": [
      {
        "address": "3D8DJLwUXFfZvE8yJRu729MZ8uLy25SuLz",
        "verified": false,
        "type": "custodial",
        "date": "2020-07-29T02:47:27.212Z",
        "coin": "btc",
        "chain": "mainnet",
        "balance": 44900000000
      },
      {
        "address": "3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1",
        "verified": true,
        "type": "custodial",
        "date": "2020-07-29T02:47:21.943Z",
        "coin": "btc",
        "chain": "mainnet",
        "balance": 9899463044
      },
      {
        "address": "38bzm6nhQMFJe71jJw1U7CbgNrVNpkonZF",
        "verified": false,
        "type": "custodial",
        "date": "2020-07-08T19:46:37.984Z",
        "coin": "btc",
        "chain": "mainnet",
        "balance": 307499838499
      },
      {
        "address": "3ANaBZ6odMrzdg9xifgRNxAUFUxnReesws",
        "verified": false,
        "type": "custodial",
        "date": "2020-07-29T02:47:27.213Z",
        "coin": "btc",
        "chain": "mainnet",
        "balance": 904070305884
      },
      {
        "address": "3FFgKaYkEf1M73QtzuY9DGqC7VeM2sAQhT",
        "verified": false,
        "type": "custodial",
        "date": "2020-07-29T02:47:27.214Z",
        "coin": "btc",
        "chain": "mainnet",
        "balance": 80000
      },
      {
        "address": "3KTeq879YjzhqkAXzZmdapJAVC6qz5qEth",
        "verified": false,
        "type": "custodial",
        "date": "2020-07-08T19:41:37.469Z",
        "coin": "btc",
        "chain": "mainnet",
        "balance": 264148085712
      },
      {
        "address": "35ULMyVnFoYaPaMxwHTRmaGdABpAThM4QR",
        "verified": false,
        "type": "custodial",
        "date": "2020-07-08T19:46:37.990Z",
        "coin": "btc",
        "chain": "mainnet",
        "balance": 2601100000
      }
    ]
  },
  "result": [
    {
      "address": "3D8DJLwUXFfZvE8yJRu729MZ8uLy25SuLz",
      "verified": false,
      "type": "custodial",
      "date": "2020-07-29T02:47:27.212Z",
      "coin": "btc",
      "chain": "mainnet",
      "balance": 44900000000
    },
    {
      "address": "3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1",
      "verified": true,
      "type": "custodial",
      "date": "2020-07-29T02:47:21.943Z",
      "coin": "btc",
      "chain": "mainnet",
      "balance": 9899463044
    },
    {
      "address": "38bzm6nhQMFJe71jJw1U7CbgNrVNpkonZF",
      "verified": false,
      "type": "custodial",
      "date": "2020-07-08T19:46:37.984Z",
      "coin": "btc",
      "chain": "mainnet",
      "balance": 307499838499
    },
    {
      "address": "3ANaBZ6odMrzdg9xifgRNxAUFUxnReesws",
      "verified": false,
      "type": "custodial",
      "date": "2020-07-29T02:47:27.213Z",
      "coin": "btc",
      "chain": "mainnet",
      "balance": 904070305884
    },
    {
      "address": "3FFgKaYkEf1M73QtzuY9DGqC7VeM2sAQhT",
      "verified": false,
      "type": "custodial",
      "date": "2020-07-29T02:47:27.214Z",
      "coin": "btc",
      "chain": "mainnet",
      "balance": 80000
    },
    {
      "address": "3KTeq879YjzhqkAXzZmdapJAVC6qz5qEth",
      "verified": false,
      "type": "custodial",
      "date": "2020-07-08T19:41:37.469Z",
      "coin": "btc",
      "chain": "mainnet",
      "balance": 264148085712
    },
    {
      "address": "35ULMyVnFoYaPaMxwHTRmaGdABpAThM4QR",
      "verified": false,
      "type": "custodial",
      "date": "2020-07-08T19:46:37.990Z",
      "coin": "btc",
      "chain": "mainnet",
      "balance": 2601100000
    }
  ],
  "statusCode": 200
}
```
