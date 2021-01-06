# Chainlink external adapter factories

Factories for specific external adapter implementations

# Factories

## Balance

Queries the balance from an address of a given coin and chain

### Input

- `dataPath`: Optional path where to find the addresses array, defaults to `addresses`
- `confirmations`: Optional confirmations param, defaults to `6`

- `addresses`: A list of addresses to query

```
  [
    {
        address: Address to query
        coin: Optional currency to query, defaults to btc.
        chain: Optional chain to query, defaults to mainnet.
    },
    ...
  ]
```

### Output

```
[
    {
        address: string
        balance: number
        coin: string
        chain: string
        warning?: string
    },
    ...
]
```
