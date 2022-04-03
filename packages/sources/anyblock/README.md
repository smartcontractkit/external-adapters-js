# Chainlink External Adapter for Anyblock Analytics

### Environment Variables

The adapter takes the following environment variables:

| Required? |   Name    |     Description      | Options | Defaults to |
| :-------: | :-------: | :------------------: | :-----: | :---------: |
|           | `API_KEY` | Bitex API key to use |         |             |

### Input Parameters

| Required? |    Name    |     Description     |                         Options                         | Defaults to |
| :-------: | :--------: | :-----------------: | :-----------------------------------------------------: | :---------: |
|           | `endpoint` | The endpoint to use | [vwap](#VWAP-Endpoint), [gasprice](#Gas-Price-Endpoint) |   `vwap`    |

---

## VWAP Endpoint

Endpoint to calculate the volume weighted average price (VWAP) for a price pair.

NOTE: requires an API key

### Input Params

| Required? |            Name            |                       Description                       | Options | Defaults to |
| :-------: | :------------------------: | :-----------------------------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, or `coin`  | The symbol or array of symbols of the currency to query |         |             |
|    ✅     | `quote`, `to`, or `market` |        The symbol of the currency to convert to         |         |             |

### Sample Input

Uniswap Offshift (XTF) example:

```json
{
  "id": "1",
  "data": {
    "endpoint": "vwap",
    "from": "AMPL",
    "to": "USD"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": 1.075280551563453,
  "providerStatusCode": 200,
  "statusCode": 200,
  "data": {
    "result": 1.075280551563453
  }
}
```

---

## Gas Price Endpoint

### Input Params

| Required? |    Name    |    Description    |              Options               |        Defaults to        |
| :-------: | :--------: | :---------------: | :--------------------------------: | :-----------------------: |
|    🟡     |  `speed`   | The desired speed | `slow`,`standard`,`fast`,`instant` |        `standard`         |
|    🟡     | `endpoint` |                   |                                    | `latest-minimum-gasprice` |

### Output

```json
{
  "jobRunID": "1",
  "data": {
    "health": true,
    "blockNumber": 10012565,
    "blockTime": 13.49748743718593,
    "slow": 7.590000233,
    "standard": 8.250000233,
    "fast": 12,
    "instant": 15.4,
    "result": 12000000000
  },
  "result": 12000000000,
  "statusCode": 200
}
```
