# Chainlink External Adapter to reduce input array, resulting in single output value

## Input Params

- `reducer`: The reducer this adapter will use on the input. Options are: `sum`, `product`, `min`, `max`, `average`, `median`
- `initialValue`: If `initialValue` is not provided reasonable defaults are going to be used, depending on the `reducer`.
- `dataPath`: Optional path where to find the input array to reduce, defaults to `result`
- `valuePath`: Optional path where to find the property to be accumulated by the reducer, defaults to `''`

```json
{
  "id": "1",
  "data": {
    "reducer": "sum",
    "initialValue": 0,
    "dataPath": "addresses",
    "valuePath": "balance",
    "addresses": [
      {
        "address": "3D8DJLwUXFfZvE8yJRu729MZ8uLy25SuLz",
        "coin": "btc",
        "chain": "main",
        "balance": 44900000000
      },
      {
        "address": "3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1",
        "coin": "btc",
        "chain": "main",
        "balance": 9899463044
      },
      {
        "address": "38bzm6nhQMFJe71jJw1U7CbgNrVNpkonZF",
        "coin": "btc",
        "chain": "main",
        "balance": 307499838499
      },
      {
        "address": "3ANaBZ6odMrzdg9xifgRNxAUFUxnReesws",
        "coin": "btc",
        "chain": "main",
        "balance": 904070305884
      },
      {
        "address": "3FFgKaYkEf1M73QtzuY9DGqC7VeM2sAQhT",
        "coin": "btc",
        "chain": "main",
        "balance": 80000
      },
      {
        "address": "3KTeq879YjzhqkAXzZmdapJAVC6qz5qEth",
        "coin": "btc",
        "chain": "main",
        "balance": 264148085712
      },
      {
        "address": "35ULMyVnFoYaPaMxwHTRmaGdABpAThM4QR",
        "coin": "btc",
        "chain": "main",
        "balance": 2601100000
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
    "result": 1533118873139
  },
  "result": 1533118873139,
  "statusCode": 200
}
```
