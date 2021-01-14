# Chainlink External Adapter to Synthetix Index Value

The adapter calculates a Synthetix Index value in the currency selected

## Configuration

- `DEFAULT_NETWORK` (Optional). Network to fetch the Synth Index

This adapter relies on [`token-allocation`](../../token-allocation/README.md) adapter. Required `token-allocation` input params and configuration apply to this adapter as well.

## Input Params

- `asset`, `from`: Synthx Index asset to fetch
- `network` (optional): Network to fetch. `mainnet` by default

## Output

```json
{
  "jobRunID": "1",
  "data": {
    "result": 5437.703929431527,
    "index": [
      {
        "asset": "COMP",
        "units": "1.88",
        "currency": "EUR",
        "price": 182.14680289065626
      },
      {
        "asset": "MKR",
        "units": "0.39",
        "currency": "EUR",
        "price": 1262.5978382013448
      },
      {
        "asset": "AAVE",
        "units": "8.41",
        "currency": "EUR",
        "price": 121.00215356472829
      },
      {
        "asset": "UMA",
        "units": "19.47",
        "currency": "EUR",
        "price": 7.5755951255041305
      },
      {
        "asset": "SNX",
        "units": "109.93",
        "currency": "EUR",
        "price": 12.811914488815303
      },
      {
        "asset": "REN",
        "units": "598.03",
        "currency": "EUR",
        "price": 0.37760870481324815
      },
      {
        "asset": "UNI",
        "units": "92.09",
        "currency": "EUR",
        "price": 5.80892687471277
      },
      {
        "asset": "KNC",
        "units": "159.13",
        "currency": "EUR",
        "price": 0.8857903894336143
      },
      {
        "asset": "CRV",
        "units": "253.8",
        "currency": "EUR",
        "price": 0.6053877910688364
      },
      {
        "asset": "WNXM",
        "units": "4.53",
        "currency": "EUR",
        "price": 46.78300431544186
      },
      {
        "asset": "YFI",
        "units": "0.023",
        "currency": "EUR",
        "price": 27490.29262218677
      },
      {
        "asset": "BAL",
        "units": "9.05",
        "currency": "EUR",
        "price": 14.336318147548942
      }
    ]
  },
  "result": 5437.703929431527,
  "statusCode": 200
}

```
