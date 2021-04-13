# Chainlink External Adapter for blockchain.com

## Configuration

The adapter takes the following environment variables:

- `API_KEY`: Optional blockchain.com API key to use
- `API_TIMEOUT`: Optional timeout param, defaults to `30000`

## Input Params

- `endpoint`: Optional endpoint param, defaults to `balance`

### Balance endpoint

- `addresses`: Addresses to query
  - `address`: Address to query
  - `coin`: Optional currency to query, defaults to `btc`
  - `chain`: Optional chain to query, defaults to `mainnet`
- `confirmations`: Optional confirmations param, defaults to `6`

```json
{
  "id": "1",
  "data": {
    "addresses": [
      {
        "address": "3D8DJLwUXFfZvE8yJRu729MZ8uLy25SuLz",
        "coin": "btc"
      },
      {
        "address": "3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1",
        "coin": "btc"
      },
      {
        "address": "38bzm6nhQMFJe71jJw1U7CbgNrVNpkonZF",
        "coin": "btc"
      },
      {
        "address": "3ANaBZ6odMrzdg9xifgRNxAUFUxnReesws",
        "coin": "btc"
      },
      {
        "address": "3FFgKaYkEf1M73QtzuY9DGqC7VeM2sAQhT",
        "coin": "btc"
      },
      {
        "address": "3KTeq879YjzhqkAXzZmdapJAVC6qz5qEth",
        "coin": "btc"
      },
      {
        "address": "35ULMyVnFoYaPaMxwHTRmaGdABpAThM4QR",
        "coin": "btc"
      }
    ],
    "confirmations": 3
  }
}
```

#### Output

```json
{
  "jobRunID": "1",
  "data": {
    "result": [
      {
        "address": "3D8DJLwUXFfZvE8yJRu729MZ8uLy25SuLz",
        "coin": "btc",
        "chain": "mainnet",
        "balance": 44900000000
      },
      {
        "address": "3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1",
        "coin": "btc",
        "chain": "mainnet",
        "balance": 9899463044
      },
      {
        "address": "38bzm6nhQMFJe71jJw1U7CbgNrVNpkonZF",
        "coin": "btc",
        "chain": "mainnet",
        "balance": 307499838499
      },
      {
        "address": "3ANaBZ6odMrzdg9xifgRNxAUFUxnReesws",
        "coin": "btc",
        "chain": "mainnet",
        "balance": 904070305884
      },
      {
        "address": "3FFgKaYkEf1M73QtzuY9DGqC7VeM2sAQhT",
        "coin": "btc",
        "chain": "mainnet",
        "balance": 80000
      },
      {
        "address": "3KTeq879YjzhqkAXzZmdapJAVC6qz5qEth",
        "coin": "btc",
        "chain": "mainnet",
        "balance": 264148085712
      },
      {
        "address": "35ULMyVnFoYaPaMxwHTRmaGdABpAThM4QR",
        "coin": "btc",
        "chain": "mainnet",
        "balance": 2601100000
      }
    ]
  },
  "result": [
    {
      "address": "3D8DJLwUXFfZvE8yJRu729MZ8uLy25SuLz",
      "coin": "btc",
      "chain": "mainnet",
      "balance": "44900000000"
    },
    {
      "address": "3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1",
      "coin": "btc",
      "chain": "mainnet",
      "balance": "9899463044"
    },
    {
      "address": "38bzm6nhQMFJe71jJw1U7CbgNrVNpkonZF",
      "coin": "btc",
      "chain": "mainnet",
      "balance": "307499838499"
    },
    {
      "address": "3ANaBZ6odMrzdg9xifgRNxAUFUxnReesws",
      "coin": "btc",
      "chain": "mainnet",
      "balance": "904070305884"
    },
    {
      "address": "3FFgKaYkEf1M73QtzuY9DGqC7VeM2sAQhT",
      "coin": "btc",
      "chain": "mainnet",
      "balance": "80000"
    },
    {
      "address": "3KTeq879YjzhqkAXzZmdapJAVC6qz5qEth",
      "coin": "btc",
      "chain": "mainnet",
      "balance": "264148085712"
    },
    {
      "address": "35ULMyVnFoYaPaMxwHTRmaGdABpAThM4QR",
      "coin": "btc",
      "chain": "mainnet",
      "balance": "2601100000"
    }
  ],
  "statusCode": 200
}
```

### Difficulty endpoint

- `chain`: Optional chain to query, defaults to `mainnet`

```json
{
  "id": "1",
  "data": {
    "endpoint": "difficulty"
  }
}
```

#### Output

```json
{
    "jobRunID": "1",
    "data": {
        "result": 23137439666472
    },
    "result": 23137439666472,
    "statusCode": 200
}
```

### Height endpoint

- `chain`: Optional chain to query, defaults to `mainnet`

```json
{
  "id": "1",
  "data": {
    "endpoint": "height"
  }
}
```

#### Output

```json
{
    "jobRunID": "1",
    "data": {
        "result": 678212
    },
    "result": 678212,
    "statusCode": 200
}
```
